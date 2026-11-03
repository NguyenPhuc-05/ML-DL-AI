# 🌸 Đồ Án 1: Iris AI Explorer — Multi-Kernel SVM System

> **Học phần:** Học máy Nâng cao (Advanced Machine Learning)  
> **Sinh viên thực hiện:** Nguyễn Xuân Phúc — **MSSV:** 3110524025 — **Lớp:** 24CKDL  
> **Đơn vị:** Khoa Toán - Tin, Trường Đại học Sư phạm — Đại học Đà Nẵng  
> **Giảng viên hướng dẫn:** TS. Phan Trần Đức Minh  
> **Kho lưu trữ mã nguồn:** [GitHub Repository](https://github.com/NguyenPhuc-05/ML-DL-AI)

---

## 📌 1. Giới thiệu Tổng quan Đồ án

**Iris AI Explorer** là hệ thống phân loại ba loài hoa Iris (*Setosa, Versicolor, Virginica*) ứng dụng thuật toán **Support Vector Machine (SVM)** đa nhân, kết hợp cơ sở dữ liệu lưu trữ lịch sử **SQLite**, kiến trúc **FastAPI**, và giao diện trực quan hóa **Canvas API** hiện đại.

Dự án không dừng lại ở mô hình cơ bản mà cung cấp **5 tính năng học máy chuyên sâu**, phục vụ nghiên cứu học thuật và đối sánh thực nghiệm:
1. **🔍 Support Vectors Inspector:** Trực quan hóa và phân tích tọa độ, trọng số siêu phẳng $w, b$, số lượng vector hỗ trợ từng lớp.
2. **🎛️ Live SVM Playground:** Phòng thí nghiệm tinh chỉnh siêu tham số $C, \gamma, d$ theo thời gian thực với hệ thống chẩn đoán hiện tượng Quá khớp (Overfitting) / Dưới khớp (Underfitting).
3. **⚔️ Kernel Arena Benchmark:** Đấu trường đối sánh song song 4 mô hình về độ chính xác Cross-Validation, thời gian suy luận (latency) và bề mặt quyết định.
4. **🧠 Explainable AI (XAI):** Giải thích quyết định phân loại dựa trên phân tích độ nhạy nhiễu đặc trưng (Feature Sensitivity Attribution) đối chiếu với dải sinh học thực tế.
5. **📁 Batch CSV Prediction & Export:** Phân loại đồng loạt danh sách mẫu từ file CSV và trích xuất báo cáo Excel (.xlsx).

---

## 🧠 2. Cơ sở Toán học & Kiến trúc Mô hình (Phục vụ Vấn đáp)

### 2.1. Bài toán Tối ưu Siêu phẳng Biên Cực đại (Maximal Margin)
SVM tìm siêu phẳng phân cách $w \cdot x + b = 0$ sao cho khoảng cách lề (margin) $M = \frac{2}{\|w\|}$ đạt giá trị lớn nhất:
$$\min_{w, b, \xi} \frac{1}{2} \|w\|^2 + C \sum_{i=1}^{N} \xi_i$$
$$\text{thỏa điều kiện: } y_i (w \cdot \phi(x_i) + b) \ge 1 - \xi_i, \quad \xi_i \ge 0$$
- **Tham số phạt $C$:** Điều khiển sự đánh đổi giữa độ rộng lề và sai số huấn luyện.
  - $C$ lớn (Hard Margin): Phạt nặng sai số, margin hẹp $\to$ Dễ bị Overfitting khi dữ liệu có nhiễu.
  - $C$ nhỏ (Soft Margin): Chấp nhận nhiều điểm vi phạm, margin rộng $\to$ Dễ bị Underfitting nếu đặt quá thấp.

### 2.2. Ý nghĩa của Vector Hỗ trợ (Support Vectors)
Theo định lý Karush-Kuhn-Tucker (KKT), véc-tơ pháp tuyến $w$ chỉ phụ thuộc vào một tập hợp con nhỏ các điểm dữ liệu nằm trên hoặc vi phạm đường lề:
$$w = \sum_{i \in \text{SV}} \alpha_i y_i \phi(x_i), \quad 0 \le \alpha_i \le C$$
Các điểm dữ liệu khác có nhân tử Lagrange $\alpha_i = 0$ và hoàn toàn không ảnh hưởng đến vị trí của siêu phẳng phân cách.

### 2.3. Bốn phiên bản Hàm nhân (Kernel Trick)
Khi dữ liệu không phân tách tuyến tính trong không gian ban đầu $\mathbb{R}^d$, ánh xạ $\phi(x)$ chuyển dữ liệu sang không gian nhiều chiều hơn. Bằng **Kernel Trick**, ta tính trực tiếp tích vô hướng $K(x, x') = \langle\phi(x), \phi(x')\rangle$ mà không cần tính tường minh $\phi(x)$:

| Phiên bản | Hàm nhân (Kernel) | Biểu thức Toán học | Đặc tính & Ứng dụng |
|:---|:---|:---|:---|
| **v1** | **Linear** | $K(x, x') = x^T x'$ | Phân tách phẳng, tính toán nhanh nhất, giải thích trọng số $w$ dễ dàng. Phù hợp phân biệt Setosa. |
| **v2** | **RBF (Gaussian)** | $K(x, x') = \exp(-\gamma \|x - x'\|^2)$ | Ánh xạ lên không gian vô hạn chiều. Xử lý tối ưu vùng phi tuyến và chồng lấn giữa Versicolor và Virginica. |
| **v3** | **Polynomial** | $K(x, x') = (\gamma x^T x' + r)^d$ | Đường biên uốn lượn đa thức bậc $d$, bắt được tương tác chéo giữa các đặc trưng kích thước. |
| **v4** | **Sigmoid** | $K(x, x') = \tanh(\gamma x^T x' + r)$ | Mô phỏng mạng nơ-ron Perceptron hai lớp; có giá trị so sánh học thuật về điều kiện Mercer. |

---

## 🏛️ 3. Kiến Trúc Hệ Thống (3 Mô Đun Ngang Hàng)

Hệ thống được thiết kế theo mô hình phân tách chuẩn mực gồm **3 thành phần độc lập ngang hàng nhau**:

```text
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│     1. WEB NGƯỜI DÙNG     │     │      2. HỆ THỐNG API      │     │    3. CƠ SỞ DỮ LIỆU       │
│        (Frontend)         │◄───►│    (Backend - FastAPI)    │◄───►│   (Database Module)       │
│ HTML5 / CSS3 / Canvas API │     │ Multi-Kernel SVM & AI/ML  │     │  SQLAlchemy / MySQL / DB  │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

1. **Web người dùng (Frontend):** Giao diện tương tác người dùng, đồ thị Canvas trực quan hóa 2D/3D, biểu đồ Radar đa chiều, phòng thí nghiệm SVM Playground và giải thích mô hình XAI.
2. **Hệ thống API (Backend - FastAPI):** Đóng gói 4 mô hình SVM (Linear, RBF, Poly, Sigmoid), tính toán phân lớp, phân tích Support Vectors, và cung cấp chuẩn RESTful API.
3. **Cơ sở dữ liệu (Database Module):** Mô đun CSDL quản trị người dùng, băm mật khẩu bảo mật (Bcrypt), xác thực JWT và lưu vết lịch sử dự đoán toàn hệ thống.

---

## 🛠️ 4. Cấu trúc Dự án

```text
Du_an_1_Iris_SVM/
├── database/                    # MÔ ĐUN 1: CƠ SỞ DỮ LIỆU (Độc lập ngang hàng)
│   ├── db.py                    # Khởi tạo Engine, Session & cơ chế Auto-Fallback SQLite
│   └── models.py                # Khai báo User và PredictionRecord Models (SQLAlchemy)
├── backend/                     # MÔ ĐUN 2: HỆ THỐNG API (RESTful FastAPI & ML Engine)
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # Endpoints API, bảo mật OAuth2/JWT & 5 module học máy
│   ├── artifacts/
│   │   ├── iris_svm_linear.joblib
│   │   ├── iris_svm_rbf.joblib
│   │   ├── iris_svm_poly.joblib
│   │   ├── iris_svm_sigmoid.joblib
│   │   └── metadata.json        # Thông số CV accuracy, nhãn loài, phiên bản
│   ├── scripts/
│   │   └── train.py             # Huấn luyện & chuẩn hóa StandardScaler 4 mô hình SVM
│   ├── tests/
│   │   └── test_api.py          # Unit tests kiểm thử tự động toàn diện
│   └── requirements.txt
├── frontend/                    # MÔ ĐUN 3: WEB NGƯỜI DÙNG (Client Interface)
│   ├── index.html               # Cấu trúc HTML5 semantic, điều hướng trực quan
│   ├── style.css                # Thiết kế giao diện Glassmorphism responsive
│   ├── script.js                # Canvas radar/scatter plot, XAI, batch & event handlers
│   ├── assets/
│   └── images/                  # Ảnh sinh học mẫu Setosa, Versicolor, Virginica
├── notebooks/                   # NGHIÊN CỨU & THỰC NGHIỆM HỌC MÁY NÂNG CAO
│   └── 01_eda_and_svm_experiments.ipynb # EDA, khảo sát Margin, Decision Boundary, Kernel Trick
└── README.md
```

---

## 🚀 5. Hướng dẫn Cài đặt & Vận hành

### 4.1. Khởi động Backend API
```bash
cd backend
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Swagger UI kiểm thử trực quan: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 4.2. Khởi chạy Giao diện Frontend
Mở file `frontend/index.html` trực tiếp trên trình duyệt, hoặc dùng Live Server / Python HTTP Server:
```bash
cd frontend
python -m http.server 3000
```
Truy cập: `http://localhost:3000`

### 4.3. Kiểm thử Tự động (Unit Testing)
Dự án tích hợp bộ kiểm thử 14 test cases kiểm tra tính toàn vẹn của API, xác thực Pydantic, tính toán ma trận ma trận nhầm lẫn và định dạng xuất file:
```bash
cd backend
python -m pytest tests -v
```

### 4.4. Huấn luyện lại 4 Mô hình
```bash
cd backend
python scripts/train.py
```
