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
- **Kiểm thử độ vững mô hình (Robustness Test)** — Mô phỏng nhiễu Gauss và điểm ngoại lai để đánh giá khả năng kháng nhiễu của 4 kernel.
- **Sơ đồ cấu tạo hoa tương tác** — Đồ họa SVG trực quan hóa vị trí đo đạc Sepal/Petal đồng bộ thời gian thực với thanh trượt.
- **Báo cáo phân loại mẫu hoa (Audit Report & PDF)** — Xuất báo cáo kết quả phân loại định dạng in ấn/PDF với mã băm toàn vẹn SHA-256 và chữ ký điện tử.
- **Chế độ Hướng dẫn tính năng** — Thuyết minh trực quan giúp người xem nhanh chóng nắm bắt các chức năng của hệ thống.
- **Live SVM Playground** — Khảo sát ảnh hưởng của siêu tham số C, γ theo thời gian thực và chẩn đoán Overfitting/Underfitting.
- **Kernel Benchmark** — Bảng đối sánh thực nghiệm 4 hàm nhân SVM về độ chính xác CV, latency và decision boundary.
- **Explainable AI (XAI)** — Phân tích độ nhạy nhiễu (Sensitivity Attribution) giải thích lý do đưa ra kết quả.
- **Batch CSV & Database** — Phân loại hàng loạt mẫu từ file CSV, xuất kết quả Excel và lưu trữ CSDL.

---

## Kiến trúc hệ thống (Architecture)

Hệ thống hoạt động theo mô hình Microservices tách biệt giữa Định danh (SSO IdP) và Suy luận Máy học:
1. Người dùng xác thực tập trung tại **identity-service**, nhận JWT mang claim `aud=client_id` (ví dụ: `aud: "iris-svm-api"`).
2. Frontend đính kèm Bearer JWT này vào mọi request gửi tới **iris-svm-api**.
3. **iris-svm-api** xác thực chữ ký số độc lập qua dependency dùng chung `shared/auth.py` bằng `JWT_SECRET` và đối sánh `aud == CLIENT_ID`.

```
Browser (Frontend)
  │
  ├─► [Đăng nhập/Đăng ký] ─────────► identity-service (port 8001)
  │                                       │ (Cấp JWT có aud=client_id)
  │   ◄── Token JWT (aud=iris-svm-api) ───┘
  │
  └─► [Request + Bearer JWT] ──────► iris-svm-api (port 8000)
                                          │ (Xác minh cục bộ qua shared/auth.py)
                                          ▼
                                     Trả về kết quả SVM
```

| Dịch vụ | Vai trò kiến trúc | Port |
|---|---|---|
| `identity-service` | IdP/SSO tập trung: quản lý tài khoản, cấp JWT `aud=client_id` | 8001 |
| `iris-svm-api` | API suy luận SVM, bảo vệ bởi JWT qua `shared/auth.py` | 8000 |
| `iris-svm-frontend` | Giao diện tương tác người dùng | 3000 |

---

## Cơ sở toán học & Đánh giá thực nghiệm

- **Quy ước độ rộng lề (Margin convention):** Khoảng cách từ siêu phẳng phân tách đến mỗi siêu phẳng biên là $1/\|w\|$, tổng độ rộng toàn phần của lề phân tách là $M = 2/\|w\|$.
- **Hành vi tham số phạt C:** Khi $C \to \infty$, bài toán tiến tới tiệm cận lề cứng (Hard Margin); mô hình `sklearn.svm.SVC` sử dụng cơ chế lề mềm (Soft Margin) với mặc định $C=1.0$.
- **Đánh giá Cross-Validation:** Độ chính xác 5-fold CV (Linear 96.67%, RBF 96.00%, Sigmoid 91.33%, Poly 90.67%) phản ánh hiệu năng xác thực chéo nội bộ, không phải điểm số kiểm thử độc lập (held-out test score); các tham số $C$ và $\gamma$ giữ nguyên giá trị mặc định của scikit-learn (chưa qua tuning). Chênh lệch giữa Linear và RBF nhỏ hơn một độ lệch chuẩn (std ≈ 0.04–0.05), do đó không có kernel nào được tuyên bố là vượt trội tuyệt đối.
- **Xác suất Platt scaling:** Xác suất dự đoán được tính từ phương pháp hiệu chuẩn Platt scaling và có thể xếp hạng khác với giá trị hàm quyết định; nhãn loài hoa chính thức luôn được xác định trực tiếp từ `model.predict()`.

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

## Biến môi trường bắt buộc (Required Environment Variables)

| Biến | Dịch vụ áp dụng | Bắt buộc | Mô tả |
|---|---|---|---|
| `JWT_SECRET` | `identity-service` & `iris-svm-api` | **Bắt buộc** | Khóa ký JWT HMAC-SHA256 (tối thiểu 32 ký tự, phải giống hệt nhau ở cả 2 dịch vụ). |
| `OWNER_EMAIL` | `identity-service` | **Bắt buộc** | Email tài khoản sở hữu / quản trị hệ thống (chuẩn hóa chữ thường). |
| `OWNER_PASSWORD` | `identity-service` | **Bắt buộc** | Mật khẩu tài khoản sở hữu (tối thiểu 8 ký tự; nếu bỏ trống sẽ bỏ qua tạo tài khoản owner). |
| `CLIENT_IDS` | `identity-service` | **Bắt buộc** | Danh sách client ID hợp lệ, phân cách bằng dấu phẩy (vd: `iris-svm-api,breast-cancer-api`). |
| `CLIENT_ID` | `iris-svm-api` | **Bắt buộc** | ID dịch vụ của API Iris (`iris-svm-api`), dùng xác thực audience (`aud`) trong JWT. |
| `FRONTEND_ORIGINS` | `identity-service` & `iris-svm-api` | **Bắt buộc** | Danh sách URL frontend được phép truy cập CORS, phân cách bởi dấu phẩy. |
| `DATABASE_URL` | `iris-svm-api` | Tùy chọn | URL kết nối cơ sở dữ liệu MySQL (để trống = dùng SQLite fallback). |
| `IDP_DATABASE_URL` | `identity-service` | Tùy chọn | URL SQLite/PostgreSQL cho IdP (mặc định: `identity.db`). |

> **Lưu ý về lưu trữ trên Render (Free Tier):** CSDL SQLite trên gói Render miễn phí là **tạm thời (ephemeral)**. Khi instance restart hoặc sleep sau thời gian không hoạt động, hệ thống tệp đĩa cục bộ sẽ được reset (danh sách tài khoản và lịch sử dự đoán có thể được tạo lại từ cấu hình ban đầu).

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