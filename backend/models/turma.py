from sqlmodel import SQLModel, table, Field, Relationship
from typing import List
from models.users.professor import Professor
from models.associativas.professor_turma import ProfessorTurma

class Turma(SQLModel, table=True):
    __tablename__ = 'turmas'
    id: int | None = Field(default=None, primary_key=True)
    curso: str = Field(max_length=100, nullable=False)
    ano: str
    turno: str = Field(max_length=10)

    professores: List[Professor] = Relationship(back_populates="turmas", link_model=ProfessorTurma)