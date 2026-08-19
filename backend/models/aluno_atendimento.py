from sqlmodel import SQLModel, Field, table

class AlunoAtendimento(SQLModel, table=True):
    __tablename__ = 'aluno_atendimentos'
    aluno_id: int | None = Field(primary_key=True, foreign_key='alunos.id' ,default=None)
    atendimento_id: int | None = Field(primary_key=True, foreign_key='atendimentos.id' ,default=None)