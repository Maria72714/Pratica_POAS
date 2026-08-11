from sqlmodel import SQLModel, table, Field, Relationship

class Usuario(SQLModel, table=True):
    __tablename__ = 'usuarios'
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100, nullable=False)
    email: str = Field(max_length=100, nullable=False, unique=True)
    matricula: str = Field(max_length=20, nullable=False, unique=True)
    senha: str = Field(max_length=100, nullable=False)

class UsuarioCreate(SQLModel):
    nome: str
    email: str
    matricula: str
    senha: str
    
