# Projeto Prática

docs: https://docs.google.com/document/d/1TAAgqXNDqt-VwOz2UvTYLu7HG_jW5TVuvvDxYErDZT8/edit?usp=sharing

O **Projeto Prática** é um sistema web desenvolvido para modernizar e centralizar o cadastro de **Centros de Aprendizagem (CA)** do **IFRN**, servindo como uma ponte eficiente entre alunos e professores.

---

## Equipe

A execução do projeto é realizada pelos desenvolvedores:

- **Eduardo Vinícius**
- **José Abílio**
- **Lucas Fernando**
- **Maria Luíza**

---

## Proposta

Auxiliar a comunidade acadêmica do IFRN através de uma interface intuitiva que facilite o registro, a consulta e a gestão dos Centros de Aprendizagem, otimizando o fluxo de informações institucionais.

---

# Tecnologias Utilizadas

## Front-End
- HTML
- CSS
- JavaScript

## Back-End
- Python
- Flask
- Flask Login
- Flask SQLAlchemy
- Flask Bcrypt

## Banco de Dados
- MySQL

## Ferramentas
- Git/GitHub
- Figma
- Trello
- XAMPP
- MySQL Workbench

---

# Estrutura do Projeto

```txt
Pratica_POAS/
│
├── backend/
│   ├── app.py
│   ├── banco.py
│   ├── schema.sql
│   ├── requirements.txt
│   ├── .env
│   │
│   └── models/
│       └── usuario.py
│
└── frontend/
    │
    ├── templates/
    │   ├── index.html
    │   ├── login.html
    │   └── dashboard.html
    │
    └── static/
        ├── style.css
        └── script.js

Como Rodar o Projeto
1. Clone o repositório
git clone https://github.com/Maria72714/Pratica_POAS.git
2. Entre na pasta do projeto
cd Pratica_POAS
3. Crie um ambiente virtual
Windows
python -m venv venv
4. Ative o ambiente virtual
CMD
venv\Scripts\activate
PowerShell
.\venv\Scripts\Activate.ps1
5. Instale as dependências
pip install -r backend/requirements.txt
Configuração do Banco de Dados
1. Abra o XAMPP

Inicie:

Apache
MySQL
2. Crie o banco de dados

Abra o MySQL Workbench e execute:

CREATE DATABASE pratica;

Depois:

USE pratica;
3. Execute o schema.sql

Abra e execute o arquivo:

backend/schema.sql
Configuração do arquivo .env

Crie um arquivo .env dentro da pasta backend.

Exemplo:

DATABASE_URL=mysql+pymysql://root:@localhost/pratica

Caso o MySQL tenha senha:

DATABASE_URL=mysql+pymysql://root:SENHA@localhost/pratica
Executando o Projeto
Entre na pasta backend
cd backend
Rode a aplicação Flask
python app.py

Se tudo estiver correto, aparecerá algo semelhante a:

Running on http://127.0.0.1:5000
Acesse no navegador
http://127.0.0.1:5000