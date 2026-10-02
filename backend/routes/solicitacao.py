from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.solicitacao import Solicitacao
from models.disciplina import Disciplina
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
  tipo_suporte: str
  descricao: Optional[str] = None
  matricula: str
  disciplina: str
  data_atendimento: date


class SolicitacaoResponse(BaseModel):
    id: int
    tipo_suporte: str
    descricao: Optional[str]
    status: str

    class Config:
        from_attributes = True
  

router.post('/', response_model=SolicitacaoResponse)
def criar_solicitacao(dados: SolicitacaoCreateModel, session: SessionDep):
    aluno = session.exec(select(Aluno).where(Aluno.matricula == dados.matricula)).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    disciplina = session.exec(select(Disciplina).where(Disciplina.nome == dados.disciplina)).first()
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")

    solicitacao = Solicitacao(
        id_aluno=aluno.id,
        id_disciplina=disciplina.id,
        tipo_suporte=dados.tipo_suporte,
        descricao=dados.descricao
    )
    session.add(solicitacao)
    session.commit()
    session.refresh(solicitacao)

    return solicitacao