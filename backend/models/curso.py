from sqlmodel import SQLModel, table, Field, Relationship
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from models.turma import Turma


class Curso(SQLModel, table=True):
    __tablename__ = "cursos"

    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)

    turmas: List["Turma"] = Relationship(back_populates="curso")