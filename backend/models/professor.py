from sqlmodel import SQLModel, table, Field

class Professor(SQLModel, table=True):
    __tablename__ = 'professores'
    id: int | None = Field(default=None, primary_key=True, foreign_key="usuarios.id")