from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autoflush=False)

Base = declarative_base()

def init_db() -> None:
    """Create all SQLAlchemy tables for the configured Database"""
    import models.user  
    import models.trip
    Base.metadata.create_all(bind=engine)