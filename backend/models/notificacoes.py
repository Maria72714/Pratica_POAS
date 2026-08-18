from sqlmodel import SQLModel, table, Field
from typing import Optional
from datetime import datetime

class Notificacao(SQLModel, table=True):
    __tablename__ = 'notificacoes'
    id: Optional[int] = Field(default=None, primary_key=True)
    titulo: str = Field(max_length=250, nullable=False)
    mensagem: str = Field(max_length=500, nullable=False)
    lida: bool = Field(default=False)   
    criado_em: datetime = Field(default_factory=datetime.now)
    lido_em: datetime | None = None
