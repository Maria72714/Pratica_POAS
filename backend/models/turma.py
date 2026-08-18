from sqlmodel import SQLModel, table, Field

class Turma(SQLModel, table=True):
    __tablename__ = 'turmas'
    id: int | None = Field(default=None, primary_key=True)
    curso: str = Field(max_length=100, nullable=False)
    ano: str
    turno: str = Field(max_length=10)