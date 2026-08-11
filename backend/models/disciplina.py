from sqlmodel import SQLModel, table, Field, Relationship

class Disciplina(SQLModel, table=True):
    __tablename__ = 'disciplinas'
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100, nullable=False)
