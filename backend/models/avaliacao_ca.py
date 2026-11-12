from datetime import datetime
from sqlmodel import SQLModel, Field


class AvaliacaoCA(SQLModel, table=True):
    """Avaliação (estrelas + comentário) que um aluno faz de um CA concluído.

    Cada aluno pode avaliar um mesmo atendimento apenas uma vez — a única
    restrição é garantida no serviço (não há UNIQUE composto explícito para
    facilitar o uso em diferentes bancos).
    """
    __tablename__ = 'avaliacoes_ca'

    id: int | None = Field(default=None, primary_key=True)
    atendimento_id: int = Field(foreign_key="atendimentos.id", ondelete="CASCADE")
    aluno_id: int = Field(foreign_key="alunos.id", ondelete="CASCADE")
    nota: int = Field(ge=1, le=5)
    comentario: str | None = Field(default=None, max_length=1000)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
