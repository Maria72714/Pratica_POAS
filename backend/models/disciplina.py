from sqlmodel import SQLModel, table, Field, Relationship
from typing import List
from backend.models.users.professor import Professor
from backend.models.associativas.professor_disciplina import ProfessorDisciplina

class Disciplina(SQLModel, table=True):
    __tablename__ = 'disciplinas'
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)

    professores: List["Professor"] = Relationship(back_populates="disciplinas", link_model=ProfessorDisciplina)
