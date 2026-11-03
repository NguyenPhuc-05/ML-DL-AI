import os
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from app.db import Base, engine, SessionLocal


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Client(Base):
    __tablename__ = "clients"

    client_id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)
    seed_clients()


def seed_clients():
    raw_clients = os.getenv("CLIENT_IDS", "iris-svm-api,breast-cancer-api")
    client_ids = [c.strip() for c in raw_clients.split(",") if c.strip()]
    if not client_ids:
        return

    db = SessionLocal()
    try:
        for cid in client_ids:
            existing = db.query(Client).filter(Client.client_id == cid).first()
            if not existing:
                db.add(Client(client_id=cid, name=cid))
        db.commit()
    finally:
        db.close()

