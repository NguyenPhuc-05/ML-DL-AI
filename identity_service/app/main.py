import os
import bcrypt
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from app.db import get_db
    from app.models import Client, User, init_db
except (ImportError, ModuleNotFoundError):
    from identity_service.app.db import get_db
    from identity_service.app.models import Client, User, init_db

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "identity_service_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60

security = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Centralized Identity Provider (IdP)",
    description="Unified SSO Identity Provider for All Projects",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
raw_origins = os.getenv("FRONTEND_ORIGINS", "")
if raw_origins.strip():
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Schemas ───

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str
    client_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    is_owner: bool = False


# ─── Auth Helper Functions ───

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
        "is_owner": is_owner,  # claim bổ sung để frontend nhận biết owner
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(expires_delta.total_seconds())


def decode_owner_token(credentials: Optional[HTTPAuthorizationCredentials]) -> dict:
    """Dependency: chỉ cho phép owner truy cập. Trả về payload nếu hợp lệ."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        if not payload.get("is_owner"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ tài khoản chủ sở hữu mới có quyền truy cập",
            )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── Endpoints ───

@app.get("/health")
def health():
    return {"status": "ok", "service": "identity-service"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()

    # Không cho phép đăng ký đè lên tài khoản owner
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được đăng ký",
        )

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        is_owner=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "msg": "Đăng ký thành công",
    }


@app.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # 1. Validate client_id
    client = db.query(Client).filter(Client.client_id == payload.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown client_id '{payload.client_id}'",
        )

    # 2. Validate user credentials
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai email hoặc mật khẩu",
        )

    # 3. Cập nhật last_login_at
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    # 4. Generate token (kèm is_owner claim)
    token, expires_in = create_access_token(user.id, user.email, payload.client_id, user.is_owner)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user={"id": user.id, "email": user.email, "is_owner": user.is_owner},
    )


@app.get("/me", response_model=UserResponse)
def get_me(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User không tồn tại",
        )

    return UserResponse(id=user.id, email=user.email, is_owner=user.is_owner)


# ─── Admin Endpoints (Owner only) ───

@app.get("/admin/users")
def admin_list_users(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
):
    """
    [OWNER ONLY] Danh sách tất cả tài khoản:
    email, thời điểm tạo, lần đăng nhập cuối, có phải owner không.
    """
    decode_owner_token(credentials)

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
    