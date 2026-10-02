from sqlmodel import SQLModel, Field, table
from models.enums import StatusSolicitacao

class Solicitacao(SQLModel, table=True):
    __tablename__ = 'solicitacoes'
    id: int | None = Field(primary_key=True, default=None)
    id_aluno: int = Field(foreign_key="alunos.id", ondelete="CASCADE")
    id_mediador: int | None = Field(default=None, foreign_key="mediadores.id")
    id_disciplina: int = Field(foreign_key="disciplinas.id", ondelete="CASCADE")
    tipo_suporte: str = Field(max_length=100)
    descricao: str | None = Field(max_length=500, default=None)
    status: StatusSolicitacao = Field(default=StatusSolicitacao.PENDENTE)