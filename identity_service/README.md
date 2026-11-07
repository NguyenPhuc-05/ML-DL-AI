# Identity Service — SSO dùng chung cho các đồ án

Dịch vụ xác thực tập trung cho các đồ án trong môn Học máy Nâng cao. Mỗi dự án đăng ký một `client_id` riêng; người dùng chỉ cần một tài khoản duy nhất để đăng nhập vào tất cả.

**Các dự án đang dùng chung:**
- Đồ án 1 — Iris SVM (`client_id: iris-svm-api`)
- Đồ án 2 — Breast Cancer (`client_id: breast-cancer-api`)

---

## Endpoints

| Method | Path | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập, nhận JWT |
| GET | `/me` | Thông tin user hiện tại |
| GET | `/health` | Kiểm tra trạng thái dịch vụ |
| GET | `/admin/users` | Danh sách tài khoản (owner only) |

**Luồng xác thực:**
```
Browser -> POST /login (email + password + client_id)
        -> identity-service:8001 -> trả JWT (aud = client_id)
        -> iris-svm-api:8000 với header Authorization: Bearer <JWT>
        -> shared/auth.py xác minh chữ ký và audience
```

---

## JWT Claims

| Claim | Giá trị |
|---|---|
| `sub` | User ID |
| `email` | Email người dùng |
| `aud` | `client_id` của dịch vụ đang gọi |
| `exp` | Hết hạn sau 60 phút |
| `is_owner` | `true` nếu là tài khoản quản trị |

---

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `JWT_SECRET` | — | Khóa ký JWT, **phải giống ở mọi service** |
| `CLIENT_IDS` | `iris-svm-api,breast-cancer-api` | Danh sách client hợp lệ |
| `FRONTEND_ORIGINS` | `*` | CORS origins |
| `IDP_DATABASE_URL` | `sqlite:///./identity.db` | CSDL lưu user và client |
| `OWNER_EMAIL` | `admin@ml-dl-ai.local` | Email tài khoản admin |
| `OWNER_PASSWORD` | — | Mật khẩu tài khoản admin |
| `PORT` | `8001` | Port (local) |

---

## Chạy cục bộ

```bash
cd identity_service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

pip install -r requirements.txt
cp .env.example .env          # điền JWT_SECRET
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

API Docs: `http://localhost:8001/docs`