from typing import Annotated
from sqlmodel import Session
from fastapi import FastAPI, Depends
from database import create_db, get_session
from contextlib import asynccontextmanager

SessionDep = Annotated[Session, Depends(get_session)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    yield