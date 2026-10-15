from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from typing import Optional

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
    matricula: str


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


@router.get("/{atendimento_id}", response_model=Atendimento)
def buscar_atendimento_por_id(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).buscar_por_id(atendimento_id)


@router.get('/professor/{matricula}')
def listar_atendimentos_professor(matricula: str, session: SessionDep):
    return AtendimentoService(session).listar_por_professor(matricula)


@router.post("/", response_model=AtendimentoResponse)
def criar_atendimento(dados: AtendimentoCreateModel, session: SessionDep):
    return AtendimentoService(session).criar_atendimento(dados)


@router.delete("/{atendimento_id}")
def deletar_atendimento(atendimento_id: int, session: SessionDep):
    return AtendimentoService(session).deletar_atendimento(atendimento_id)


@router.patch("/{atendimento_id}", response_model=Atendimento)
def editar_atendimento(atendimento_id: int, dados: Atendimento, session: SessionDep):
    return AtendimentoService(session).editar_atendimento(atendimento_id, dados)

