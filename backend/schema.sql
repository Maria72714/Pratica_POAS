CREATE TABLE disciplinas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE turmas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso VARCHAR(50) NOT NULL,
    ano VARCHAR(50) NOT NULL,
    turno VARCHAR(50) NOT NULL
);

CREATE TABLE usuarios(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE professor(
    id INT PRIMARY KEY,
    FOREIGN KEY (id) REFERENCES usuarios(id)
);

CREATE TABLE mediador(
    id INT PRIMARY KEY,
    FOREIGN KEY (id) REFERENCES usuarios(id)
);

CREATE TABLE alunos(
    id INT PRIMARY KEY,
    id_turma INT,
    necessidades_especiais BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (id) REFERENCES usuarios(id),
    FOREIGN KEY (id_turma) REFERENCES turmas(id)
);

CREATE TABLE notificacoes(
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(250) NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lido_em TIMESTAMP NULL
);

CREATE TABLE horarios(
    id INT AUTO_INCREMENT PRIMARY KEY,
    horario_inicio TIMESTAMP NOT NULL,
    horario_termino TIMESTAMP NOT NULL,

    status ENUM('Disponivel', 'Reservado')
);

CREATE TABLE salas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE solicitacoes(
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_aluno INT NOT NULL,
    id_mediador INT NOT NULL,

    assunto VARCHAR(500),

    status ENUM(
        'Pendente',
        'Aprovado',
        'Recusado',
        'Cancelado'
    ),

    FOREIGN KEY (id_aluno) REFERENCES alunos(id),
    FOREIGN KEY (id_mediador) REFERENCES mediador(id)
);

CREATE TABLE atendimentos(
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_professor INT NOT NULL,
    id_turma INT NOT NULL,
    id_horario INT NOT NULL,
    id_sala INT NOT NULL,
    id_disciplina INT NOT NULL,

    id_solicitacao INT UNIQUE,

    tipo_atendimento ENUM('TAL', 'TAI'),

    assunto VARCHAR(500),

    relatorio VARCHAR(500),

    status ENUM(
        'Agendado',
        'Concluido',
        'Cancelado'
    ),

    modalidade ENUM(
        'Presencial',
        'Remoto'
    ),

    FOREIGN KEY (id_professor) REFERENCES professor(id),
    FOREIGN KEY (id_turma) REFERENCES turmas(id),
    FOREIGN KEY (id_horario) REFERENCES horarios(id),
    FOREIGN KEY (id_sala) REFERENCES salas(id),
    FOREIGN KEY (id_disciplina) REFERENCES disciplinas(id),
    FOREIGN KEY (id_solicitacao) REFERENCES solicitacoes(id)
);

CREATE TABLE aluno_atendimentos(
    id_aluno INT,
    id_atendimento INT,

    PRIMARY KEY(id_aluno, id_atendimento),

    FOREIGN KEY (id_aluno) REFERENCES alunos(id),
    FOREIGN KEY (id_atendimento) REFERENCES atendimentos(id)
);

CREATE TABLE usuario_notificacoes(
    id_usuario INT,
    id_notificacao INT,

    PRIMARY KEY(id_usuario, id_notificacao),

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_notificacao) REFERENCES notificacoes(id)
);

CREATE TABLE professor_turmas(
    id_professor INT,
    id_turma INT,

    PRIMARY KEY(id_professor, id_turma),

    FOREIGN KEY (id_professor) REFERENCES professor(id),
    FOREIGN KEY (id_turma) REFERENCES turmas(id)
);

CREATE TABLE professor_disciplinas(
    id_professor INT,
    id_disciplina INT,

    PRIMARY KEY(id_professor, id_disciplina),

    FOREIGN KEY (id_professor) REFERENCES professor(id),
    FOREIGN KEY (id_disciplina) REFERENCES disciplinas(id)
);

CREATE TABLE horario_salas(
    id_horario INT,
    id_sala INT,

    PRIMARY KEY(id_horario, id_sala),

    FOREIGN KEY (id_horario) REFERENCES horarios(id),
    FOREIGN KEY (id_sala) REFERENCES salas(id)
);