"""
Sincronização de disciplinas e professores do aluno a partir do SUAP.

O boletim oficial do SUAP expõe o ``codigo_diario`` de cada disciplina. Com ele
consultamos os professores do diário e persistimos o vínculo
professor→disciplina localmente, para que o professor apareça nas solicitações
do aluno mesmo antes de ele próprio acessar o sistema.

Como a API pode variar (o ``codigo_diario`` é uma string e o endpoint de
professores espera um inteiro), usamos duas fontes: primeiro o endpoint de
professores do diário; se ele não responder, caímos para ``meus-diarios``, que
já traz os professores embutidos. As chamadas são feitas em paralelo para
reduzir a latência.
"""
import asyncio
import logging
from datetime import date

import httpx
from sqlmodel import select

from models.associativas.professor_disciplina import ProfessorDisciplina
from models.associativas.aluno_disciplina import AlunoDisciplina
from models.disciplina import Disciplina
from models.users.professor import Professor
from models.users.user import Usuario

logger = logging.getLogger(__name__)

SUAP_BASE = "https://suap.ifrn.edu.br/api"
TIMEOUT = 8.0


def _extrair_itens(dados: dict | list | None) -> list:
    if isinstance(dados, list):
        return dados
    if isinstance(dados, dict):
        itens = dados.get("results")
        return itens if isinstance(itens, list) else [dados]
    return []


async def _get_suap(client: httpx.AsyncClient, url: str, token: str):
    for auth in ("Bearer", "JWT"):
        try:
            r = await client.get(
                url,
                headers={"Authorization": f"{auth} {token}"},
                timeout=TIMEOUT,
                follow_redirects=True,
            )
            if r.status_code == 200:
                return r.json()
            logger.debug(f"SUAP GET {url} -> {r.status_code}")
        except Exception as e:
            logger.warning(f"SUAP GET {url} ({auth}) falhou: {e}")
    return None


def _nome_professor(dados_prof: dict) -> str:
    return (dados_prof.get("nome") or dados_prof.get("nome_usual") or "").strip()


def _garantir_disciplina(session, nome: str) -> Disciplina:
    nome = nome.strip()
    disciplina = session.exec(select(Disciplina).where(Disciplina.nome == nome)).first()
    if not disciplina:
        disciplina = Disciplina(nome=nome)
        session.add(disciplina)
        session.commit()
        session.refresh(disciplina)
    return disciplina


def _garantir_professor(session, dados_prof: dict) -> Professor | None:
    """Garante um registro local de professor a partir dos dados oficiais do SUAP."""
    matricula = str(dados_prof.get("matricula") or "").strip()
    nome = _nome_professor(dados_prof)
    if not matricula or not nome:
        return None

    usuario = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    if not usuario:
        email = (dados_prof.get("email") or "").strip() or f"{matricula}@academico.ifrn.edu.br"
        if session.exec(select(Usuario).where(Usuario.email == email)).first():
            email = f"{matricula}@academico.ifrn.edu.br"
        usuario = Usuario(nome=nome, email=email, matricula=matricula, senha="auth_suap")
        session.add(usuario)
        session.commit()
        session.refresh(usuario)

    prof = session.exec(select(Professor).where(Professor.id == usuario.id)).first()
    if not prof:
        prof = Professor(id=usuario.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)
    return prof


def _persistir_professores(session, disciplina: Disciplina, dados_profs: list) -> int:
    """Vincula os professores (dados do SUAP) à disciplina. Retorna quantos vínculos novos."""
    novos = 0
    for dados_prof in dados_profs:
        prof = _garantir_professor(session, dados_prof)
        if not prof:
            continue
        link = session.exec(
            select(ProfessorDisciplina)
            .where(ProfessorDisciplina.professor_id == prof.id)
            .where(ProfessorDisciplina.disciplina_id == disciplina.id)
        ).first()
        if not link:
            session.add(
                ProfessorDisciplina(professor_id=prof.id, disciplina_id=disciplina.id)
            )
            novos += 1
    if novos:
        session.commit()
    return novos


