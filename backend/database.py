import os
import logging
from pathlib import Path
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não configurada no arquivo backend/.env"
    )

echo_sql = os.getenv("SQL_ECHO", "false").lower() in {"1", "true", "yes"}
environment = os.getenv("ENVIRONMENT", "development").lower()

# Parâmetros comuns do pool. O tamanho maior evita que requisições paralelas do
# frontend (dashboard dispara várias ao mesmo tempo) fiquem na fila esperando
# uma conexão livre.
_pool_kwargs = dict(
    poolclass=QueuePool,
    pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
    connect_args={"connect_timeout": 10},
)

if environment == "production":
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_recycle=3600,
        pool_pre_ping=True,
        **_pool_kwargs,
    )
else:
    # Em desenvolvimento o banco (Neon) fica em outra região (us-east) e cada
    # round-trip custa ~150ms. O ``pool_pre_ping`` executa um SELECT 1 extra a
    # CADA checkout do pool, praticamente dobrando a latência por requisição.
    # Como as conexões passam pelo pooler (PgBouncer) do Neon, que não encerra
    # clientes ociosos, podemos desligá-lo e reciclar as conexões com folga.
    engine = create_engine(
        DATABASE_URL,
        echo=echo_sql,
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
        pool_pre_ping=False,
        **_pool_kwargs,
    )


def create_db():
    if environment == "production":
        return
    if os.getenv("DB_CREATE_ALL", "false").lower() in {"1", "true", "yes"}:
        SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
