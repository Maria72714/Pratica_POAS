from datetime import datetime
from sqlmodel import SQLModel, Field


class ComentarioCA(SQLModel, table=True):
    """Comentário público na página de um CA.

    Qualquer usuário autenticado (aluno, professor, mediador ou admin) pode
    publicar. É uma área pública de discussão do atendimento, distinta do chat
    privado vinculado ao CA.
    """
    __tablename__ = 'comentarios_ca'

    id: int | None = Field(default=None, primary_key=True)
    atendimento_id: int = Field(foreign_key="atendimentos.id", ondelete="CASCADE")
    autor_id: int = Field(foreign_key="usuarios.id", ondelete="CASCADE")
    mensagem: str = Field(max_length=1000)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
