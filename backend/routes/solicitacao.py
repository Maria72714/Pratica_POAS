from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from deps.deps import SessionDep
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


class SolicitacaoResponse(BaseModel):
    id: int
    id_disciplina: int
    tipo_suporte: str
    descricao: Optional[str]
    status: str

    class Config:
        from_attributes = True


@router.post('/', response_model=SolicitacaoResponse)
def criar_solicitacao(dados: SolicitacaoCreateModel, session: SessionDep):
    return SolicitacaoService(session).criar_solicitacao(dados)


@router.get("/aluno/{matricula}", response_model=list[Solicitacao])
def listar_solicitacoes_aluno(matricula: str, session: SessionDep):
    return SolicitacaoService(session).listar_solicitacoes_aluno(matricula)


@router.get("/{solicitacao_id}", response_model=Solicitacao)
def buscar_solicitacao_por_id(solicitacao_id: int, session: SessionDep):
    return SolicitacaoService(session).buscar_por_id(solicitacao_id)


@router.patch("/{solicitacao_id}", response_model=Solicitacao)
def editar_solicitacao(solicitacao_id: int, dados: Solicitacao, session: SessionDep):
    return SolicitacaoService(session).editar_solicitacao(solicitacao_id, dados)


@router.delete("/{solicitacao_id}")
def deletar_solicitacao(solicitacao_id: int, session: SessionDep):
    return SolicitacaoService(session).deletar_solicitacao(solicitacao_id)

