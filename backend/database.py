from sqlmodel import Session, SQLModel, create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = "postgresql://neondb_owner:npg_Pf6CAmbDaJ7t@ep-long-bonus-aykbtgcj-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

def create_db():
  SQLModel.metadata.create_all(engine)

def get_session():
  with Session(engine) as session:
    yield session
 