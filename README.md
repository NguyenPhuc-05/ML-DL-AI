# Machine Learning & Deep Learning Projects 🚀

Repository này chứa mã nguồn của các đồ án môn học liên quan đến Trí tuệ nhân tạo (AI), Học máy (Machine Learning) và Khoa học dữ liệu (Data Science). Toàn bộ hệ thống được thiết kế theo kiến trúc **Monorepo** với các dịch vụ Backend (FastAPI) và Frontend (Vanilla JS) tách biệt rõ ràng, dễ dàng bảo trì và triển khai.

---

## 🌻 Dự án 1: Phân loại Hoa Iris (Iris Dataset)
Dự án đầu tiên làm quen với thuật toán Support Vector Machine (SVM) cơ bản.
- **Nhiệm vụ:** Phân loại 3 giống hoa Iris (Setosa, Versicolor, Virginica) dựa trên 4 đặc trưng đài hoa và cánh hoa.
- **Mô hình:** `SVC(kernel='rbf')`.
- **Demo trực tuyến:**
  - 🔗 Frontend: [https://iris-svm-frontend-6s3t.onrender.com](https://iris-svm-frontend-6s3t.onrender.com)
  - 🔗 Backend API: [https://iris-svm-api-yfd4.onrender.com/docs](https://iris-svm-api-yfd4.onrender.com/docs)

---

## 🔬 Dự án 2: Chẩn đoán Ung thư Vú (Breast Cancer SVM)
Dự án chuyên sâu về y tế, sử dụng dữ liệu thực tế với 30 đặc trưng tế bào phức tạp.
- **Nhiệm vụ:** Chuẩn đoán khối u Lành tính (Benign) hay Ác tính (Malignant) dựa trên bộ dữ liệu `breast_cancer` của thư viện Scikit-learn.
- **Điểm nổi bật của mô hình:** 
  - Chia tập 80/20 (`stratify=y`).
  - Dùng `Pipeline` (StandardScaler + SVC) để chống rò rỉ dữ liệu.
  - Tối ưu hóa siêu tham số bằng `GridSearchCV` (5-fold CV).
  - Sử dụng thang đo `recall_macro` nhằm hạn chế tối đa việc dự đoán sót các ca Ác tính (Sai lầm chết người trong y tế). Sensitivity đạt ~97.6%.
- **Điểm nổi bật của UI:** 
  - Giao diện Y khoa chuyên nghiệp, chia 3 Tabs rõ ràng (Mean, Error, Worst).
  - Trực quan hóa xác suất (%) chẩn đoán và đưa ra lời khuyên y tế tự động.
- **Demo trực tuyến:**
  - 🔗 Frontend: [https://breast-cancer-svm-frontend.onrender.com](https://breast-cancer-svm-frontend.onrender.com)
  - 🔗 Backend API: [https://breast-cancer-svm-api.onrender.com/docs](https://breast-cancer-svm-api.onrender.com/docs)

---

## 🛠️ Kiến trúc Dự án (Monorepo)
Dự án áp dụng triết lý "Tách trách nhiệm" (Separation of Concerns). Mô hình được huấn luyện offline, sau đó Artifacts (`.joblib`, `metadata.json`) được nạp vào Backend API. Frontend giao tiếp với Backend qua RESTful API.

```text
ML-DL-AI-DS/
├── render.yaml               # File cấu hình deploy chung (4 services)
├── Du_an_1_Iris_SVM/         # Source code Dự án 1
│   ├── backend/              # API phục vụ dự đoán Iris
│   └── frontend/             # Giao diện tĩnh Iris
└── Du_an_2_Breast_Cancer/    # Source code Dự án 2
    ├── backend/              # API FastAPI (CORS, Pydantic validation)
    │   ├── scripts/          # Nơi chứa code Training SVM
    │   ├── artifacts/        # Nơi chứa mô hình đã train (.joblib)
    │   ├── app/              # Nơi chứa code API (main.py)
    │   └── tests/            # Code kiểm thử tự động (Pytest)
    └── frontend/             # Giao diện tương tác y tế
```

## 🚀 Triển khai
Hệ thống sử dụng [Render](https://render.com) để CI/CD tự động thông qua file `render.yaml`. Bất cứ khi nào có thay đổi trên nhánh `main`, toàn bộ 4 dịch vụ (2 API Python + 2 Web Tĩnh) sẽ tự động được cập nhật.
