from typing import List

from sqlmodel import SQLModel, Field, Relationship

from models.associativas.professor_turma import ProfessorTurma
from models.associativas.professor_disciplina import ProfessorDisciplina


class Professor(SQLModel, table=True):
    __tablename__ = "professores"

    id: int | None = Field(
        default=None,
        primary_key=True,
        foreign_key="usuarios.id"
    )

    usuario = Relationship(
        back_populates="professor"
    )

    turmas = Relationship(
        back_populates="professores",
        link_model=ProfessorTurma
    )

    disciplinas = Relationship(
        back_populates="professores",
        link_model=ProfessorDisciplina
    )

