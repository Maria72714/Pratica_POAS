from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional
from user import Usuario

class Mediador(SQLModel, table=True):
    __tablename__ = 'mediadores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")

    usuario: Usuario = Relationship(back_populates="mediador")