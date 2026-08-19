from typing import List
from sqlmodel import SQLModel, table, Field, Relationship
from backend.models.users.user import Usuario
from turma import Turma
from backend.models.associativas.professor_turma import ProfessorTurma
from backend.models.associativas.professor_disciplina import ProfessorDisciplina
from disciplina import Disciplina

class Professor(SQLModel, table=True):
    __tablename__ = 'professores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")

    usuario: Usuario = Relationship(back_populates="professor")
    turmas: List["Turma"] = Relationship(back_populates="professores", link_model=ProfessorTurma)
    disciplinas: List["Disciplina"] = Relationship(back_populates="professores", link_model=ProfessorDisciplina)

