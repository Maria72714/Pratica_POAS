from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional, List
from backend.models.users.user import Usuario
from backend.models.associativas.aluno_atendimento import AlunoAtendimento
from atendimento import Atendimento

class Aluno(SQLModel, table=True):
    __tablename__ = 'alunos'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")
    curso: Optional[str] = Field(default=None, max_length=100)
    ano_letivo: Optional[str] = Field(default=None, max_length=50)
    is_tai_claimed: bool = Field(default=False)
    tai_status: str = Field(default="NAO_SOLICITADO") # 'NAO_SOLICITADO', 'PENDENTE', 'APROVADO', 'REJEITADO'
    laudo_url: Optional[str] = Field(default=None, max_length=500)
    necessidades_especiais: bool = Field(default=False)

    usuario: Usuario = Relationship(back_populates="aluno")
    atendimentos: List["Atendimento"] = Relationship(back_populates="alunos", link_model=AlunoAtendimento)