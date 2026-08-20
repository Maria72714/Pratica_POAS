from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional
from backend.models.users.user import Usuario
from enums import TipoMediador

class Mediador(SQLModel, table=True):
    __tablename__ = 'mediadores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")
    tipo: TipoMediador
    apoio_descricao: str | None = Field(max_length=250)

    usuario: Usuario = Relationship(back_populates="mediador")