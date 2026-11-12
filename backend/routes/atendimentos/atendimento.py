from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import date
from typing import List, Optional, Annotated

from deps.deps import SessionDep
from deps.auth import AuthUser, get_current_user
from models.atendimento import Atendimento
from services.atendimento_service import AtendimentoService
from utils.cache import cache_read

router = APIRouter(
    prefix='/atendimentos',
    tags=['Atendimentos']
)


class AtendimentoCreateModel(BaseModel):
    data_atendimento: date
    disciplina: str
    tipo_suporte: Optional[str] = None
    descricao: Optional[str] = None
    matricula: Optional[str] = None            # compatibilidade (matrícula única)
    matriculas: Optional[List[str]] = None     # nova: várias matrículas (preferível)
    professor_matricula: Optional[str] = None  # matricula do professor (opcional)
    # Campos extras usados pelo fluxo do professor (opcionais)
    assunto: Optional[str] = None
    tipo_atendimento: Optional[str] = None     # 'TAL' ou 'TAI'
    modalidade: Optional[str] = None           # 'Presencial' ou 'Remoto'
    link_ca_online: Optional[str] = None

class AtendimentoUpdateModel(BaseModel):
    status: Optional[str] = None
    link_ca_online: Optional[str] = None
    modalidade: Optional[str] = None
    data_atendimento: Optional[date] = None
    assunto: Optional[str] = None
    relatorio: Optional[str] = None

class AtendimentoResponse(BaseModel):
    id: int
    data_atendimento: date
    assunto: Optional[str]
    status: str

    class Config:
        from_attributes = True


@router.get('/', response_model=list[Atendimento])
def listar_atendimento(session: SessionDep):
    return AtendimentoService(session).listar_atendimentos()

@router.get('/aluno/{matricula}')
@cache_read(ttl=30)
def listar_atendimentos_por_matricula(matricula: str, session: SessionDep):
    return AtendimentoService(session).listar_por_matricula(matricula)

@router.get("/{atendimento_id}", response_model=Atendimento)
def buscar_atendimento_por_id(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).buscar_por_id(atendimento_id)


@router.get('/mediador/tai')
@cache_read(ttl=30)
def listar_atendimentos_mediador_tai(session: SessionDep):
    """Lista todos os atendimentos do tipo TAI para o mediador acompanhar e acessar o chat."""
    from sqlmodel import select
    from models.associativas.aluno_atendimento import AlunoAtendimento
    from models.disciplina import Disciplina
    from models.solicitacao import Solicitacao
    from models.users.user import Usuario
    from models.enums import TipoAtendimento

    atendimentos = session.exec(
        select(Atendimento)
        .where(
            (Atendimento.tipo_atendimento == TipoAtendimento.TAI) |
            (Atendimento.id_solicitacao.is_not(None))
        )
        .order_by(Atendimento.data_atendimento.desc())
    ).all()

    at_ids = {a.id for a in atendimentos}
    disc_ids = {a.id_disciplina for a in atendimentos if a.id_disciplina}
    sol_ids = {a.id_solicitacao for a in atendimentos if a.id_solicitacao}
    prof_ids = {a.id_professor for a in atendimentos if a.id_professor}

    # Carrega tudo em lote (evita N+1).
    disc_map = {
        d.id: d for d in session.exec(select(Disciplina).where(Disciplina.id.in_(disc_ids))).all()
    } if disc_ids else {}
    sol_map = {
        s.id: s for s in session.exec(select(Solicitacao).where(Solicitacao.id.in_(sol_ids))).all()
    } if sol_ids else {}

    alunos_por_atendimento: dict[int, list[int]] = {}
    if at_ids:
        for aa in session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id.in_(at_ids))
        ).all():
            alunos_por_atendimento.setdefault(aa.atendimento_id, []).append(aa.aluno_id)

    usuario_ids = set(prof_ids)
    for a in atendimentos:
        for aid in alunos_por_atendimento.get(a.id, []):
            usuario_ids.add(aid)
        sol = sol_map.get(a.id_solicitacao) if a.id_solicitacao else None
        if sol and sol.id_aluno:
            usuario_ids.add(sol.id_aluno)
        if sol and sol.id_mediador:
            usuario_ids.add(sol.id_mediador)

    usuario_map = {
        u.id: u for u in session.exec(select(Usuario).where(Usuario.id.in_(usuario_ids))).all()
    } if usuario_ids else {}

    resultado = []
    for a in atendimentos:
        disciplina = disc_map.get(a.id_disciplina) if a.id_disciplina else None

        alunos_ids = alunos_por_atendimento.get(a.id, [])
        aluno_nome = None
        aluno_matricula = None
        if alunos_ids:
            u_aluno = usuario_map.get(alunos_ids[0])
            if u_aluno:
                aluno_nome = u_aluno.nome
                aluno_matricula = u_aluno.matricula

        professor_nome = None
        if a.id_professor:
            u_prof = usuario_map.get(a.id_professor)
            if u_prof:
                professor_nome = u_prof.nome

        # Selo do Mediador
        id_mediador = None
        sol = sol_map.get(a.id_solicitacao) if a.id_solicitacao else None
        if sol:
            id_mediador = sol.id_mediador
            if not aluno_nome and sol.id_aluno:
                u_aluno = usuario_map.get(sol.id_aluno)
                if u_aluno:
                    aluno_nome = u_aluno.nome
                    aluno_matricula = u_aluno.matricula

        total_alunos = len(alunos_ids)
        if total_alunos == 0 and aluno_nome:
            total_alunos = 1

        resultado.append({
            "id": a.id,
            "assunto": a.assunto or "Atendimento TAI",
            "tipo_atendimento": a.tipo_atendimento.value if hasattr(a.tipo_atendimento, "value") else str(a.tipo_atendimento),
            "modalidade": a.modalidade.value if hasattr(a.modalidade, "value") else str(a.modalidade),
            "data_atendimento": a.data_atendimento.isoformat() if a.data_atendimento else None,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "link_ca_online": a.link_ca_online,
            "disciplina_nome": disciplina.nome if disciplina else "Disciplina TAI",
            "aluno_nome": aluno_nome,
            "aluno_matricula": aluno_matricula,
            "professor_nome": professor_nome,
            "id_mediador": id_mediador,
            "tem_selo": bool(id_mediador),
            "total_alunos": total_alunos,
        })

    return resultado


