-- ==========================================
-- BANCO DE DADOS
-- ==========================================

CREATE DATABASE IF NOT EXISTS pratiCA_db;
USE pratiCA_db;


-- ==========================================
-- TABELAS PRINCIPAIS
-- ==========================================

CREATE TABLE disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);


CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso VARCHAR(50) NOT NULL,
    ano VARCHAR(50) NOT NULL,
    turno VARCHAR(50) NOT NULL
);


CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    senha VARCHAR(255) NOT NULL
);


CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(250) NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lido_em TIMESTAMP NULL
);


CREATE TABLE horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    horario_inicio TIME NOT NULL,
    horario_termino TIME NOT NULL
);


CREATE TABLE salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);


-- ==========================================
-- TIPOS DE USUÁRIO
-- ==========================================

CREATE TABLE professor (
    id INT PRIMARY KEY,

    CONSTRAINT fk_professor_usuario
        FOREIGN KEY (id)
        REFERENCES usuarios(id)
);


CREATE TABLE mediador (
    id INT PRIMARY KEY,

    CONSTRAINT fk_mediador_usuario
        FOREIGN KEY (id)
        REFERENCES usuarios(id)
);


CREATE TABLE alunos (
    id INT PRIMARY KEY,
    id_turma INT NOT NULL,
    necessidades_especiais BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_aluno_turma
        FOREIGN KEY (id_turma)
        REFERENCES turmas(id)
);


-- ==========================================
-- SOLICITAÇÕES
-- ==========================================

CREATE TABLE solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_aluno INT NOT NULL,
    id_mediador INT NOT NULL,

    observacoes TEXT,

    status ENUM(
        'Pendente',
        'Aprovado',
        'Recusado',
        'Cancelado'
    ) DEFAULT 'Pendente',

    CONSTRAINT fk_solicitacao_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES alunos(id),

    CONSTRAINT fk_solicitacao_mediador
        FOREIGN KEY (id_mediador)
        REFERENCES mediador(id)
);


-- ==========================================
-- ATENDIMENTOS
-- ==========================================

CREATE TABLE atendimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_professor INT NOT NULL,
    id_turma INT NOT NULL,
    id_disciplina INT NOT NULL,
    id_solicitacao INT UNIQUE,
    id_horario INT NOT NULL,
    id_sala INT,

    data_atendimento DATE NOT NULL,

    tipo_atendimento ENUM(
        'TAL',
        'TAI'
    ),

    modalidade ENUM(
        'Presencial',
        'Remoto'
    ),

    assunto VARCHAR(500),
    relatorio VARCHAR(500),

    status ENUM(
        'Agendado',
        'Concluido',
        'Cancelado'
    ),

    CONSTRAINT fk_atendimento_professor
        FOREIGN KEY (id_professor)
        REFERENCES professor(id),

    CONSTRAINT fk_atendimento_turma
        FOREIGN KEY (id_turma)
        REFERENCES turmas(id),

    CONSTRAINT fk_atendimento_disciplina
        FOREIGN KEY (id_disciplina)
        REFERENCES disciplinas(id),

    CONSTRAINT fk_atendimento_solicitacao
        FOREIGN KEY (id_solicitacao)
        REFERENCES solicitacoes(id),

    CONSTRAINT fk_atendimento_horario
        FOREIGN KEY (id_horario)
        REFERENCES horarios(id),

    CONSTRAINT fk_atendimento_sala
        FOREIGN KEY (id_sala)
        REFERENCES salas(id)
);


-- ==========================================
-- TABELAS ASSOCIATIVAS
-- ==========================================

CREATE TABLE aluno_atendimentos (
    id_aluno INT NOT NULL,
    id_atendimento INT NOT NULL,

    PRIMARY KEY (id_aluno, id_atendimento),

    CONSTRAINT fk_aluno_atendimento_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES alunos(id),

    CONSTRAINT fk_aluno_atendimento_atendimento
        FOREIGN KEY (id_atendimento)
        REFERENCES atendimentos(id)
);


CREATE TABLE usuario_notificacoes (
    id_usuario INT NOT NULL,
    id_notificacao INT NOT NULL,

    PRIMARY KEY (id_usuario, id_notificacao),

    CONSTRAINT fk_usuario_notificacao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id),

    CONSTRAINT fk_usuario_notificacao_notificacao
        FOREIGN KEY (id_notificacao)
        REFERENCES notificacoes(id)
);


CREATE TABLE professor_turmas (
    id_professor INT NOT NULL,
    id_turma INT NOT NULL,

    PRIMARY KEY (id_professor, id_turma),

    CONSTRAINT fk_professor_turma_professor
        FOREIGN KEY (id_professor)
        REFERENCES professor(id),

    CONSTRAINT fk_professor_turma_turma
        FOREIGN KEY (id_turma)
        REFERENCES turmas(id)
);


CREATE TABLE professor_disciplinas (
    id_professor INT NOT NULL,
    id_disciplina INT NOT NULL,

    PRIMARY KEY (id_professor, id_disciplina),

    CONSTRAINT fk_professor_disciplina_professor
        FOREIGN KEY (id_professor)
        REFERENCES professor(id),

    CONSTRAINT fk_professor_disciplina_disciplina
        FOREIGN KEY (id_disciplina)
        REFERENCES disciplinas(id)
);


CREATE TABLE horario_salas (
    id_horario INT NOT NULL,
    id_sala INT NOT NULL,

    PRIMARY KEY (id_horario, id_sala),

    CONSTRAINT fk_horario_sala_horario
        FOREIGN KEY (id_horario)
        REFERENCES horarios(id),

    CONSTRAINT fk_horario_sala_sala
        FOREIGN KEY (id_sala)
        REFERENCES salas(id)
);