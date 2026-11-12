# Manual de execução do projeto

Este documento descreve como rodar o frontend e o backend do projeto localmente.

## 1. Requisitos

- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL rodando localmente
- Git

## 2. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd Pratica_POAS
```

## 3. Configurar variáveis de ambiente

### Backend

Crie o arquivo `backend/.env` com base no exemplo:

```bash
cp backend/.env.example backend/.env
```

Exemplo de conteúdo:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/poas?sslmode=require
JWT_SECRET=sua_chave_secreta_jwt_aqui
JWT_EXPIRE_HOURS=24

ENVIRONMENT=development
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_CREATE_ALL=false
SQL_ECHO=false

CLIENT_ID=seu_client_id_suap
CLIENT_SECRET=seu_client_secret_suap
REDIRECT_URI=http://localhost:5173/callback
SUAP_TOKEN_URL=https://suap.ifrn.edu.br/o/token/
SUAP_PROFILE_URL=https://suap.ifrn.edu.br/api/rh/meus-dados/
SUAP_RH_EU=https://suap.ifrn.edu.br/api/rh/eu/
```

> Ajuste `DATABASE_URL` para o seu PostgreSQL local.

### Frontend

Crie o arquivo `frontend/.env` com base no exemplo:

```bash
cp frontend/.env.example frontend/.env
```

Conteúdo esperado:

```env
VITE_API_URL=http://localhost:8000/api
```

## 4. Instalar dependências

### Backend

```bash
cd backend
python -m venv .venv
```

No Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

No Linux/macOS:

```bash
source .venv/bin/activate
```

Depois:

```bash
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## 5. Rodar o backend

Na pasta `backend`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API ficará disponível em:

- http://localhost:8000
- Swagger: http://localhost:8000/docs

## 6. Rodar o frontend

Em outra aba do terminal:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

A interface ficará disponível em:

- http://localhost:5173

## 7. Build de produção

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

Se precisar, também é possível rodar o projeto em modo de desenvolvimento com o backend e o frontend em terminais separados, como descrito acima.
