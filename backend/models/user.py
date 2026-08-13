from sqlmodel import SQLModel, table, Field, Relationship
from typing import Optional
from professor import Professor

class Usuario(SQLModel, table=True):
    __tablename__ = 'usuarios'
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100, nullable=False)
    email: str = Field(max_length=100, nullable=False, unique=True)
    matricula: str = Field(max_length=20, nullable=False, unique=True)
    senha: str = Field(max_length=100, nullable=False)

    professor: Optional["Professor"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"uselist": False})

class UsuarioCreate(SQLModel):
    nome: str
    email: str
    matricula: str
    senha: str
    
