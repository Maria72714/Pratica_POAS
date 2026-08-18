from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional
from user import Usuario

class Aluno(SQLModel, table=True):
    __tablename__ = 'alunos'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")

    usuario: Usuario = Relationship(back_populates="aluno")