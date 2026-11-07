# Đồ Án 1 — Phân loại Hoa Iris bằng SVM Đa Nhân

> **Học phần:** Học máy Nâng cao  
> **Sinh viên:** Nguyễn Xuân Phúc — MSSV 3110524025 — Lớp 24CKDL  
> **Đơn vị:** Khoa Toán - Tin, Trường ĐH Sư phạm — ĐH Đà Nẵng  
> **Giảng viên:** TS. Phan Trần Đức Minh

---

## Giới thiệu

Dự án xây dựng hệ thống phân loại ba loài hoa Iris (*Setosa, Versicolor, Virginica*) dùng thuật toán **Support Vector Machine (SVM)** với bốn loại nhân khác nhau. Ngoài chức năng phân loại cơ bản, hệ thống còn tích hợp các tính năng học thuật nâng cao và cá nhân hóa độc đáo:

- **Không gian 3D PCA (Xoay 360°)** — Phép chiếu giảm chiều 4D → 3D bảo toàn **99.48% phương sai**, trực quan hóa không gian đa chiều, mặt phân cách và các Support Vectors với camera xoay tự do.
- **KKT & Lagrange Multipliers ($\alpha_i$) Inspector** — Phân tích bài toán đối ngẫu và phân loại Support Vectors thành *Free SV* ($0 < \alpha_i < C$) và *Bounded SV* ($\alpha_i = C$) theo định lý Karush-Kuhn-Tucker.
- **Stress-Test & Outlier Attack Simulator** — Giả lập nhiễu Gauss và chèn điểm ngoại lai đối kháng để kiểm chứng và xếp hạng độ bền (Robustness Score) của 4 kernel.
- **Interactive Botanical Anatomy** — Sơ đồ giải phẫu hoa Iris (SVG) tương tác thời gian thực với thanh trượt đo đạc Sepal/Petal.
- **Phiếu Thẩm Định Dự Đoán (Official Audit Certificate)** — Xuất báo cáo kiểm định học thuật định dạng in ấn/PDF với mã băm toàn vẹn SHA-256 và chữ ký điện tử.
- **Chế độ Guided Tour** — Thuyết minh đồ án tương tác dẫn dắt giảng viên/người xem qua từng góc nhìn thực nghiệm của sinh viên.
- **Live SVM Playground** — Điều chỉnh C, γ, degree theo thời gian thực và nhận chẩn đoán Overfitting/Underfitting.
- **Kernel Arena** — So sánh song song 4 kernel về độ chính xác CV, latency và decision boundary.
- **Explainable AI (XAI)** — Phân tích độ nhạy nhiễu (Sensitivity Attribution) giải thích lý do đưa ra kết quả.
- **Batch CSV & Database** — Phân loại hàng loạt mẫu từ file CSV, xuất kết quả Excel và lưu trữ CSDL.

---

## Kiến trúc hệ thống

```
Browser
  │
  ├─► iris-svm-frontend (port 3000)  — HTML / CSS / Canvas API
  │         │  gửi JWT trong header
  │         ▼
  ├─► iris-svm-api      (port 8000)  — FastAPI + 4 mô hình SVM
  │         │  xác minh JWT qua shared/auth.py
  │         ▼
  └─► identity-service  (port 8001)  — IdP/SSO cấp JWT chung cho các dự án
```

| Dịch vụ | Mô tả | Port |
|---|---|---|
| `identity-service` | Cấp JWT cho mọi dự án trong môn học | 8001 |
| `iris-svm-api` | Backend SVM, bảo vệ bởi JWT | 8000 |
| `iris-svm-frontend` | Giao diện web tĩnh | 3000 |

---

## Cấu trúc thư mục

