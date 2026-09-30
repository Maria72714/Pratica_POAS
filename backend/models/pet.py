from typing import Optional
from sqlmodel import SQLModel, Field

class Pet(SQLModel, table=True):
    __tablename__ = "pets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(index=True)
    nome_usuario: str
    imagem_url: str
    aprovado: bool = Field(default=False)
