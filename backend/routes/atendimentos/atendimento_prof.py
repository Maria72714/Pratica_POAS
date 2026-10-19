from fastapi import APIRouter, HTTPException, Depends
from models.atendimento import Atendimento
from models.solicitacao import Solicitacao
from models.users.user import Usuario
from models.users.professor import Professor
from models.disciplina import Disciplina
from models.associativas.aluno_atendimento import AlunoAtendimento
from deps.deps import SessionDep
from deps.auth import AuthUser, get_current_user, require_roles, assert_self_or_roles
from routes.atendimentos.atendimento import AtendimentoCreateModel
from services.atendimento_service import AtendimentoService
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional, Annotated


router = APIRouter(
    prefix='/atendimentos',
    tags=['Atendimentos']
)


@router.get("/professor/{professor_matricula}")
def listar_atendimentos_professor(
    professor_matricula: str,
    session: SessionDep,
    current_user: Annotated[AuthUser, Depends(get_current_user)] = None,
):
    assert_self_or_roles(current_user, professor_matricula, "admin", "mediador")

    usuario = session.exec(
        select(Usuario).where(Usuario.matricula == professor_matricula)
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")

    professor = session.exec(
        select(Professor).where(Professor.id == usuario.id)
    ).first()

    if not professor:
        raise HTTPException(status_code=404, detail="Perfil de professor não encontrado.")

    atendimentos = session.exec(
        select(Atendimento).where(Atendimento.id_professor == professor.id)
    ).all()

    # Carrega em lote os dados relacionados (disciplinas, solicitações, alunos,
    # associações) para evitar dezenas de consultas ao banco por página (N+1).
    disc_ids = {a.id_disciplina for a in atendimentos if a.id_disciplina}
    sol_ids = {a.id_solicitacao for a in atendimentos if a.id_solicitacao}
    at_ids = {a.id for a in atendimentos}

    disc_map = {
        d.id: d
        for d in session.exec(select(Disciplina).where(Disciplina.id.in_(disc_ids))).all()
    } if disc_ids else {}
    sol_map = {
        s.id: s
        for s in session.exec(select(Solicitacao).where(Solicitacao.id.in_(sol_ids))).all()
    } if sol_ids else {}
    assoc_map: dict[int, int] = {}
    if at_ids:
        for aa in session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id.in_(at_ids))
        ).all():
            assoc_map.setdefault(aa.atendimento_id, aa.aluno_id)

    aluno_ids = set()
    for a in atendimentos:
        aluno_id = assoc_map.get(a.id)
        if aluno_id is None and a.id_solicitacao in sol_map:
            aluno_id = sol_map[a.id_solicitacao].id_aluno
        if aluno_id:
            aluno_ids.add(aluno_id)
    usuario_map = {
        u.id: u
        for u in session.exec(select(Usuario).where(Usuario.id.in_(aluno_ids))).all()
    } if aluno_ids else {}

    resultado = []
    for a in atendimentos:
        disciplina = disc_map.get(a.id_disciplina) if a.id_disciplina else None

        sol = sol_map.get(a.id_solicitacao) if a.id_solicitacao else None
        id_mediador = sol.id_mediador if sol else None

        aluno_id = assoc_map.get(a.id)
        if aluno_id is None and sol:
            aluno_id = sol.id_aluno
        u_aluno = usuario_map.get(aluno_id) if aluno_id else None
        aluno_nome = u_aluno.nome if u_aluno else None
        aluno_matricula = u_aluno.matricula if u_aluno else None

        resultado.append({
            "id": a.id,
            "id_professor": a.id_professor,
            "id_turma": a.id_turma,
            "id_disciplina": a.id_disciplina,
            "id_solicitacao": a.id_solicitacao,
            "id_horario": a.id_horario,
            "id_sala": a.id_sala,
            "data_atendimento": a.data_atendimento.isoformat() if a.data_atendimento else None,
            "tipo_atendimento": a.tipo_atendimento.value if hasattr(a.tipo_atendimento, "value") else str(a.tipo_atendimento),
            "modalidade": a.modalidade.value if hasattr(a.modalidade, "value") else str(a.modalidade),
            "assunto": a.assunto,
            "relatorio": a.relatorio,
            "link_ca_online": a.link_ca_online,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "disciplina_nome": disciplina.nome if disciplina else "Geral",
            "id_mediador": id_mediador,  # Selo do Mediador
            "aluno_nome": aluno_nome or "Aluno Geral",
            "aluno_matricula": aluno_matricula or "—",
            "aluno_id": aluno_id,
        })

    return resultado


