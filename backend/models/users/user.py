from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional, List
from models.users.professor import Professor
from models.users.aluno import Aluno
from models.users.mediador import Mediador
from notificacao import Notificacao
from associativas.usuario_notificacao import UsuarioNotificacao

class Usuario(SQLModel, table=True):
    __tablename__ = 'usuarios'
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    email: str = Field(max_length=100, unique=True)
    matricula: str = Field(max_length=20, unique=True)
    senha: str = Field(max_length=100)

    professor: Optional["Professor"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"uselist": False})
    aluno: Optional["Aluno"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"uselist": False})
    mediador: Optional["Mediador"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"uselist": False})

    notificacoes: List["Notificacao"] = Relationship(back_populates='usuarios', link_model=UsuarioNotificacao)