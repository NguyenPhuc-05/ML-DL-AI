# Nhiệm vụ tạo tài liệu README đầy đủ cho repository và Dự án 2

## 1. Mục tiêu

Hãy tạo hệ thống tài liệu README rõ ràng cho repository:

```text
NguyenPhuc-05/ML-DL-AI-DS
```

Repository là monorepo chứa các dự án Machine Learning, AI và Web Server. Cần có README chung ở thư mục gốc và README riêng cho từng dự án, đặc biệt là Dự án 2.

## 2. Cấu trúc tài liệu mong muốn

Tạo hoặc cập nhật các file:

```text
README.md
Du_an_1_Iris_SVM/README.md
Du_an_2_Breast_Cancer/README.md
```

Nếu một file đã tồn tại, hãy cập nhật thay vì tạo bản trùng lặp.

## 3. README chung ở thư mục gốc

File:

```text
README.md
```

README gốc phải đóng vai trò là trang giới thiệu và mục lục của toàn repository, không cần chứa toàn bộ chi tiết của từng dự án.

Bắt buộc có các phần:

### 3.1. Giới thiệu repository

- Tên repository.
- Mục đích của repository.
- Mô tả ngắn bằng tiếng Việt.
- Đối tượng sử dụng: học tập, thử nghiệm Machine Learning/AI và triển khai web.

### 3.2. Danh sách dự án

Mô tả ngắn và link tới:

- Dự án 1 — Iris SVM.
- Dự án 2 — Breast Cancer SVM.

Dùng link tương đối chính xác:

```markdown
[Du_an_1_Iris_SVM](./Du_an_1_Iris_SVM)
[README Dự án 1](./Du_an_1_Iris_SVM/README.md)
[Du_an_2_Breast_Cancer](./Du_an_2_Breast_Cancer)
[README Dự án 2](./Du_an_2_Breast_Cancer/README.md)
```

### 3.3. Cấu trúc repository

Hiển thị cây thư mục tiêu biểu, bao gồm:

- `Du_an_1_Iris_SVM/`.
- `Du_an_2_Breast_Cancer/`.
- `render.yaml`.
- `.gitignore`.

### 3.4. Công nghệ sử dụng

Mô tả ngắn:

- Python.
- FastAPI.
- scikit-learn.
- joblib.
- HTML/CSS/JavaScript.
- Render.
- SVM.

Chỉ đưa vào những công nghệ thực sự có trong code.

### 3.5. Cách sử dụng tài liệu

Giải thích:

- Đọc README gốc để hiểu toàn repository.
- Đọc README riêng để chạy từng dự án.
- Mỗi dự án có backend, frontend và hướng dẫn deploy riêng.

### 3.6. Cảnh báo chung

Nêu rõ các dự án phục vụ học tập/demo. Các kết quả ML không mặc nhiên là sản phẩm production hoặc tư vấn chuyên môn.

### 3.7. Trạng thái triển khai

Nếu đã xác minh được URL Render thật, đưa URL vào README. Nếu chưa xác minh được, không bịa URL và ghi rõ trạng thái cần kiểm tra.

## 4. README Dự án 1

File:

```text
Du_an_1_Iris_SVM/README.md
```

README phải mô tả đúng code thực tế trong Dự án 1.

Bắt buộc có:

### 4.1. Giới thiệu

- Ứng dụng phân loại hoa Iris.
- Mô hình SVM.
- Backend FastAPI.
- Frontend HTML/CSS/JavaScript.

### 4.2. Kiến trúc thư mục

Mô tả:

```text
backend/
  app.py
  train.py
  requirements.txt
  svm_model.pkl
frontend/
  index.html
  script.js
  style.css
  assets/
```

### 4.3. Cách chạy backend local

Dùng lệnh thực tế phù hợp với code:

```bash
cd Du_an_1_Iris_SVM/backend
python -m venv .venv
# kích hoạt môi trường theo hệ điều hành
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 4.4. Huấn luyện lại model

Mô tả:

```bash
cd Du_an_1_Iris_SVM/backend
python train.py
```

Nêu rõ file model được tạo ra.

### 4.5. API

Mô tả:

- `GET /`.
- `GET /health`.
- `POST /predict`.

Đưa ví dụ JSON request đúng với bốn field:

```json
{
  "sepal_length": 5.1,
  "sepal_width": 3.5,
  "petal_length": 1.4,
  "petal_width": 0.2
}
```

Đưa ví dụ response thực tế.

### 4.6. Chạy frontend

Mô tả cách chạy bằng static server nếu cần. Không hướng dẫn sai rằng mọi môi trường `file://` đều hoạt động nếu có vấn đề CORS.

