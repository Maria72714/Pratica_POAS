from fastapi import APIRouter, HTTPException
from models.atendimento import Atendimento
from models.solicitacao import Solicitacao
from models.users.user import Usuario
from models.users.professor import Professor
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional




router = APIRouter(
    prefix='/atendimentos',
    tags=['Atendimentos']
)


@router.get(
    "/professor/{professor_matricula}",
    response_model=list[Atendimento]
)
def listar_atendimentos_professor(professor_matricula: str,session: SessionDep):
    usuario = session.exec(
        select(Usuario).where(
            Usuario.matricula == professor_matricula
        )
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado."
        )

    professor = session.exec(
        select(Professor).where(
            Professor.id == usuario.id
        )
    ).first()

    if not professor:
        raise HTTPException(
            status_code=404,
            detail="Perfil de professor não encontrado."
        )

    statement = select(Atendimento).where(
        Atendimento.id_professor == professor.id
    )

    atendimentos = session.exec(statement).all()

    return atendimentos


