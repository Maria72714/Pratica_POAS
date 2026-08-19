from sqlmodel import SQLModel, table, Field, Relationship
from typing import List
from datetime import datetime
from user import Usuario
from usuario_notificacao import UsuarioNotificacao

class Notificacao(SQLModel, table=True):
    __tablename__ = 'notificacoes'
    id: int | None = Field(default=None, primary_key=True)
    titulo: str = Field(max_length=250)
    mensagem: str = Field(max_length=500)
    lida: bool = Field(default=False)   
    criado_em: datetime = Field(default_factory=datetime.now)
    lido_em: datetime | None = None

    notificacoes: List["Usuario"] = Relationship(back_populates='notificacoes', link_model=UsuarioNotificacao)
