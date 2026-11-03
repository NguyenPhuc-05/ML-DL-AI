from sqlalchemy import Column, Integer, String, Float, inspect, text
from database.db import Base, engine


class PredictionRecord(Base):
    """
    Model định nghĩa bảng lưu trữ lịch sử phân loại cho từng người dùng.
    Mỗi bản ghi gắn với user_id (claim 'sub') cấp bởi Centralized Identity Service.
    """
    __tablename__ = "user_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), index=True, nullable=False, default="anonymous")
    sepal_length = Column(Float, nullable=False)
    sepal_width = Column(Float, nullable=False)
    petal_length = Column(Float, nullable=False)
    petal_width = Column(Float, nullable=False)
    kernel = Column(String(50), nullable=False)
    prediction = Column(String(50), nullable=False)
    class_id = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False)


def run_safe_migrations():
    """
    Safe migration: checks if 'user_predictions' table exists.
    If 'user_id' column is missing, executes ALTER TABLE to add it.
    """
    try:
        inspector = inspect(engine)
        if "user_predictions" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("user_predictions")]
            if "user_id" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE user_predictions ADD COLUMN user_id VARCHAR(100) DEFAULT 'anonymous'"))
                    conn.commit()
    except Exception as e:
        print(f"Migration note: {e}")


# Tạo bảng nếu chưa tồn tại và chạy safe migration
Base.metadata.create_all(bind=engine)
run_safe_migrations()
