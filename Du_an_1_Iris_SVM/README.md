# Đồ Án 1 — Iris AI Explorer: SVM Đa Nhân

> **Học phần:** Học máy Nâng cao  
> **Sinh viên:** Nguyễn Xuân Phúc — MSSV 3110524025 — Lớp 24CKDL  
> **Giảng viên:** TS. Phan Trần Đức Minh

---

## Hệ thống làm gì

Phân loại ba loài hoa Iris (*Setosa, Versicolor, Virginica*) dựa trên 4 đặc trưng kích thước đài hoa và cánh hoa, dùng SVM với 4 loại nhân. Người dùng đăng nhập qua Identity Service dùng chung (SSO), sau đó có thể:

1. Phân loại mẫu đơn (chọn kernel, nhập kích thước).
2. Khám phá Support Vectors — xem tọa độ, trọng số $w$, $b$ và số lượng vector hỗ trợ từng lớp.
3. Thử nghiệm tham số $C$, $\gamma$, degree trực tiếp — hệ thống chẩn đoán Overfitting/Underfitting ngay lập tức.
4. So sánh 4 kernel song song (độ chính xác CV, latency, decision boundary).
5. Giải thích kết quả bằng XAI — phân tích độ nhạy nhiễu từng đặc trưng.
6. Phân loại hàng loạt từ CSV, xuất báo cáo Excel.

---

## Cơ sở toán học

**Bài toán tối ưu SVM (Soft Margin):**

$$\min_{w, b, \xi} \frac{1}{2}\|w\|^2 + C\sum_{i=1}^{N}\xi_i \quad \text{sao cho} \quad y_i(w \cdot \phi(x_i) + b) \ge 1 - \xi_i,\ \xi_i \ge 0$$

Tham số $C$ điều chỉnh đánh đổi giữa độ rộng lề và sai số:  
- $C$ lớn → phạt nặng sai số, lề hẹp → dễ Overfitting.  
- $C$ nhỏ → chấp nhận nhiều điểm vi phạm, lề rộng → dễ Underfitting.

**Bốn hàm nhân:**

| Kernel | Biểu thức | Ghi chú |
|---|---|---|
| Linear | $K(x,x') = x^T x'$ | Nhanh nhất, dễ giải thích |
| RBF | $K(x,x') = \exp(-\gamma\|x-x'\|^2)$ | Khuyên dùng mặc định |
| Polynomial | $K(x,x') = (\gamma x^T x' + r)^d$ | Bắt tương tác bậc cao |
| Sigmoid | $K(x,x') = \tanh(\gamma x^T x' + r)$ | Tương tự Perceptron 2 lớp |

---

## Cấu trúc thư mục

```
Du_an_1_Iris_SVM/
├── backend/
│   ├── app/
│   │   └── main.py          # Toàn bộ endpoint API
│   ├── artifacts/
│   │   ├── iris_svm_linear.joblib
│   │   ├── iris_svm_rbf.joblib
│   │   ├── iris_svm_poly.joblib
│   │   ├── iris_svm_sigmoid.joblib
│   │   └── metadata.json
│   ├── scripts/
│   │   └── train.py         # Huấn luyện 4 mô hình, ghi metadata
│   ├── tests/
│   │   └── test_api.py      # 17 test cases
│   ├── .env.example
│   └── requirements.txt
├── database/
│   ├── db.py                # MySQL + SQLite fallback
│   ├── models.py            # PredictionRecord
│   └── idp.py               # IdP router nhúng (fallback offline)
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── images/
└── notebooks/
    └── 01_eda_and_svm_experiments.ipynb
```

---

## Chạy cục bộ

> Khởi động Identity Service trước (xem README gốc tại thư mục `iris-svm/`).

```bash
cd Du_an_1_Iris_SVM
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # Linux/macOS

pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # điền JWT_SECRET (cùng giá trị với identity-service)

cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
python -m http.server 3000
```

---

## Kiểm thử

```bash
cd backend
python -m pytest tests -v
```

17 test cases kiểm tra: predict, decision boundary, kernel arena, XAI, batch CSV, lịch sử dự đoán, phân quyền SSO.

---

## Huấn luyện lại

```bash
cd backend
python scripts/train.py
```

Script huấn luyện 4 kernel, đánh giá 5-fold CV và lưu artifact vào `backend/artifacts/`.

---

## API Endpoints chính

| Method | Endpoint | Mô tả | Xác thực |
|---|---|---|---|
| GET | `/health` | Trạng thái dịch vụ | Không |
| GET | `/metadata` | Thông tin 4 mô hình | Không |
| POST | `/predict` | Phân loại mẫu đơn | JWT |
| POST | `/explain` | XAI — giải thích kết quả | JWT |
| POST | `/predict-batch` | Phân loại hàng loạt | JWT |
| GET | `/predictions` | Lịch sử dự đoán của user | JWT |
| GET | `/predictions/export` | Xuất Excel | JWT |
| DELETE | `/predictions` | Xóa lịch sử user | JWT |
| GET | `/decision-boundary` | Grid decision boundary 2D | Không |
| GET | `/support-vectors` | Inspector Support Vectors | Không |
| GET | `/svm-playground` | Playground tham số thời gian thực | Không |
| GET | `/kernel-arena` | So sánh 4 kernel | Không |
| GET | `/sample-csv` | Tải file CSV mẫu | Không |