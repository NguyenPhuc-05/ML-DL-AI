# Dự án 2: Breast Cancer SVM

Ứng dụng minh họa phân loại hai nhóm `malignant` và `benign` từ 30 đặc trưng của bộ dữ liệu Breast Cancer Wisconsin Diagnostic.

> Đây là đồ án học máy, không phải công cụ chẩn đoán y tế. Không nhập thông tin nhận dạng bệnh nhân và không sử dụng kết quả để quyết định điều trị.

## Mô hình

- Chia dữ liệu 80/20 với `stratify=y` và `random_state=42`.
- Pipeline gồm `StandardScaler` và `SVC(kernel="rbf")`.
- Grid search 5-fold trên tập huấn luyện.
- `recall_macro` cân bằng recall của cả hai lớp; sensitivity malignant được báo cáo riêng.
- Artifact hiện tại dùng `C=10`, `gamma=0.01` và scikit-learn 1.9.1.

Trên tập kiểm tra cố định trong script huấn luyện, artifact hiện tại đạt sensitivity malignant xấp xỉ 97,6%. Con số này chỉ mô tả lần chia dữ liệu nội bộ, không phải bằng chứng kiểm định lâm sàng hoặc hiệu năng trên quần thể khác.

## Thành phần

- `backend/scripts/train.py`: huấn luyện, đánh giá và xuất artifact.
- `backend/artifacts/`: pipeline và metadata.
- `backend/app/main.py`: API, validation và CORS.
- `backend/tests/`: kiểm thử schema, validation, xác suất và mẫu hồi quy.
- `frontend/`: giao diện nhập 30 đặc trưng và hiển thị kết quả minh họa.

## Chạy và kiểm thử

```bash
cd backend
python -m venv .venv
python -m pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload
```

Các endpoint chính: `/health`, `/metadata`, `/docs` và `POST /predict`.

## Huấn luyện lại

```bash
cd backend
python scripts/train.py
python -m pytest -q
```

Sau khi huấn luyện lại, cần kiểm tra metric, cập nhật `model_version`, commit đồng thời artifact và metadata, rồi xác nhận CI thành công.
