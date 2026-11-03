# Machine Learning, Deep Learning, AI & Data Science

Monorepo này lưu các đồ án học máy theo kiến trúc tách biệt giữa quá trình huấn luyện, REST API FastAPI và giao diện web tĩnh. Mỗi dự án có thể phát triển, kiểm thử và triển khai độc lập; `render.yaml` ở thư mục gốc quản lý toàn bộ dịch vụ trên Render.

> Các ứng dụng trong repository chỉ phục vụ học tập và minh họa kỹ thuật.

## Các dự án

| Dự án | Bài toán | Mô hình | Dữ liệu | Demo |
|---|---|---|---|---|
| Iris SVM | Phân loại Setosa, Versicolor và Virginica từ 4 đặc trưng | SVC kernel tuyến tính | `sklearn.datasets.load_iris` | [Frontend](https://iris-svm-frontend-6s3t.onrender.com) · [API](https://iris-svm-api-yfd4.onrender.com/docs) |

## Kiến trúc Hệ Thống (SSO + Đa Dự Án)

T�� phi�n bản này, hệ thống được tách thành **3 dịch vụ độc lập**, chia sẻh một **Identity Provider (IdP/SSO)** trung tâm:

```text
                    ┌──────────────────┐
  Browser  --------> | iris-svm-frontend  |  gửi JWT trong header
                    └────────┤─────────┘
                               |
              ┌─────────┼─────┐  ┌──────────────────┐
              | iris-svm-api   |JWT | identity-service   |
              | :8000          |<---| :8001              |
              | shared/auth.py |    | /register /login   |
              └───────────────┘  └──────────────────┘
```

| Dịch vụ | Mô tả | Port |
|---|---|---|
| `identity-service` | Cấp JWT cho mọi dự án | 8001 |
| `iris-svm-api` | Backend SVM + bảo vệ bằng JWT | 8000 |
| `iris-svm-frontend` | Giao diện web tĩnh | 3000 |

## Biến Môi trường (Environment Variables)

| Biến | Dịch vụ | Mô tả |
|---|---|---|
| `JWT_SECRET` | identity-service + iris-svm-api | Khóa ký JWT (**phải giống nhau** ở cả hai) |
| `CLIENT_IDS` | identity-service | DS client được ph�ép (đ/c: `iris-svm-api`) |
| `CLIENT_ID` | iris-svm-api | ID của service này (`iris-svm-api`) |
| `FRONTEND_ORIGINS` | identity-service | CORS origins cho frontend |
| `DATABASE_URL` | iris-svm-api | MySQL hoặc để trống (SQLite fallback) |

## Chạy cục bộ (3 terminal)

```bash
# Terminal 1 — Identity Service (cần khởi động đầu tiên)
cd identity_service
python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # sửa JWT_SECRET
python -m uvicorn app.main:app --port 8001 --reload

# Terminal 2 — Iris SVM Backend
cd Du_an_1_Iris_SVM
python -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # điền JWT_SECRET (cùng giá trị với terminal 1)
cd backend && PYTHONPATH=../.. python -m uvicorn app.main:app --port 8000 --reload

# Terminal 3 — Frontend
cd Du_an_1_Iris_SVM/frontend
python -m http.server 3000
```

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

