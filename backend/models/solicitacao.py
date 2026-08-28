from sqlmodel import SQLModel, Field, table
from models.enums import StatusSolicitacao

class Solicitacao(SQLModel, table=True):
    __tablename__ = 'solicitacoes'
    id: int | None = Field(primary_key=True, default=None)
    id_aluno: int = Field(foreign_key="alunos.id")
    id_mediador: int = Field(foreign_key="mediadores.id")
    observacoes: str | None = Field(max_length=500, default=None)
    status: StatusSolicitacao = Field(default=StatusSolicitacao.PENDENTE)