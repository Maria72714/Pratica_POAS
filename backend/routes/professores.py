from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from pydantic import BaseModel
from typing import Annotated, List, Optional
from datetime import date

from deps.deps import SessionDep
from deps.auth import AuthUser, get_current_user
from models.users.user import Usuario
from models.users.professor import Professor
from models.disciplina import Disciplina
from models.turma import Turma
from models.associativas.professor_disciplina import ProfessorDisciplina
from models.associativas.professor_turma import ProfessorTurma
from data.cursos import CURSOS, get_curso
from data.turmas import get_turmas, get_turma

router = APIRouter(
    prefix="/professores",
    tags=["Professores"]
)


class VinculoTurmaInput(BaseModel):
    """Vínculo de uma turma com as disciplinas que o professor ministra nela."""
    turma_id: str
    disciplinas: List[str]


class ComplementarPerfilProfessorInput(BaseModel):
    """Novo formato: vínculos turma→disciplinas. Compatibilidade: campos legados opcionais."""
    vinculos: List[VinculoTurmaInput]
    # Legado (ignorado se vinculos estiver presente)
    disciplinas: Optional[List[str]] = None
    turmas: Optional[List[str]] = None
    departamento: Optional[str] = None
    biografia: Optional[str] = None


@router.get("/dados-complementares")
def obter_dados_complementares():
    """
    Retorna catálogo completo de cursos, disciplinas e turmas para
    o formulário de complemento de perfil do professor.
    """
    # Extrai todas as disciplinas únicas do catálogo de cursos
    disciplinas_set = set()
    cursos_resumidos = []

    for curso in CURSOS:
        curso_disciplinas = set()
        for ano in curso.get("anos", []):
            for d in ano.get("disciplinas", []):
                disciplinas_set.add(d)
                curso_disciplinas.add(d)
        cursos_resumidos.append({
            "id": curso["id"],
            "nome": curso["nome"],
            "disciplinas": sorted(list(curso_disciplinas))
        })

    turmas = get_turmas()

    return {
        "cursos": cursos_resumidos,
        "todas_disciplinas": sorted(list(disciplinas_set)),
        "turmas": turmas
    }


