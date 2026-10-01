from fastapi import APIRouter
from pydantic import BaseModel, HTTPException
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.solicitacao import Solicitacao
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional

router = APIRouter(
    prefix='/solicitacao',
    tags=['Solicitação']
)

class SolicitacaoCreateModel(BaseModel):
  observacoes: Optional[str] = None
  

router.post('/')
def criar_solicitacao():
    