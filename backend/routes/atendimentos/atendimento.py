from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

from deps.deps import SessionDep
from models.atendimento import Atendimento
from services.atendimento_service import AtendimentoService

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

@router.get('/aluno/{matricula}', response_model=list[Atendimento])
def listar_atendimentos_por_matricula(matricula: str, session: SessionDep):
    return AtendimentoService(session).listar_por_matricula(matricula)

@router.get("/{atendimento_id}", response_model=Atendimento)
def buscar_atendimento_por_id(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).buscar_por_id(atendimento_id)


@router.get('/professor/{matricula}')
def listar_atendimentos_professor(matricula: str, session: SessionDep):
    return AtendimentoService(session).listar_por_professor(matricula)


@router.get('/mediador/tai')
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

    resultado = []
    for a in atendimentos:
        disciplina = session.get(Disciplina, a.id_disciplina) if a.id_disciplina else None

        # Aluno(s)
        aluno_nome = None
        aluno_matricula = None
        assoc = session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == a.id)
        ).first()
        if assoc:
            u_aluno = session.get(Usuario, assoc.aluno_id)
            if u_aluno:
                aluno_nome = u_aluno.nome
                aluno_matricula = u_aluno.matricula

        # Professor
        professor_nome = None
        if a.id_professor:
            u_prof = session.get(Usuario, a.id_professor)
            if u_prof:
                professor_nome = u_prof.nome

        # Selo do Mediador
        id_mediador = None
        if a.id_solicitacao:
            sol = session.get(Solicitacao, a.id_solicitacao)
            if sol:
                id_mediador = sol.id_mediador

        resultado.append({
            "id": a.id,
            "assunto": a.assunto or "Atendimento TAI",
            "tipo_atendimento": a.tipo_atendimento.value if hasattr(a.tipo_atendimento, "value") else str(a.tipo_atendimento),
            "data_atendimento": a.data_atendimento.isoformat() if a.data_atendimento else None,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "disciplina_nome": disciplina.nome if disciplina else "Disciplina TAI",
            "aluno_nome": aluno_nome,
            "aluno_matricula": aluno_matricula,
            "professor_nome": professor_nome,
            "id_mediador": id_mediador,
            "tem_selo": bool(id_mediador),
        })

    return resultado


@router.post("/", response_model=AtendimentoResponse)
def criar_atendimento(dados: AtendimentoCreateModel, session: SessionDep):
    return AtendimentoService(session).criar_atendimento(dados)


@router.delete("/{atendimento_id}")
def deletar_atendimento(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).deletar_atendimento(atendimento_id)


@router.patch("/{atendimento_id}", response_model=Atendimento)
def editar_atendimento(atendimento_id: int, dados: Atendimento, session: SessionDep):
    return AtendimentoService(session).editar_atendimento(atendimento_id, dados)


@router.post("/{atendimento_id}/cancelar")
def cancelar_atendimento(atendimento_id: int, session: SessionDep):
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
    if status_atual not in (StatusAtendimento.AGENDADO, StatusAtendimento.CONFIRMADO):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível cancelar atendimento com status {status_atual.value if hasattr(status_atual, 'value') else status_atual}."
        )
    
    # Cancelar
    atendimento.status = StatusAtendimento.CANCELADO
    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)
    
    logger.info(f"Atendimento {atendimento_id} cancelado")
    
    return {
        "message": "Atendimento cancelado com sucesso.",
        "id": atendimento_id,
        "status": StatusAtendimento.CANCELADO.value if hasattr(StatusAtendimento.CANCELADO, 'value') else str(StatusAtendimento.CANCELADO)
    }

