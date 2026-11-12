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
from datetime import date, datetime, timedelta

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

# Cooldown para evitar consultar o SUAP a cada login do aluno. Como a fonte de
# verdade é o próprio SUAP, mas os dados mudam pouco ao longo do dia, mantemos um
# cache em memória: dentro da janela usamos o que já está no banco local.
COOLDOWN_SEGUNDOS = 600
_ultimo_sync: dict[int, datetime] = {}


def _disciplinas_locais(session, aluno_id: int) -> list[str]:
    """Nomes das disciplinas já sincronizadas localmente para o aluno."""
    disciplinas = session.exec(
        select(Disciplina)
        .join(AlunoDisciplina, AlunoDisciplina.disciplina_id == Disciplina.id)
        .where(AlunoDisciplina.aluno_id == aluno_id)
    ).all()
    return [d.nome for d in disciplinas if d.nome]


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


def _persistir_vinculos(
    session,
    aluno_id: int | None,
    itens_boletim: list[tuple[str, object]],
    profs_por_codigo: dict[str, list],
    profs_por_id: dict[str, list],
    profs_por_nome: dict[str, list],
) -> int:
    """Persiste disciplinas, vínculos aluno→disciplina e professor→disciplina.

    Tudo é resolvido em consultas em lote e gravado com um único ``commit``.
    Antes, cada disciplina/professor gerava selects e commits isolados e, com a
    latência do banco (~250 ms por ida), a sincronização levava dezenas de
    segundos. Retorna quantos vínculos professor→disciplina foram criados.
    """
    nomes: list[str] = []
    for nome, _ in itens_boletim:
        if nome not in nomes:
            nomes.append(nome)
    if not nomes:
        return 0

    # Disciplinas: uma única consulta traz todas as que já existem.
    mapa_disc = {
        d.nome: d
        for d in session.exec(
            select(Disciplina).where(Disciplina.nome.in_(nomes))
        ).all()
    }
    for nome in nomes:
        if nome not in mapa_disc:
            disciplina = Disciplina(nome=nome)
            session.add(disciplina)
            mapa_disc[nome] = disciplina
    session.flush()

    # Vínculo aluno → disciplinas (idempotente, em lote).
    if aluno_id is not None:
        ja_vinculadas = set(
            session.exec(
                select(AlunoDisciplina.disciplina_id).where(
                    AlunoDisciplina.aluno_id == aluno_id
                )
            ).all()
        )
        for disciplina in mapa_disc.values():
            if disciplina.id not in ja_vinculadas:
                session.add(
                    AlunoDisciplina(aluno_id=aluno_id, disciplina_id=disciplina.id)
                )

    # Professores: agrupa os dados oficiais por disciplina.
    dados_prof_por_matricula: dict[str, dict] = {}
    profs_por_disciplina: dict[int, set[str]] = {}
    for nome, codigo in itens_boletim:
        dados_profs = (
            profs_por_codigo.get(str(codigo))
            or profs_por_id.get(str(codigo))
            or profs_por_nome.get(nome)
            or []
        )
        disciplina = mapa_disc.get(nome)
        if not dados_profs or disciplina is None:
            continue
        matriculas_da_disciplina = profs_por_disciplina.setdefault(disciplina.id, set())
        for dados_prof in dados_profs:
            matricula = str(dados_prof.get("matricula") or "").strip()
            if not matricula or not _nome_professor(dados_prof):
                continue
            dados_prof_por_matricula[matricula] = dados_prof
            matriculas_da_disciplina.add(matricula)

    if not dados_prof_por_matricula:
        session.commit()
        return 0

    # Usuários: uma consulta para todas as matrículas, uma para os e-mails.
    matriculas = set(dados_prof_por_matricula)
    usuarios = {
        u.matricula: u
        for u in session.exec(
            select(Usuario).where(Usuario.matricula.in_(matriculas))
        ).all()
    }
    faltantes = matriculas - set(usuarios)
    if faltantes:
        emails = {
            m: (
                (dados_prof_por_matricula[m].get("email") or "").strip()
                or f"{m}@academico.ifrn.edu.br"
            )
            for m in faltantes
        }
        emails_em_uso = set(
            session.exec(
                select(Usuario.email).where(Usuario.email.in_(set(emails.values())))
            ).all()
        )
        for matricula, email in emails.items():
            if email in emails_em_uso:
                email = f"{matricula}@academico.ifrn.edu.br"
            emails_em_uso.add(email)
            usuario = Usuario(
                nome=_nome_professor(dados_prof_por_matricula[matricula]),
                email=email,
                matricula=matricula,
                senha="auth_suap",
            )
            session.add(usuario)
            usuarios[matricula] = usuario
        session.flush()

    ids_usuarios = [u.id for u in usuarios.values()]
    professores = {
        p.id: p
        for p in session.exec(
            select(Professor).where(Professor.id.in_(ids_usuarios))
        ).all()
    }
    for usuario_id in ids_usuarios:
        if usuario_id not in professores:
            professor = Professor(id=usuario_id)
            session.add(professor)
            professores[usuario_id] = professor
    session.flush()

    # Vínculos professor → disciplina (idempotente, em lote).
    disciplina_ids = set(profs_por_disciplina)
    desejados = {
        (usuarios[matricula].id, disciplina_id)
        for disciplina_id, matriculas_da_disciplina in profs_por_disciplina.items()
        for matricula in matriculas_da_disciplina
    }
    existentes = {
        (link.professor_id, link.disciplina_id)
        for link in session.exec(
            select(ProfessorDisciplina)
            .where(ProfessorDisciplina.professor_id.in_(set(professores)))
            .where(ProfessorDisciplina.disciplina_id.in_(disciplina_ids))
        ).all()
    }
    novos = 0
    for professor_id, disciplina_id in desejados - existentes:
        session.add(
            ProfessorDisciplina(professor_id=professor_id, disciplina_id=disciplina_id)
        )
        novos += 1

    session.commit()
    return novos


