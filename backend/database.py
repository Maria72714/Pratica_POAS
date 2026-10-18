import os
import logging
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não configurada no arquivo backend/.env"
    )

echo_sql = os.getenv("SQL_ECHO", "false").lower() in {"1", "true", "yes"}
environment = os.getenv("ENVIRONMENT", "development").lower()

if environment == "production":
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=echo_sql,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )


def create_db():
    if environment == "production":
        return
    if os.getenv("DB_CREATE_ALL", "false").lower() in {"1", "true", "yes"}:
        SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
