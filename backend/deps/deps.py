from typing import Annotated
import logging
from sqlmodel import Session
from sqlalchemy import text
from fastapi import FastAPI, Depends
from database import create_db, get_session, engine
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

SessionDep = Annotated[Session, Depends(get_session)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    # Aquece o pool de conexões na subida do servidor. Assim a primeira
    # requisição do usuário não paga o custo de estabelecer a conexão
    # (cold start de bancos gerenciados, como o Neon).
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Pool de conexões aquecido.")
    except Exception as exc:
        logger.warning(f"Não foi possível aquecer o pool de conexões: {exc}")
    yield