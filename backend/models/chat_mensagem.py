from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional


class ChatMensagem(SQLModel, table=True):
    __tablename__ = 'chat_mensagens'
    id: int | None = Field(default=None, primary_key=True)
    atendimento_id: int = Field(foreign_key="atendimentos.id", ondelete="CASCADE")
    autor_id: int = Field(foreign_key="usuarios.id", ondelete="CASCADE")
    mensagem: str = Field(max_length=2000)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    lida: bool = Field(default=False)