@router.post("/sincronizar-suap")
async def sincronizar_disciplinas_suap(
    current_user: Annotated[AuthUser, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Sincroniza as disciplinas do professor a partir dos diários oficiais do SUAP
    (fonte de verdade). Substitui a seleção manual de disciplinas.
    """
    import httpx

    from services.suap_token_store import obter_token

    token_suap = obter_token(current_user.id)
    if not token_suap:
        raise HTTPException(
            status_code=401,
            detail="Sessão do SUAP expirada. Faça login novamente pelo SUAP para sincronizar as disciplinas.",
        )

    ano_atual = date.today().year
    diarios: List[dict] = []

    async with httpx.AsyncClient() as client:
        for periodo in (1, 2):
            url = f"https://suap.ifrn.edu.br/api/ensino/meus-diarios/{ano_atual}/{periodo}/"
            try:
                resposta = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {token_suap}"},
                    timeout=8.0,
                    follow_redirects=True,
                )
            except Exception:
                continue
            if resposta.status_code != 200:
                continue
            dados = resposta.json()
            itens = dados.get("results") if isinstance(dados, dict) else dados
            for item in itens or []:
                nome = item.get("componente_curricular") or item.get("disciplina")
                if not nome:
                    continue
                diarios.append({
                    "componente_curricular": str(nome).strip(),
                    "ano_letivo": item.get("ano_letivo", ano_atual),
                    "periodo_letivo": item.get("periodo_letivo", periodo),
                    "locais_de_aula": item.get("locais_de_aula") or [],
                })

    # Persiste os vínculos do professor com as disciplinas oficiais do SUAP.
    prof = session.exec(select(Professor).where(Professor.id == current_user.id)).first()
    if not prof:
        prof = Professor(id=current_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    nomes_unicos: List[str] = []
    for diario in diarios:
        nome = diario["componente_curricular"]
        db_disc = session.exec(select(Disciplina).where(Disciplina.nome == nome)).first()
        if not db_disc:
            db_disc = Disciplina(nome=nome)
            session.add(db_disc)
            session.commit()
            session.refresh(db_disc)

        link = session.exec(
            select(ProfessorDisciplina)
            .where(ProfessorDisciplina.professor_id == prof.id)
            .where(ProfessorDisciplina.disciplina_id == db_disc.id)
        ).first()
        if not link:
            session.add(ProfessorDisciplina(professor_id=prof.id, disciplina_id=db_disc.id))

        if nome not in nomes_unicos:
            nomes_unicos.append(nome)

    session.commit()

    return {
        "disciplinas": nomes_unicos,
        "diarios": diarios,
        "ano": ano_atual,
        "total": len(nomes_unicos),
        "message": "Disciplinas sincronizadas com o SUAP.",
    }


@router.get("/disciplinas-da-turma/{turma_id:path}")
def disciplinas_da_turma(turma_id: str):
    """
    Dado um turma_id (ex: informatica_internet_2023_2M),
    retorna TODAS as disciplinas do curso agrupadas por ano.
    """
    turma = get_turma(turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail=f"Turma '{turma_id}' não encontrada.")

    curso = get_curso(turma["curso_id"])
    if not curso:
        raise HTTPException(status_code=404, detail=f"Curso '{turma['curso_id']}' não encontrado.")

    # Calcula o ano letivo atual da turma
    ano_atual = date.today().year
    posicao = ano_atual - turma["ano_ingresso"] + 1
    anos_letivos = ["1º Ano", "2º Ano", "3º Ano", "4º Ano"]
    ano_letivo_label = anos_letivos[min(posicao, len(anos_letivos)) - 1] if posicao >= 1 else anos_letivos[0]

    # Todas as disciplinas do curso agrupadas por ano
    todas_disciplinas_flat = []
    disciplinas_por_ano = []
    for ano_data in curso["anos"]:
        todas_disciplinas_flat.extend(ano_data["disciplinas"])
        disciplinas_por_ano.append({
            "ano": ano_data["ano"],
            "disciplinas": ano_data["disciplinas"],
            "is_ano_atual": ano_data["ano"] == ano_letivo_label
        })

    return {
        "turma_id": turma_id,
        "turma_nome": turma["nome"],
        "curso_id": turma["curso_id"],
        "curso_nome": turma["curso_nome"],
        "ano_letivo_atual": ano_letivo_label,
        "disciplinas_por_ano": disciplinas_por_ano,
        "todas_disciplinas": sorted(list(set(todas_disciplinas_flat)))
    }


@router.get("/perfil/{matricula_ou_id}")
def obter_perfil_professor(matricula_ou_id: str, session: SessionDep):
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário professor não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        # Se usuário existe mas ainda não tinha registro na tabela professores, cria automaticamente
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    # Busca disciplinas vinculadas
    disciplinas_nomes = [d.nome for d in prof.disciplinas] if prof.disciplinas else []
    turmas_codigos = [f"{t.ano}_{t.codigo}" for t in prof.turmas] if prof.turmas else []

    return {
        "id": db_user.id,
        "nome": db_user.nome,
        "email": db_user.email,
        "matricula": db_user.matricula,
        "disciplinas": disciplinas_nomes,
        "turmas": turmas_codigos,
        "perfil_completo": len(disciplinas_nomes) > 0 or len(turmas_codigos) > 0
    }


@router.post("/perfil/{matricula_ou_id}")
def complementar_perfil_professor(
    matricula_ou_id: str,
    payload: ComplementarPerfilProfessorInput,
    session: SessionDep
):
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    # Limpa vínculos antigos de disciplinas e turmas
    links_disc = session.exec(select(ProfessorDisciplina).where(ProfessorDisciplina.professor_id == prof.id)).all()
    for l in links_disc:
        session.delete(l)

    links_turma = session.exec(select(ProfessorTurma).where(ProfessorTurma.professor_id == prof.id)).all()
    for l in links_turma:
        session.delete(l)

    session.commit()

    # Processa os vínculos turma→disciplinas
    todas_disciplinas_salvas = []
    todas_turmas_salvas = []

    for vinculo in payload.vinculos:
        turma_id_str = vinculo.turma_id.strip()
        if not turma_id_str:
            continue

        # Busca ou cria a turma
        db_turma = session.exec(select(Turma).where(Turma.codigo == turma_id_str)).first()
        if not db_turma:
            # Tenta parsear o ID para extrair informações
            parts = turma_id_str.rsplit("_", 2)
            ano_str = parts[1] if len(parts) >= 3 else "2026"
            codigo_str = parts[2] if len(parts) >= 3 else turma_id_str[-2:]
            db_turma = Turma(ano=ano_str, turno="Flexível", codigo=codigo_str)
            session.add(db_turma)
            session.commit()
            session.refresh(db_turma)

        link_t = ProfessorTurma(professor_id=prof.id, turma_id=db_turma.id)
        session.add(link_t)
        todas_turmas_salvas.append(turma_id_str)

        # Vincula disciplinas desta turma
        for disc_nome in vinculo.disciplinas:
            d_nome = disc_nome.strip()
            if not d_nome:
                continue
            db_disc = session.exec(select(Disciplina).where(Disciplina.nome == d_nome)).first()
            if not db_disc:
                db_disc = Disciplina(nome=d_nome)
                session.add(db_disc)
                session.commit()
                session.refresh(db_disc)

            link_d = ProfessorDisciplina(professor_id=prof.id, disciplina_id=db_disc.id)
            session.add(link_d)
            if d_nome not in todas_disciplinas_salvas:
                todas_disciplinas_salvas.append(d_nome)

    session.commit()

    return {
        "message": "Perfil do professor atualizado com vínculos turma→disciplinas!",
        "professor_id": prof.id,
        "vinculos": [{"turma_id": v.turma_id, "disciplinas": v.disciplinas} for v in payload.vinculos],
        "disciplinas": todas_disciplinas_salvas,
        "turmas": todas_turmas_salvas,
        "perfil_completo": True
    }


class HorarioProfessorInput(BaseModel):
    dia_semana: str
    hora_inicio: str
    hora_fim: str
    local: Optional[str] = "Sala de Professores"
    modalidade: Optional[str] = "Presencial"
    disciplina: Optional[str] = "Todas as disciplinas"


@router.get("/{matricula_ou_id}/horarios")
def listar_horarios_professor(matricula_ou_id: str, session: SessionDep):
    """Lista as janelas de horários disponíveis para atendimento cadastradas pelo professor."""
    from models.professor_horario import ProfessorHorario

    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    horarios = session.exec(
        select(ProfessorHorario)
        .where(ProfessorHorario.id_professor == prof.id)
        .order_by(ProfessorHorario.id)
    ).all()

    # Se ainda não possui horários cadastrados, adiciona sementes padrão
    if not horarios:
        sementes = [
            ProfessorHorario(
                id_professor=prof.id,
                dia_semana="Terça-feira",
                hora_inicio="14:00",
                hora_fim="16:00",
                local="Sala de Professores - Bloco B",
                modalidade="Presencial",
                disciplina="Todas as disciplinas",
                ativo=True
            ),
            ProfessorHorario(
                id_professor=prof.id,
                dia_semana="Quinta-feira",
                hora_inicio="10:00",
                hora_fim="12:00",
                local="Laboratório de Informática 02",
                modalidade="Presencial",
                disciplina="Todas as disciplinas",
                ativo=True
            ),
        ]
        for s in sementes:
            session.add(s)
        session.commit()
        horarios = sementes

    return [
        {
            "id": h.id,
            "id_professor": h.id_professor,
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio,
            "hora_fim": h.hora_fim,
            "local": h.local,
            "modalidade": h.modalidade,
            "disciplina": h.disciplina,
            "ativo": h.ativo,
        }
        for h in horarios
    ]


@router.post("/{matricula_ou_id}/horarios")
def adicionar_horario_professor(matricula_ou_id: str, dados: HorarioProfessorInput, session: SessionDep):
    """Cadastra um novo horário de atendimento para o professor."""
    from models.professor_horario import ProfessorHorario

    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")

    prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
    if not prof:
        prof = Professor(id=db_user.id)
        session.add(prof)
        session.commit()
        session.refresh(prof)

    novo_horario = ProfessorHorario(
        id_professor=prof.id,
        dia_semana=dados.dia_semana.strip(),
        hora_inicio=dados.hora_inicio.strip(),
        hora_fim=dados.hora_fim.strip(),
        local=dados.local.strip() if dados.local else "Sala de Professores",
        modalidade=dados.modalidade.strip() if dados.modalidade else "Presencial",
        disciplina=dados.disciplina.strip() if dados.disciplina else "Todas as disciplinas",
        ativo=True,
    )
    session.add(novo_horario)
    session.commit()
    session.refresh(novo_horario)

    return {
        "id": novo_horario.id,
        "id_professor": novo_horario.id_professor,
        "dia_semana": novo_horario.dia_semana,
        "hora_inicio": novo_horario.hora_inicio,
        "hora_fim": novo_horario.hora_fim,
        "local": novo_horario.local,
        "modalidade": novo_horario.modalidade,
        "disciplina": novo_horario.disciplina,
        "ativo": novo_horario.ativo,
        "message": "Horário de atendimento cadastrado com sucesso!"
    }


@router.delete("/{matricula_ou_id}/horarios/{horario_id}")
def remover_horario_professor(matricula_ou_id: str, horario_id: int, session: SessionDep):
    """Remove um horário de atendimento."""
    from models.professor_horario import ProfessorHorario

    h = session.get(ProfessorHorario, horario_id)
    if not h:
        raise HTTPException(status_code=404, detail="Horário não encontrado.")

    session.delete(h)
    session.commit()
    return {"message": "Horário removido com sucesso."}


@router.patch("/{matricula_ou_id}/horarios/{horario_id}/toggle")
def alternar_horario_professor(matricula_ou_id: str, horario_id: int, session: SessionDep):
    """Alterna entre ativo/inativo um horário de atendimento."""
    from models.professor_horario import ProfessorHorario

    h = session.get(ProfessorHorario, horario_id)
    if not h:
        raise HTTPException(status_code=404, detail="Horário não encontrado.")

    h.ativo = not h.ativo
    session.add(h)
    session.commit()
    return {"id": h.id, "ativo": h.ativo}



