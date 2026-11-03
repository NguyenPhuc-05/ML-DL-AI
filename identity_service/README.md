# 🔐 Centralized Identity Service (IdP / SSO)

Dịch vụ định danh và xác thực tập trung dùng chung cho toàn bộ các đồ án thuộc môn **Học máy Nâng cao (ML-DL-AI)**:
- `Du_an_1_Iris_SVM` (client_id: `iris-svm-api`)
- `Du_an_2_Breast_Cancer` (client_id: `breast-cancer-api`)

## 📌 Tính năng chính
1. **Đăng ký tài khoản (`POST /register`):** Lưu trữ email (unique) và băm mật khẩu bảo mật với Bcrypt.
2. **Đăng nhập tập trung (`POST /login`):** Kiểm tra `client_id` hợp lệ, cấp phát JWT Token (HS256) chứa các claims:
   - `sub`: User ID
   - `email`: Email người dùng
   - `aud`: `client_id` của dịch vụ gọi đến
   - `exp`: Hạn sử dụng (60 phút)
3. **Tra cứu thông tin cá nhân (`GET /me`):** Xác thực qua `Authorization: Bearer <token>`.
4. **Kiểm tra trạng thái (`GET /health`):** Healthcheck endpoint.

## 🛠️ Biến môi trường (`.env`)
| Tên biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `8001` | Cổng dịch vụ chạy local |
| `JWT_SECRET` | `identity_service_secret_key` | Khóa bí mật ký JWT Token |
| `CLIENT_IDS` | `iris-svm-api,breast-cancer-api` | Danh sách các client_id được phép đăng nhập |
| `FRONTEND_ORIGINS` | `*` | Cấu hình CORS cho Frontend |
| `DATABASE_URL` | `sqlite:///./identity.db` | CSDL lưu trữ users và clients |

## 🚀 Chạy cục bộ (Local Development)
```bash
# 1. Di chuyển vào thư mục dịch vụ
cd identity_service

# 2. Cài đặt thư viện (hoặc dùng venv chung)
pip install -r requirements.txt

# 3. Khởi chạy server trên cổng 8001
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
API Documentation: `http://localhost:8001/docs`

