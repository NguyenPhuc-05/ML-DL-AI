from sqlalchemy import Column, Integer, String, Float
from database.db import Base, engine

class PredictionRecord(Base):
    """
    Model độc lập định nghĩa bảng lưu trữ lịch sử phân loại.
    Chạy trên CSDL SQL chính thức thay vì SQLite local.
    """
    __tablename__ = "user_predictions"

    id = Column(Integer, primary_key=True, index=True)
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

# Khởi tạo bảng nếu chưa tồn tại
Base.metadata.create_all(bind=engine)
