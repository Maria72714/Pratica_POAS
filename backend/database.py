from sqlmodel import Session, SQLModel, create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def create_db():
  SQLModel.metadata.create_all(engine)

def get_session():
  with Session(engine) as session:
    yield session
 