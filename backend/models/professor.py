from typing import Optional
from sqlmodel import SQLModel, table, Field, Relationship
from user import Usuario

class Professor(SQLModel, table=True):
    __tablename__ = 'professores'
    id: Optional[int] = Field(default=None, primary_key=True, foreign_key="usuarios.id")

    usuario: Usuario = Relationship(back_populates="professor")

