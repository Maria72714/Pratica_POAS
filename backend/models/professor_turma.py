from sqlmodel import SQLModel, table, Field, Relationship

class ProfessorTurma(SQLModel, table=True):
    __tablename__ = 'professor_turmas'
    professor_id: int | None = Field(primary_key=True, foreign_key='professores.id', default=None)
    turma_id: int | None = Field(primary_key=True, foreign_key='turmas.id', default=None)
    