import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Sử dụng MySQL làm CSDL chính thức theo yêu cầu của Giảng viên.
# Người dùng cần tạo database 'iris_svm' trong MySQL trước khi chạy.
# Thay đổi root và password cho phù hợp với môi trường của bạn.
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/iris_svm")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    # Thử kết nối thực tế để bắt lỗi nếu MySQL không tồn tại
    with engine.connect() as conn:
        pass
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"MySQL Connection Error. Falling back to SQLite.")
    # Fallback tạm thời nếu chưa cài MySQL để app không crash hoàn toàn
    fallback_url = "sqlite:///./iris_fallback.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
