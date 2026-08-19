from sqlmodel import SQLModel, table, Field, Relationship
from datetime import date
from typing import List
from enums import TipoAtendimento, ModalidadeAula, StatusAtendimento
from aluno import Aluno
from aluno_atendimento import AlunoAtendimento


class Atendimento(SQLModel, table=True):
    __tablename__ = 'atendimentos'
    id: int | None = Field(default=None, primary_key=True)
    id_professor: int = Field(foreign_key="professores.id")
    id_turma: int = Field(foreign_key="turmas.id")
    id_disciplina: int = Field(foreign_key="disciplinas.id")
    id_solicitacao: int | None = Field(default=None, foreign_key="solicitacoes.id", unique=True)
    id_horario: int = Field(foreign_key="horarios.id")
    id_sala: int | None = Field(default=None, foreign_key="salas.id")
    data_atendimento: date
    tipo_atendimento: TipoAtendimento = Field(default=TipoAtendimento.TAL)   
    modalidade: ModalidadeAula = Field(default=ModalidadeAula.PRESENCIAL)
    assunto: str | None = Field(max_length=250, default=None)
    relatorio: str = Field(max_length=500)
    status: StatusAtendimento = Field(default=StatusAtendimento.AGENDADO)

    alunos: List["Aluno"] = Relationship(back_populates="atendimentos", link_model=AlunoAtendimento)

