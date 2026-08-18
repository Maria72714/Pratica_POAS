from sqlmodel import SQLModel, table, Field
from datetime import date
from enums import TipoAtendimento, ModalidadeAula

class Atendimento(SQLModel, table=True):
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
    assunto: str | None = Field(max_length=500, default=None)
    status: 






'''
CREATE TABLE atendimentos(
	id SERIAL PRIMARY KEY,
	id_professor INT REFERENCES professores(id) NOT NULL,
	id_turma INT REFERENCES turmas(id) NOT NULL,
	id_disciplina INT REFERENCES disciplinas(id) NOT NULL,
    id_solicitacao INT UNIQUE REFERENCES solicitacoes(id),
	id_horario INT REFERENCES horarios(id) NOT NULL,
    id_sala INT REFERENCES salas(id),
	data_atendimento DATE NOT NULL,
	tipo_atendimento tipo_atendimento,
	modalidade modalidade_aula,
	assunto VARCHAR(500),
    relatorio VARCHAR(500),
    status status_atendimento
);
'''
