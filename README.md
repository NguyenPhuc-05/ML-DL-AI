# Machine Learning, Deep Learning, AI & Data Science

Monorepo này lưu các đồ án học máy theo kiến trúc tách biệt giữa quá trình huấn luyện, REST API FastAPI và giao diện web tĩnh. Mỗi dự án có thể phát triển, kiểm thử và triển khai độc lập; `render.yaml` ở thư mục gốc quản lý toàn bộ dịch vụ trên Render.

> Các ứng dụng trong repository chỉ phục vụ học tập và minh họa kỹ thuật.

## Các dự án

| Dự án | Bài toán | Mô hình | Dữ liệu | Demo |
|---|---|---|---|---|
| Iris SVM | Phân loại Setosa, Versicolor và Virginica từ 4 đặc trưng | SVC kernel tuyến tính | `sklearn.datasets.load_iris` | [Frontend](https://iris-svm-frontend-6s3t.onrender.com) · [API](https://iris-svm-api-yfd4.onrender.com/docs) |

## Kiến trúc

```text
ML-DL-AI-DS/
├── .github/workflows/ci.yml
├── render.yaml
├── Du_an_1_Iris_SVM/
│   ├── README.md
│   ├── backend/
│   │   ├── app/
│   │   ├── artifacts/
│   │   ├── scripts/
│   │   ├── tests/
│   │   └── requirements.txt
│   └── frontend/


Luồng xử lý chung:

```text
Dữ liệu -> Huấn luyện offline -> Artifact mô hình -> FastAPI -> Frontend
```

## Chạy cục bộ

Yêu cầu Python 3.12 trở lên.

### Iris

```bash
cd Du_an_1_Iris_SVM/backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```



Mở frontend bằng một static server, ví dụ:

```bash
python -m http.server 5500 --directory ../frontend
```

Khi chạy frontend trên một origin khác, đặt biến môi trường `FRONTEND_ORIGINS` cho backend. Nhiều origin được phân tách bằng dấu phẩy.

## Kiểm thử

```bash
cd Du_an_1_Iris_SVM/backend && python -m pytest -q
```

GitHub Actions tự động kiểm tra backend và cú pháp JavaScript cho mọi pull request vào `main`.

## Triển khai

[`render.yaml`](render.yaml) khai báo bốn dịch vụ:

- Web Service chạy FastAPI;
- Static Site phục vụ frontend;
- health check cho từng backend;
- CORS chỉ cho phép các frontend đã khai báo và môi trường localhost.

Gói Render miễn phí có thể cần thời gian khởi động sau khi không hoạt động. Frontend sẽ hiển thị trạng thái “đang khởi động” và tự thử lại trước khi báo lỗi.

## Tái lập mô hình

Artifact được commit để dịch vụ có thể khởi động mà không huấn luyện lại trong lúc deploy. Phiên bản scikit-learn được khóa theo phiên bản đã dùng để tạo artifact.

```bash
cd Du_an_1_Iris_SVM/backend
python scripts/train.py

```

Sau khi huấn luyện lại, cần cập nhật artifact, metadata, chạy toàn bộ test và tăng `model_version` nếu hành vi mô hình thay đổi.

## Đóng góp

Quy ước nhánh, commit và pull request được mô tả trong [`CONTRIBUTING.md`](CONTRIBUTING.md).

