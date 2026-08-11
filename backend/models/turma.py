from sqlmodel import SQLModel, table, Field, Relationship

class Turma(SQLModel, table=True):
    __tablename__ = 'turmas'
    id: int | None = Field(default=None, primary_key=True)
    curso: str = Field(max_length=100, nullable=False)
    ano: int = Field(nullable=False)
    turno: str = Field(max_length=10, nullable=False)