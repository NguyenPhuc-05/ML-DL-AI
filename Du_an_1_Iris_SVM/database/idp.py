import os
import bcrypt
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ─── Database Setup (Độc lập SQLite identity.db) ───
BASE_DIR = Path(__file__).resolve().parent
DB_FILE = (BASE_DIR / "identity.db").resolve()
IDP_DB_URL = os.getenv("IDP_DATABASE_URL") or os.getenv("IDENTITY_DATABASE_URL") or f"sqlite:///{DB_FILE.as_posix()}"

engine = create_engine(IDP_DB_URL, connect_args={"check_same_thread": False} if IDP_DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    is_owner = Column(Boolean, default=False, nullable=False)


class Client(Base):
    __tablename__ = "clients"

    client_id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)


def get_idp_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_idp_db():
    Base.metadata.create_all(bind=engine)
    # Safe migration: add is_owner & last_login_at if missing
    try:
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "is_owner" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_owner BOOLEAN DEFAULT 0 NOT NULL"))
                    conn.commit()
                if "last_login_at" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
                    conn.commit()
    except Exception as e:
        print(f"Migration note: {e}")

    # Seed default clients
    raw_clients = os.getenv("CLIENT_IDS", "iris-svm-api,breast-cancer-api")
    client_ids = [c.strip() for c in raw_clients.split(",") if c.strip()]
    db = SessionLocal()
    try:
        for cid in client_ids:
            if not db.query(Client).filter(Client.client_id == cid).first():
                db.add(Client(client_id=cid, name=cid))
        # Seed fixed owner account
        owner_email = os.getenv("OWNER_EMAIL", "admin@ml-dl-ai.local")
        owner_password = os.getenv("OWNER_PASSWORD", "Admin@ML2024!!")
        existing_owner = db.query(User).filter(User.email == owner_email).first()
        if not existing_owner:
            pwd_bytes = owner_password.encode("utf-8")[:72]
            p_hash = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")
            db.add(User(email=owner_email, password_hash=p_hash, is_owner=True, created_at=datetime.now(timezone.utc)))
            print(f"[IDP] Seeded owner: {owner_email}")
        elif not existing_owner.is_owner:
            existing_owner.is_owner = True
        db.commit()
    finally:
        db.close()


# Khởi tạo db ngay khi load module
init_idp_db()

# ─── Auth Router ───
idp_router = APIRouter(tags=["Centralized Identity Provider"])
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "identity_service_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str
    client_id: str = "iris-svm-api"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    is_owner: bool = False


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: int, email: str, client_id: str, is_owner: bool = False) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_delta = timedelta(minutes=JWT_EXPIRATION_MINUTES)
    expire = now + expires_delta
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": client_id,
        "iat": now,
        "exp": expire,
        "is_owner": is_owner,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(expires_delta.total_seconds())


@idp_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_idp_db)):
    normalized_email = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã được đăng ký")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        is_owner=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "email": user.email, "msg": "Đăng ký thành công"}


@idp_router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_idp_db)):
    client = db.query(Client).filter(Client.client_id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown client_id '{payload.client_id}'")

    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai email hoặc mật khẩu")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token, expires_in = create_access_token(user.id, user.email, payload.client_id, user.is_owner)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user={"id": user.id, "email": user.email, "is_owner": user.is_owner},
    )


@idp_router.get("/me", response_model=UserResponse)
def get_me(credentials: Optional[HTTPAuthorizationCredentials] = Security(security), db: Session = Depends(get_idp_db)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc đã hết hạn")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User không tồn tại")

    return UserResponse(id=user.id, email=user.email, is_owner=user.is_owner)


@idp_router.get("/admin/users")
def admin_list_users(credentials: Optional[HTTPAuthorizationCredentials] = Security(security), db: Session = Depends(get_idp_db)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        if not payload.get("is_owner"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ chủ sở hữu mới có quyền truy cập")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")

    users = db.query(User).order_by(User.created_at.desc()).all()

    def fmt(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    return [
        {
            "id": u.id,
            "email": u.email,
            "is_owner": u.is_owner,
            "created_at": fmt(u.created_at),
            "last_login_at": fmt(u.last_login_at),
        }
        for u in users
    ]
