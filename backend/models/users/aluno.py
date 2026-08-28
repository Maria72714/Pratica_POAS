from sqlmodel import SQLModel, Field, Relationship
from typing import List, TYPE_CHECKING

from models.associativas.aluno_atendimento import AlunoAtendimento

if TYPE_CHECKING:
    from models.users.user import Usuario
    from models.atendimento import Atendimento

class Aluno(SQLModel, table=True):
    __tablename__ = "alunos"

    id: int | None = Field(
        default=None,
        primary_key=True,
        foreign_key="usuarios.id"
    )

    usuario: "Usuario" = Relationship(back_populates="alunos")

    atendimentos: List["Atendimento"] = Relationship(
        back_populates="alunos",
        link_model=AlunoAtendimento
    )