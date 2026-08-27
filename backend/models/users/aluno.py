from sqlmodel import SQLModel, Field, Relationship
from typing import List

from models.associativas.aluno_atendimento import AlunoAtendimento
from ..atendimento import Atendimento
from user import Usuario

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