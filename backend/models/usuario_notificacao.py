from sqlmodel import SQLModel, table, Field

class UsuarioNotificacao(SQLModel, table=True):
    __tablename__ = 'usuario_notificacoes'
    usuario_id: int | None = Field(primary_key=True, default=None, foreign_key='usuarios.id')
    notificacao_id: int | None = Field(primary_key=True, default=None, foreign_key='notificacoes.id')