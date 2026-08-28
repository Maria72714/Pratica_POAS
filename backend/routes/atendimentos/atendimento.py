from fastapi import APIRouter
from models.atendimento import Atendimento

router = APIRouter()

@router.get('/atendimento', response_model=list[Atendimento])
def listar_atendimento(atendimento: Atendimento) -> Atendimento:
    return atendimento