@router.get("/admin/todos")
def listar_atendimentos_admin(
    session: SessionDep,
    current_user: Annotated[AuthUser, Depends(require_roles("admin"))] = None,
):
    """Visão administrativa: lista todos os atendimentos com dados enriquecidos
    (aluno, professor, disciplina, selo e link do CA Online) para acompanhamento
    e acesso ao chat."""
    atendimentos = session.exec(
        select(Atendimento).order_by(Atendimento.data_atendimento.desc())
    ).all()

    disc_ids = {a.id_disciplina for a in atendimentos if a.id_disciplina}
    sol_ids = {a.id_solicitacao for a in atendimentos if a.id_solicitacao}
    at_ids = {a.id for a in atendimentos}
    prof_ids = {a.id_professor for a in atendimentos if a.id_professor}

    disc_map = {
        d.id: d
        for d in session.exec(select(Disciplina).where(Disciplina.id.in_(disc_ids))).all()
    } if disc_ids else {}
    sol_map = {
        s.id: s
        for s in session.exec(select(Solicitacao).where(Solicitacao.id.in_(sol_ids))).all()
    } if sol_ids else {}
    assoc_map: dict[int, int] = {}
    if at_ids:
        for aa in session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id.in_(at_ids))
        ).all():
            assoc_map.setdefault(aa.atendimento_id, aa.aluno_id)

    usuario_ids = set(prof_ids)
    for a in atendimentos:
        aluno_id = assoc_map.get(a.id)
        if aluno_id is None and a.id_solicitacao in sol_map:
            aluno_id = sol_map[a.id_solicitacao].id_aluno
        if aluno_id:
            usuario_ids.add(aluno_id)
        if a.id_solicitacao in sol_map and sol_map[a.id_solicitacao].id_mediador:
            usuario_ids.add(sol_map[a.id_solicitacao].id_mediador)

    usuario_map = {
        u.id: u
        for u in session.exec(select(Usuario).where(Usuario.id.in_(usuario_ids))).all()
    } if usuario_ids else {}

    resultado = []
    for a in atendimentos:
        disciplina = disc_map.get(a.id_disciplina) if a.id_disciplina else None
        u_prof = usuario_map.get(a.id_professor) if a.id_professor else None

        sol = sol_map.get(a.id_solicitacao) if a.id_solicitacao else None
        id_mediador = sol.id_mediador if sol else None

        aluno_id = assoc_map.get(a.id)
        if aluno_id is None and sol:
            aluno_id = sol.id_aluno
        u_aluno = usuario_map.get(aluno_id) if aluno_id else None

        resultado.append({
            "id": a.id,
            "assunto": a.assunto or "Atendimento",
            "tipo_atendimento": a.tipo_atendimento.value if hasattr(a.tipo_atendimento, "value") else str(a.tipo_atendimento),
            "modalidade": a.modalidade.value if hasattr(a.modalidade, "value") else str(a.modalidade),
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "data_atendimento": a.data_atendimento.isoformat() if a.data_atendimento else None,
            "link_ca_online": a.link_ca_online,
            "disciplina_nome": disciplina.nome if disciplina else "Geral",
            "professor_nome": u_prof.nome if u_prof else None,
            "aluno_nome": u_aluno.nome if u_aluno else None,
            "aluno_matricula": u_aluno.matricula if u_aluno else None,
            "id_mediador": id_mediador,
            "tem_selo": bool(id_mediador),
        })

    return resultado


@router.post("/professor")
def criar_atendimento_professor(
    dados: AtendimentoCreateModel,
    session: SessionDep,
    current_user: Annotated[AuthUser, Depends(require_roles("professor", "admin"))] = None,
):
    """Cria um atendimento a partir do fluxo do professor.

    Para contas de professor, o vínculo é sempre o próprio usuário logado
    (a matrícula enviada no corpo é ignorada por segurança).
    """
    if current_user.role == "professor":
        dados.professor_matricula = current_user.matricula

    atendimento = AtendimentoService(session).criar_atendimento(dados)
    return {
        "id": atendimento.id,
        "message": "Atendimento cadastrado com sucesso!",
    }
