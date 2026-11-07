import os
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Dùng MySQL làm CSDL chính thức (theo yêu cầu của Giảng viên).
# Tạo database 'iris_svm' trong MySQL trước khi chạy.
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/iris_svm")

# Thư mục chứa file SQLite fallback (cùng thư mục với module này)
_FALLBACK_DB = Path(__file__).resolve().parent / "iris_fallback.db"

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print(f"[DB] Kết nối MySQL thành công: {DATABASE_URL}")
except Exception:
    print("[DB] Không kết nối được MySQL. Chuyển sang SQLite fallback.")
    _fallback_url = f"sqlite:///{_FALLBACK_DB.as_posix()}"
    engine = create_engine(_fallback_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
