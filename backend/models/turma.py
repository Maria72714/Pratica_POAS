from sqlmodel import SQLModel, table, Field, Relationship
from typing import List, Optional, TYPE_CHECKING
from models.users.professor import Professor
from models.associativas.professor_turma import ProfessorTurma

if TYPE_CHECKING:
    from models.curso import Curso

class Turma(SQLModel, table=True):
    __tablename__ = 'turmas'
    id: int | None = Field(default=None, primary_key=True)
    curso_id: int | None = Field(default=None, foreign_key="cursos.id")
    ano: str
    turno: str = Field(max_length=10)
    codigo: str | None = Field(default=None, max_length=2)

    curso: Optional["Curso"] = Relationship(back_populates="turmas", sa_relationship_kwargs={"lazy": "select"})
    professores: List[Professor] = Relationship(back_populates="turmas", link_model=ProfessorTurma)