@router.post("/", response_model=AtendimentoResponse)
def criar_atendimento(dados: AtendimentoCreateModel, session: SessionDep):
    return AtendimentoService(session).criar_atendimento(dados)


@router.delete("/{atendimento_id}")
def deletar_atendimento(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).deletar_atendimento(atendimento_id)


@router.patch("/{atendimento_id}")
def editar_atendimento(atendimento_id: int, dados: AtendimentoUpdateModel, session: SessionDep,
                       current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"PATCH /atendimentos/{atendimento_id} - User: {current_user.id if current_user else 'None'}, Dados: {dados}")
    return AtendimentoService(session).editar_atendimento(atendimento_id, dados, current_user)


@router.post("/{atendimento_id}/cancelar")
def cancelar_atendimento(atendimento_id: int, session: SessionDep,
                         current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    """
    Cancelar um atendimento agendado.
    Apenas atendimentos com status AGENDADO ou CONFIRMADO podem ser cancelados.
    """
    import logging
    from models.enums import StatusAtendimento
    
    logger = logging.getLogger(__name__)
    
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")
    
    # Validar status
    status_atual = atendimento.status
    status_valor = status_atual.value if hasattr(status_atual, "value") else str(status_atual)
    if status_valor not in (StatusAtendimento.AGENDADO.value, "Confirmado"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível cancelar atendimento com status {status_valor}."
        )

    # CA/TAL aberto pelo professor para a turma não pode ser cancelado pelo aluno.
    if getattr(current_user, "role", None) == "aluno" and AtendimentoService(session)._tal_aberto(atendimento):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Este CA/TAL é aberto para a turma e não pode ser cancelado pelo aluno.",
        )

    # Cancelar
    atendimento.status = StatusAtendimento.CANCELADO
    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)
    
    logger.info(f"Atendimento {atendimento_id} cancelado pelo usuário {current_user.id}")
    
    return {
        "message": "Atendimento cancelado com sucesso.",
        "id": atendimento_id,
        "status": StatusAtendimento.CANCELADO.value if hasattr(StatusAtendimento.CANCELADO, 'value') else str(StatusAtendimento.CANCELADO)
    }