def _persistir_aluno_disciplina(session, aluno_id: int, disciplina: Disciplina) -> None:
    """Vincula o aluno à disciplina (idempotente)."""
    link = session.exec(
        select(AlunoDisciplina)
        .where(AlunoDisciplina.aluno_id == aluno_id)
        .where(AlunoDisciplina.disciplina_id == disciplina.id)
    ).first()
    if not link:
        session.add(AlunoDisciplina(aluno_id=aluno_id, disciplina_id=disciplina.id))
        session.commit()


async def sincronizar_disciplinas_aluno(
    session,
    suap_token: str,
    ano: int | None = None,
    aluno_id: int | None = None,
) -> list[str]:
    """Consulta o boletim do aluno no SUAP e persiste disciplinas + professores.

    Quando ``aluno_id`` é informado, também persiste o vínculo aluno→disciplina
    (usado para exibir o CA/TAL aberto apenas para alunos da disciplina).

    Retorna os nomes das disciplinas encontradas (sem duplicatas).
    """
    ano = ano or date.today().year
    nomes: list[str] = []
    itens_boletim: list[tuple[str, object]] = []  # (nome_disciplina, codigo_diario)
    total_vinculos = 0

    async with httpx.AsyncClient() as client:
        # 1) Boletim dos dois semestres, em paralelo.
        boletins = await asyncio.gather(
            *[
                _get_suap(client, f"{SUAP_BASE}/ensino/meu-boletim/{ano}/{sem}/", suap_token)
                for sem in (1, 2)
            ]
        )
        for boletim in boletins:
            for item in _extrair_itens(boletim):
                nome = (
                    item.get("disciplina")
                    or item.get("componente_curricular")
                    or item.get("componente_curricular_nome")
                    or item.get("descricao")
                )
                if not nome:
                    continue
                nome = str(nome).strip()
                if nome not in nomes:
                    nomes.append(nome)
                itens_boletim.append((nome, item.get("codigo_diario")))

        # 2) Professores de cada diário, em paralelo.
        codigos = [c for _, c in itens_boletim if c is not None]
        profs_por_codigo: dict[str, list] = {}
        if codigos:
            respostas = await asyncio.gather(
                *[
                    _get_suap(client, f"{SUAP_BASE}/ensino/diarios/{c}/professores/", suap_token)
                    for c in codigos
                ]
            )
            for codigo, resposta in zip(codigos, respostas):
                profs_por_codigo[str(codigo)] = _extrair_itens(resposta)

        # 3) Fallback (só se faltar professor): diários do próprio usuário.
        profs_por_id: dict[str, list] = {}
        profs_por_nome: dict[str, list] = {}
        if any(not profs_por_codigo.get(str(c)) for _, c in itens_boletim):
            diarios = await asyncio.gather(
                *[
                    _get_suap(client, f"{SUAP_BASE}/ensino/meus-diarios/{ano}/{sem}/", suap_token)
                    for sem in (1, 2)
                ]
            )
            for lista in diarios:
                for item in _extrair_itens(lista):
                    profs = item.get("professores") or []
                    if not profs:
                        continue
                    if item.get("id") is not None:
                        profs_por_id[str(item["id"])] = profs
                    nome_diario = item.get("componente_curricular") or item.get("disciplina")
                    if nome_diario:
                        profs_por_nome[str(nome_diario).strip()] = profs

        # 4) Persiste os vínculos.
        for nome, codigo in itens_boletim:
            dados_profs = profs_por_codigo.get(str(codigo)) or []
            if not dados_profs:
                dados_profs = profs_por_id.get(str(codigo)) or profs_por_nome.get(nome) or []
            disciplina = _garantir_disciplina(session, nome)
            if aluno_id is not None:
                _persistir_aluno_disciplina(session, aluno_id, disciplina)
            if not dados_profs:
                continue
            total_vinculos += _persistir_professores(session, disciplina, dados_profs)

    logger.info(
        f"SUAP sync aluno: {len(nomes)} disciplinas, {total_vinculos} novos vínculos professor→disciplina"
    )
    return nomes