async def sincronizar_disciplinas_aluno(
    session,
    suap_token: str,
    ano: int | None = None,
    aluno_id: int | None = None,
    forcar: bool = False,
) -> list[str]:
    """Consulta o boletim do aluno no SUAP e persiste disciplinas + professores.

    Quando ``aluno_id`` é informado, também persiste o vínculo aluno→disciplina
    (usado para exibir o CA/TAL aberto apenas para alunos da disciplina).

    Respeita um cooldown (``COOLDOWN_SEGUNDOS``): se o aluno já foi sincronizado
    recentemente, usa os dados locais em vez de chamar o SUAP de novo — a menos
    que ``forcar=True``. Retorna os nomes das disciplinas encontradas.
    """
    ano = ano or date.today().year

    # Cooldown: evita chamadas repetidas ao SUAP dentro da janela.
    if aluno_id is not None and not forcar:
        ultimo = _ultimo_sync.get(aluno_id)
        if ultimo and datetime.now() - ultimo < timedelta(seconds=COOLDOWN_SEGUNDOS):
            locais = _disciplinas_locais(session, aluno_id)
            logger.info(
                f"SUAP sync aluno {aluno_id} em cooldown: {len(locais)} disciplinas locais"
            )
            return locais

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

        # 4) Persiste os vínculos (consultas em lote + commit único).
        try:
            total_vinculos = _persistir_vinculos(
                session,
                aluno_id,
                itens_boletim,
                profs_por_codigo,
                profs_por_id,
                profs_por_nome,
            )
        except Exception as e:
            session.rollback()
            logger.warning(f"Falha ao persistir vínculos do aluno {aluno_id}: {e}")

    if aluno_id is not None:
        _ultimo_sync[aluno_id] = datetime.now()

    logger.info(
        f"SUAP sync aluno: {len(nomes)} disciplinas, {total_vinculos} novos vínculos professor→disciplina"
    )
    return nomes

