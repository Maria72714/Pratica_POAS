from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any, Annotated

from deps.deps import SessionDep
from deps.auth import AuthUser, get_current_user, require_roles
from models.solicitacao import Solicitacao
from services.solicitacao_service import SolicitacaoService

router = APIRouter(
    prefix='/solicitacao',
    tags=['Solicitação']
)


class SolicitacaoCreateModel(BaseModel):
    tipo_suporte: str
    descricao: Optional[str] = None
    matricula: str
    disciplina: str
    data_preferencial: Optional[date] = None


class SolicitacaoCreatePorMediadorModel(BaseModel):
    """Modelo usado quando o mediador cria uma solicitação em nome de um aluno PNEE."""
    matricula_aluno: str          # matrícula do aluno PNEE
    id_mediador: Optional[Any] = None  # id/matrícula do mediador que está criando
    tipo_suporte: str
    descricao: Optional[str] = None
    disciplina: str
    data_preferencial: Optional[date] = None


class SolicitacaoUpdateModel(BaseModel):
    tipo_suporte: Optional[str] = None
    descricao: Optional[str] = None
    disciplina: Optional[str] = None
    id_disciplina: Optional[int] = None
    data_preferencial: Optional[date] = None
    status: Optional[str] = None


class SolicitacaoResponse(BaseModel):
    id: int
    id_disciplina: int
    tipo_suporte: str
    descricao: Optional[str] = None
    data_preferencial: Optional[date] = None
    status: str

    class Config:
        from_attributes = True


class DecidirSolicitacaoInput(BaseModel):
    status: str
    id_professor: Optional[Any] = None
    id_mediador: Optional[Any] = None


class SelarSolicitacaoInput(BaseModel):
    id_mediador: Any


@router.post('/', response_model=SolicitacaoResponse)
def criar_solicitacao(dados: SolicitacaoCreateModel, session: SessionDep, 
                      current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    return SolicitacaoService(session).criar_solicitacao(dados)


@router.post('/mediador/criar-por-aluno')
def criar_solicitacao_por_mediador(dados: SolicitacaoCreatePorMediadorModel, session: SessionDep,
                                   current_user: Annotated[AuthUser, Depends(require_roles("mediador", "admin"))] = None):
    """Permite que o mediador crie uma solicitação TAI em nome de um aluno PNEE."""
    return SolicitacaoService(session).criar_solicitacao_por_mediador(dados)


@router.get("/aluno/{matricula}")
async def listar_solicitacoes_aluno(matricula: str, session: SessionDep,
                                    current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    service = SolicitacaoService(session)
    # Se ainda faltar professor em alguma disciplina, tenta atualizar pelo SUAP
    # (usando o token guardado no login) antes de montar a resposta.
    await service.atualizar_professores_do_suap(matricula)
    return service.listar_solicitacoes_aluno(matricula)


@router.get("/pendentes")
def listar_solicitacoes_pendentes(session: SessionDep,
                                  current_user: Annotated[AuthUser, Depends(require_roles("professor", "mediador", "admin"))] = None):
    role = current_user.role if current_user else "admin"
    return SolicitacaoService(session).listar_solicitacoes_pendentes(role=role)


@router.get("/recusadas")
def listar_solicitacoes_recusadas(session: SessionDep,
                                  current_user: Annotated[AuthUser, Depends(require_roles("mediador", "admin"))] = None):
    return SolicitacaoService(session).listar_solicitacoes_recusadas()


@router.post("/{solicitacao_id}/selar")
@router.patch("/{solicitacao_id}/selar")
def selar_solicitacao(solicitacao_id: int, dados: SelarSolicitacaoInput, session: SessionDep,
                      current_user: Annotated[AuthUser, Depends(require_roles("mediador", "admin"))] = None):
    """O mediador apenas concede o selo de validação. A aprovação final cabe ao professor."""
    return SolicitacaoService(session).selar_solicitacao(
        solicitacao_id=solicitacao_id,
        id_mediador=dados.id_mediador
    )


@router.post("/{solicitacao_id}/remover-selo")
def remover_selo_solicitacao(solicitacao_id: int, session: SessionDep,
                             current_user: Annotated[AuthUser, Depends(require_roles("mediador", "admin"))] = None):
    """Remove o selo do mediador da solicitação."""
    return SolicitacaoService(session).remover_selo_solicitacao(solicitacao_id)


@router.patch("/{solicitacao_id}/avaliar")
@router.post("/{solicitacao_id}/avaliar")
def avaliar_solicitacao(solicitacao_id: int, dados: DecidirSolicitacaoInput, session: SessionDep,
                        current_user: Annotated[AuthUser, Depends(require_roles("professor", "mediador", "admin"))] = None):
    """O professor aprova ou recusa a solicitação, com ou sem o selo do mediador."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Avaliar solicitação {solicitacao_id}: status={dados.status}, user={current_user.role if current_user else 'None'}")
    
    return SolicitacaoService(session).decidir_solicitacao(
        solicitacao_id=solicitacao_id,
        status=dados.status,
        id_professor=dados.id_professor,
        id_mediador=dados.id_mediador,
    )


@router.get("/{solicitacao_id}")
def buscar_solicitacao_por_id(solicitacao_id: int, session: SessionDep,
                              current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    return SolicitacaoService(session).buscar_por_id(solicitacao_id)


@router.patch("/{solicitacao_id}")
def editar_solicitacao(solicitacao_id: int, dados: SolicitacaoUpdateModel, session: SessionDep,
                       current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    return SolicitacaoService(session).editar_solicitacao(solicitacao_id, dados)


@router.delete("/{solicitacao_id}")
def deletar_solicitacao(solicitacao_id: int, session: SessionDep,
                        current_user: Annotated[AuthUser, Depends(get_current_user)] = None):
    return SolicitacaoService(session).deletar_solicitacao(solicitacao_id)
