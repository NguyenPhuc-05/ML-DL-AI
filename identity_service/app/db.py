import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

APP_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_FILE = (APP_DIR / "identity.db").resolve()

# QUAN TRỌNG: Dùng IDP_DATABASE_URL riêng để không bao giờ bị dính biến DATABASE_URL (MySQL) của dự án chính
IDP_DB_URL = (
    os.getenv("IDP_DATABASE_URL") 
    or os.getenv("IDENTITY_DATABASE_URL") 
    or f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"
)

connect_args = {"check_same_thread": False} if IDP_DB_URL.startswith("sqlite") else {}

engine = create_engine(IDP_DB_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