### 4.7. Deploy Render

Mô tả root directory, build command, start command và health check theo `render.yaml`. Chỉ đưa URL production nếu đã xác minh.

### 4.8. Giới hạn

- Model là demo trên Iris dataset.
- Không mô tả đây là hệ thống production nếu chưa có bằng chứng.
- Ghi rõ dependency hoặc API URL nếu có giới hạn.

## 5. README Dự án 2

File:

```text
Du_an_2_Breast_Cancer/README.md
```

Đây là README quan trọng nhất. Phải đầy đủ, chính xác và bám sát code.

### 5.1. Tên và mô tả

Giới thiệu đây là ứng dụng học máy phân loại dữ liệu Breast Cancer Wisconsin bằng SVM RBF, cung cấp FastAPI backend và frontend web.

Không gọi đây là công cụ chẩn đoán y khoa.

### 5.2. Medical disclaimer bắt buộc

Đặt ở vị trí nổi bật:

> Đây là dự án giáo dục/minh họa Machine Learning. Kết quả chỉ là dự đoán của mô hình và không phải chẩn đoán y khoa. Không sử dụng kết quả để tự chẩn đoán, điều trị hoặc ra quyết định y tế. Hãy tham khảo bác sĩ hoặc chuyên gia y tế.

### 5.3. Kiến trúc dự án

Mô tả:

```text
backend/
  app/
    main.py              FastAPI application
  artifacts/
    breast_cancer_svm.joblib
    metadata.json
  scripts/
    train.py             training and artifact generation
  tests/
    test_api.py
  requirements.txt
frontend/
  index.html
  script.js
  style.css
```

### 5.4. Dataset và pipeline

Mô tả chính xác theo `train.py`:

- Dataset `sklearn.datasets.load_breast_cancer`.
- 30 feature numeric.
- Train/test split 80/20.
- Stratified split.
- `random_state=42`.
- Pipeline `StandardScaler` + `SVC(kernel="rbf", probability=True, class_weight="balanced")`.
- `GridSearchCV` với `StratifiedKFold` 5 folds.
- Scoring `recall_macro`.
- Mapping `0 = malignant`, `1 = benign`.

Không bịa metric nếu metric chưa được lưu hoặc chưa có bằng chứng.

### 5.5. Danh sách 30 feature

Liệt kê đầy đủ 30 key theo `metadata.json`, giữ nguyên khoảng trắng và thứ tự:

```text
mean radius
mean texture
mean perimeter
mean area
mean smoothness
mean compactness
mean concavity
mean concave points
mean symmetry
mean fractal dimension
radius error
texture error
perimeter error
area error
smoothness error
compactness error
concavity error
concave points error
symmetry error
fractal dimension error
worst radius
worst texture
worst perimeter
worst area
worst smoothness
worst compactness
worst concavity
worst concave points
worst symmetry
worst fractal dimension
```

### 5.6. Model artifacts và metadata

Mô tả:

- File model.
- File metadata.
- Model version.
- Best parameters nếu có trong metadata.
- scikit-learn version ghi trong metadata.
- Cảnh báo tương thích artifact nếu dependency deploy khác version.

### 5.7. Cài đặt backend local