```
iris-svm/
├── .github/workflows/ci.yml     # CI tự động (backend + frontend syntax)
├── render.yaml                  # Cấu hình triển khai Render
├── identity_service/            # SSO dùng chung cho các dự án
│   ├── app/
│   │   ├── main.py              # FastAPI: /register /login /me /admin/users
│   │   ├── db.py                # SQLAlchemy engine (SQLite mặc định)
│   │   └── models.py            # User, Client model + migration + seed
│   ├── tests/
│   │   └── test_identity.py
│   └── requirements.txt
├── shared/
│   └── auth.py                  # Dependency FastAPI xác minh JWT (dùng chung)
└── Du_an_1_Iris_SVM/
    ├── backend/
    │   ├── app/
    │   │   └── main.py          # Toàn bộ endpoint API
    │   ├── artifacts/           # 4 file .joblib mô hình đã huấn luyện
    │   ├── scripts/
    │   │   └── train.py         # Huấn luyện lại 4 kernel, ghi metadata.json
    │   ├── tests/
    │   │   └── test_api.py      # 17 test case (14 cũ + 3 test SSO)
    │   └── requirements.txt
    ├── database/
    │   ├── db.py                # Kết nối MySQL (fallback SQLite)
    │   ├── models.py            # PredictionRecord model
    │   └── idp.py               # IdP router nhúng vào backend (fallback offline)
    ├── frontend/
    │   ├── index.html
    │   ├── style.css
    │   ├── script.js
    │   └── images/
    └── notebooks/
        └── 01_eda_and_svm_experiments.ipynb
```

---

## Cài đặt & Chạy cục bộ

**Yêu cầu:** Python 3.12.10 (xem `.python-version`).

### Bước 1 — Identity Service (khởi động trước)

```bash
cd identity_service
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # điền JWT_SECRET (chuỗi >= 32 ký tự)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Bước 2 — Backend Iris SVM

```bash
cd Du_an_1_Iris_SVM
python -m venv .venv
.venv\Scripts\activate

pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # dùng cùng JWT_SECRET với bước 1

cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Swagger UI: `http://localhost:8000/docs`  
Health check: `http://localhost:8000/health`

### Bước 3 — Frontend

```bash
cd Du_an_1_Iris_SVM/frontend
python -m http.server 3000
```

Mở `http://localhost:3000`

---

## Biến môi trường

| Biến | Dịch vụ | Mô tả |
|---|---|---|
| `JWT_SECRET` | identity-service **và** iris-svm-api | Khóa ký JWT — **phải giống nhau ở cả hai** |
| `CLIENT_IDS` | identity-service | Danh sách client hợp lệ, phân cách bằng dấu phẩy |
| `CLIENT_ID` | iris-svm-api | ID của service này (`iris-svm-api`) |
| `FRONTEND_ORIGINS` | identity-service | CORS origins cho frontend |
| `DATABASE_URL` | iris-svm-api | MySQL URL (để trống = dùng SQLite fallback) |
| `IDP_DATABASE_URL` | identity-service | SQLite/PostgreSQL cho IdP (mặc định: `identity.db`) |
| `OWNER_EMAIL` | identity-service | Email tài khoản admin |
| `OWNER_PASSWORD` | identity-service | Mật khẩu tài khoản admin |

---

## Kiểm thử

```bash
# Backend Iris SVM (20 test cases: Core SVM + SSO IdP + KKT / 3D PCA / Stress-Test)
cd Du_an_1_Iris_SVM/backend
python -m pytest tests -v

# Identity Service
cd identity_service
python -m pytest -v
```

GitHub Actions chạy tự động khi push/PR vào nhánh `main`.

---

## Huấn luyện lại mô hình

```bash
cd Du_an_1_Iris_SVM/backend
python scripts/train.py
```

Sau khi huấn luyện xong, tăng `model_version` trong `metadata.json` nếu hành vi mô hình thay đổi đáng kể.

---

## Triển khai (Render)

`render.yaml` khai báo ba dịch vụ: `identity-service`, `iris-svm-api` và `iris-svm-frontend`. Gói Render miễn phí có thể cần vài giây khởi động lại sau khi không hoạt động — frontend sẽ tự thử lại trước khi báo lỗi.

Demo: [Frontend](https://iris-svm-frontend-6s3t.onrender.com) · [API Docs](https://iris-svm-api-yfd4.onrender.com/docs)