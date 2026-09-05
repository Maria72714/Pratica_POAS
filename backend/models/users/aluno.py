from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional, TYPE_CHECKING

from models.associativas.aluno_atendimento import AlunoAtendimento

if TYPE_CHECKING:
    from models.users.user import Usuario
    from models.atendimento import Atendimento

class Aluno(SQLModel, table=True):
    __tablename__ = "alunos"

    id: int | None = Field(
        default=None,
        primary_key=True,
        foreign_key="usuarios.id"
    )
    curso_id: Optional[str] = Field(default=None, max_length=50)
    ano_letivo: Optional[str] = Field(default=None, max_length=20)
    necessidades_especiais: bool = Field(default=False)
    perfil_completo: bool = Field(default=False)
    laudo_path: Optional[str] = Field(default=None, max_length=255)
    foto_suap: Optional[str] = Field(default=None, max_length=500)

    usuario: "Usuario" = Relationship(back_populates="aluno")

    atendimentos: List["Atendimento"] = Relationship(
        back_populates="alunos",
        link_model=AlunoAtendimento
    )