```bash
cd Du_an_2_Breast_Cancer/backend
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Các URL local:

```text
http://localhost:8000/
http://localhost:8000/health
http://localhost:8000/metadata
http://localhost:8000/docs
```

### 5.8. Chạy test

```bash
cd Du_an_2_Breast_Cancer/backend
pytest -q
```

Ghi rõ test nào tồn tại và không bịa kết quả pass nếu chưa chạy.

### 5.9. Huấn luyện lại model

```bash
cd Du_an_2_Breast_Cancer/backend
python scripts/train.py
```

Mô tả:

- Artifact được tạo ở đâu.
- Metadata được tạo ở đâu.
- Cần kiểm tra lại version scikit-learn sau khi train.
- Không commit artifact mới nếu chưa kiểm tra API.

### 5.10. API endpoints

Mô tả chính xác:

#### `GET /`

Trả thông tin service và cảnh báo giáo dục.

#### `GET /health`

Trả trạng thái service, model loaded và model version.

#### `GET /metadata`

Trả metadata, feature names, class mapping và model information.

#### `POST /predict`

Request:

```json
{
  "features": {
    "mean radius": 13.54,
    "mean texture": 14.36,
    "mean perimeter": 87.46,
    "mean area": 566.3,
    "mean smoothness": 0.09779,
    "mean compactness": 0.08129,
    "mean concavity": 0.06664,
    "mean concave points": 0.04781,
    "mean symmetry": 0.1885,
    "mean fractal dimension": 0.05766,
    "radius error": 0.2699,
    "texture error": 0.7886,
    "perimeter error": 2.058,
    "area error": 23.56,
    "smoothness error": 0.008462,
    "compactness error": 0.0146,
    "concavity error": 0.02387,
    "concave points error": 0.01315,
    "symmetry error": 0.0198,
    "fractal dimension error": 0.0023,
    "worst radius": 15.11,
    "worst texture": 19.26,
    "worst perimeter": 99.7,
    "worst area": 711.2,
    "worst smoothness": 0.144,
    "worst compactness": 0.1773,
    "worst concavity": 0.239,
    "worst concave points": 0.1288,
    "worst symmetry": 0.2977,
    "worst fractal dimension": 0.07259
  }
}
```

Mô tả response và các lỗi HTTP 422/500. Không khẳng định response là chẩn đoán.

### 5.11. Chạy frontend

Mô tả cách chạy static server, ví dụ:

```bash
cd Du_an_2_Breast_Cancer/frontend
python -m http.server 5500
```

Sau đó mở:

```text
http://localhost:5500
```

Nêu rõ frontend local cần trỏ tới backend local và backend phải cho phép CORS tương ứng.

### 5.12. Render deployment

Mô tả theo `render.yaml`:

- Backend root directory.
- Backend build command.
- Backend start command.
- Health check path.
- Frontend static root directory.
- Static publish path.
- Free plan/cold start nếu có.
- CORS cần cho phép domain frontend thật.

Chỉ ghi URL Render nếu đã kiểm tra HTTP thực tế. Nếu chưa, ghi:

```text
Production URL cần được xác minh trong Render Dashboard.
```

### 5.13. Kiểm tra production

Cung cấp các lệnh mẫu:

```bash
curl -i https://YOUR_API_URL/health
curl -i https://YOUR_API_URL/metadata
```

Không ghi URL giả là URL chính thức.

### 5.14. Giới hạn và rủi ro

Bắt buộc nêu:

- Dataset là dữ liệu học máy chuẩn dùng cho giáo dục.
- Kết quả phụ thuộc dữ liệu đầu vào và model.
- Probability không phải độ chắc chắn lâm sàng.
- Không có thông tin bệnh nhân thật trong ứng dụng.
- Không dùng thay thế bác sĩ, xét nghiệm hoặc quy trình y tế.
- Model có thể không tổng quát cho dữ liệu ngoài dataset.
- Render Free có thể cold start hoặc giới hạn tài nguyên.

## 6. Nguyên tắc viết README

- Viết bằng tiếng Việt, giữ tên API/code bằng tiếng Anh.
- Dùng heading rõ ràng.
- Dùng code block cho command, JSON và cây thư mục.
- Dùng link tương đối trong repository.
- Không bịa URL production, metric hoặc trạng thái deploy.
- Không bịa tính năng chưa tồn tại.
- Mọi câu lệnh phải khớp với cấu trúc thực tế.
- Mọi endpoint phải khớp với source code.
- Không đưa secret vào README.
- README phải dễ đọc trên GitHub mobile và desktop.

## 7. Kiểm tra README sau khi tạo

- [ ] README gốc tồn tại và link đúng tới hai dự án.
- [ ] README Dự án 1 tồn tại và khớp code.
- [ ] README Dự án 2 tồn tại và khớp code.
- [ ] Không có link tương đối bị hỏng.
- [ ] Không có command sai thư mục.
- [ ] Không có endpoint sai.
- [ ] 30 feature được liệt kê đủ và đúng thứ tự.
- [ ] Medical disclaimer xuất hiện rõ trong README Dự án 2.
- [ ] Không có tuyên bố chẩn đoán y khoa.
- [ ] Không bịa URL Render hoặc metric.
- [ ] README có hướng dẫn test.
- [ ] README có hướng dẫn chạy local.
- [ ] README có thông tin deploy Render.

## 8. Báo cáo sau khi hoàn thành

Hãy báo cáo:

1. Những README nào đã tạo hoặc cập nhật.
2. Những phần nào đã được thêm vào từng README.
3. Những thông tin nào chưa thể xác minh.
4. URL nào đã được kiểm tra thực tế.
5. Có link hoặc command nào cần người dùng tự cập nhật không.
6. Có thay đổi code hay chỉ thay đổi tài liệu.
