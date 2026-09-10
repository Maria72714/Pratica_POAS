
from fastapi import APIRouter
from models.atendimento import Atendimento
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.atendimento import Atendimento 
from deps.deps import SessionDep
router = APIRouter()

@router.get('/atendimento', response_model=list[Atendimento])
def listar_atendimento(atendimento: Atendimento) -> Atendimento:
    return atendimento

@router.post("/", response_model=Atendimento)
def criar_atendimento(
    dados: Atendimento,
    session: SessionDep
):

    atendimento = Atendimento.model_validate(dados)

    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)

    return atendimento