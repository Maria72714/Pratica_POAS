from sqlmodel import SQLModel, table, Field, Relationship

class ProfessorDisciplina(SQLModel, table=True):
    __tablename__ = 'professor_disciplinas'
    professor_id: int | None = Field(primary_key=True, foreign_key='professores.id', default=None)
    disciplina_id: int | None = Field(primary_key=True, foreign_key='disciplinas.id', default=None)