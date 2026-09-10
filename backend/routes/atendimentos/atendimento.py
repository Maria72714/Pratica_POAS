
from http.client import HTTPException

from fastapi import APIRouter
from models.atendimento import Atendimento
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.atendimento import Atendimento 
from deps.deps import SessionDep
from sqlmodel import select
router = APIRouter()

@router.get('/atendimento', response_model=list[Atendimento])
def listar_atendimento(session: SessionDep):
    atendimentos = session.exec(select(Atendimento)).all()
    return atendimentos

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

@router.delete("/{atendimento_id}")
def deletar_atendimento(atendimento_id: int, session: SessionDep):
    atendimento = session.get(Atendimento, atendimento_id)


    if not atendimento:
        raise HTTPException(
            status_code=404,
            detail="Atendimento não encontrado"
        )
    session.delete(atendimento)
    session.commit()

@router.patch("/{atendimento_id}", response_model=Atendimento)
def editar_atendimento(atendimento_id: int,dados: Atendimento,session: SessionDep):

    atendimento = session.get(Atendimento,atendimento_id)

    if not atendimento:
        raise HTTPException(
            status_code=404,
            detail="Atendimento não encontrado"
        )

    dados_update = dados.model_dump(exclude_unset=True)

    for campo, valor in dados_update.items():
        setattr(atendimento,campo,valor)
        
    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)

    return atendimento