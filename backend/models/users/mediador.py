from sqlmodel import SQLModel, table, Field, Relationship
from models.enums import TipoMediador
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.users.user import Usuario

class Mediador(SQLModel, table=True):
    __tablename__ = 'mediadores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")
    tipo: TipoMediador
    apoio_descricao: str | None = Field(max_length=250)

    usuario: "Usuario" = Relationship(back_populates="mediador")