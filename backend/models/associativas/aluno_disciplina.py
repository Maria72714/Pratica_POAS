from sqlmodel import SQLModel, Field


class AlunoDisciplina(SQLModel, table=True):
    __tablename__ = 'aluno_disciplinas'
    aluno_id: int | None = Field(primary_key=True, foreign_key='alunos.id', default=None, ondelete='CASCADE')
    disciplina_id: int | None = Field(primary_key=True, foreign_key='disciplinas.id', default=None, ondelete='CASCADE')
