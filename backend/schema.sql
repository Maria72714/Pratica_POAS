-- TYPES
CREATE TYPE status_horario AS ENUM ('Disponivel', 'Reservado');

CREATE TYPE status_atendimento AS ENUM ('Agendado', 'Concluido', 'Cancelado');

CREATE TYPE status_solicitacao AS ENUM ('Pendente', 'Aprovado', 'Recusado', 'Cancelado');

CREATE TYPE modalidade_aula AS ENUM ('Presencial', 'Remoto');

CREATe TYPE tipo_atendimento AS ENUM ('TAL', 'TAI');

-- TABELA DE disciplinas

CREATE TABLE disciplinas(
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL
);

CREATE TABLE turmas(
	id SERIAL PRIMARY KEY,
	curso VARCHAR(50) NOT NULL,
	ano VARCHAR(50) NOT NULL,
	turno VARCHAR(50) NOT NULL
);

CREATE TABLE usuarios(
	id SERIAL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	matricula VARCHAR(50) NOT NULL,
	senha VARCHAR(255) NOT NULL
);

CREATE TABLE professor(
	id INT PRIMARY KEY REFERENCES usuarios(id)
);

CREATE TABLE mediador(
    id INT PRIMARY KEY REFERENCES usuarios(id)
);

CREATE TABLE alunos(
	id INT PRIMARY KEY REFERENCES usuarios(id),
	id_turma REFERENCES turmas(id),
    necessidades_especiais BOOLEAN DEFAULT FALSE
);

CREATE TABLE notificacoes(
	id SERIAL PRIMARY KEY,
	titulo VARCHAR(250) NOT NULL,	
	mensagem VARCHAR(500) NOT NULL,
	lida BOOLEAN DEFAULT FALSE,
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	lido_em TIMESTAMP 
);

CREATE TABLE horarios(
	id SERIAL PRIMARY KEY,
	horario_inicio TIME NOT NULL,
	horario_termino TIME NOT NULL
);

CREATE TABLE salas(
	id SERIAL PRIMARY KEY,
	nome VARCHAR(50) NOT NULL
);

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

CREATE TABLE solicitacoes(
    id SERIAL PRIMARY KEY,
    id_aluno INT REFERENCES alunos(id) NOT NULL,
    id_mediador INT REFERENCES mediador(id) NOT NULL,
    observacoes TEXT,
    status status_solicitacao DEFAULT 'Pendente'
);


---------- TABELAS ASSOCIATIVAS ----------

CREATE TABLE aluno_atendimentos(
	id_aluno INT REFERENCES alunos(id),
	id_atendimento INT REFERENCES atendimentos(id)
);

CREATE TABLE usuario_notificacoes(
	id_usuario INT REFERENCES usuarios(id),
	id_notificacao INT REFERENCES notificacoes(id)
);

CREATE TABLE professor_turmas(
	id_professor INT REFERENCES professores(id),
	id_turma INT REFERENCES turmas(id)
);

CREATE TABLE professor_disciplinas(
	id_professor INT REFERENCES professores(id),
	id_disciplina INT REFERENCES disciplinas(id)
);

CREATE TABLE horario_salas(
	id_horario INT REFERENCES horarios(id),
	id_sala INT REFERENCES salas(id)
);



