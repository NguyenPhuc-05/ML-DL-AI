# Dự án 1: Iris SVM

Ứng dụng phân loại ba loài Iris từ bốn kích thước đài hoa và cánh hoa bằng SVM kernel tuyến tính.

## Thành phần

- `backend/app/`: FastAPI và hợp đồng request/response.
- `backend/artifacts/`: mô hình đã huấn luyện và metadata.
- `backend/scripts/train.py`: đánh giá chéo, huấn luyện trên toàn bộ dữ liệu và xuất artifact.
- `backend/tests/`: kiểm thử health, metadata, dự đoán và validation.
- `frontend/`: giao diện nhập liệu và hiển thị kết quả.

## Chạy backend

```bash
cd backend
python -m venv .venv
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Các endpoint chính: `/health`, `/metadata`, `/docs` và `POST /predict`.

Payload mẫu:

```json
{
  "sepal_length": 5.1,
  "sepal_width": 3.5,
  "petal_length": 1.4,
  "petal_width": 0.2
}
```

## Kiểm thử và huấn luyện lại

```bash
python -m pytest -q
python scripts/train.py
```

Artifact hiện tại được tạo bằng scikit-learn 1.9.1. Nếu huấn luyện lại bằng phiên bản khác, cần commit đồng thời mô hình và metadata mới.
