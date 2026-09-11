from sqlmodel import SQLModel, table, Field, Relationship
from models.enums import TipoMediador
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from models.users.user import Usuario

class Mediador(SQLModel, table=True):
    __tablename__ = 'mediadores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")
    usuario_id = Field(foreign_key="usuarios.id", ondelete="CASCADE", unique=True)
    tipo: TipoMediador
    apoio_descricao: str | None = Field(max_length=250)

    usuario: Optional["Usuario"] = Relationship(back_populates="mediador")