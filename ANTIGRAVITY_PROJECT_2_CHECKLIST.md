# Checklist kiểm tra và cải thiện toàn bộ Dự án 2 — Breast Cancer SVM

Repository: `NguyenPhuc-05/ML-DL-AI-DS`

Phạm vi: `Du_an_2_Breast_Cancer`

> Mục tiêu: kiểm tra toàn bộ backend, model, frontend, test, kết nối API và deploy Render. Không đánh dấu hoàn thành chỉ vì code nhìn có vẻ đúng; cần có bằng chứng từ test, build hoặc request thực tế.

## 1. Kiểm tra cấu trúc repository

- [ ] Xác nhận thư mục `Du_an_2_Breast_Cancer/` tồn tại.
- [ ] Xác nhận `backend/app/main.py` tồn tại.
- [ ] Xác nhận `backend/artifacts/breast_cancer_svm.joblib` tồn tại.
- [ ] Xác nhận `backend/artifacts/metadata.json` tồn tại.
- [ ] Xác nhận `backend/requirements.txt` tồn tại.
- [ ] Xác nhận `backend/scripts/train.py` tồn tại.
- [ ] Xác nhận `backend/tests/test_api.py` tồn tại.
- [ ] Xác nhận `frontend/index.html`, `script.js`, `style.css` tồn tại.
- [ ] Kiểm tra không có import, asset hoặc đường dẫn bị sai.
- [ ] Kiểm tra không có secret, API key hoặc dữ liệu cá nhân bị commit.

## 2. Kiểm tra model và metadata

- [ ] Load thử file `breast_cancer_svm.joblib`.
- [ ] Xác nhận model có `StandardScaler` và `SVC`.
- [ ] Xác nhận model hỗ trợ `predict` và `predict_proba`.
- [ ] Xác nhận metadata có đúng 30 feature.
- [ ] Xác nhận thứ tự feature trong API khớp với metadata.
- [ ] Xác nhận mapping `0 = malignant`, `1 = benign`.
- [ ] Xác nhận `model.named_steps["svc"].classes_` phù hợp với mapping.
- [ ] Kiểm tra `sklearn_version` trong metadata có tương thích với môi trường deploy.
- [ ] Ghi nhận model version, best parameters và metric huấn luyện.
- [ ] Không thay thế artifact nếu chưa train lại và kiểm tra toàn bộ.

## 3. Kiểm tra môi trường backend local

Từ thư mục `Du_an_2_Breast_Cancer/backend/`:

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- [ ] Cài dependency thành công.
- [ ] Backend khởi động không lỗi import/path/model.
- [ ] `GET /` trả HTTP 200.
- [ ] `GET /health` trả HTTP 200.
- [ ] `GET /metadata` trả đủ 30 feature.
- [ ] `/docs` mở được.
- [ ] Start command của Render chạy được từ đúng `rootDir`.

## 4. Kiểm tra API và validation

- [ ] Request đủ 30 feature trả HTTP 200.
- [ ] Response có `predicted_class`.
- [ ] Response có `predicted_label`.
- [ ] Response có hai probability.
- [ ] Response có `model_version` và `warning`.
- [ ] `probability_malignant` nằm trong khoảng 0–1.
- [ ] `probability_benign` nằm trong khoảng 0–1.
- [ ] Tổng hai probability gần bằng 1.
- [ ] Request thiếu feature trả HTTP 422.
- [ ] Request dư feature trả HTTP 422.
- [ ] Request có `null`, chuỗi, `NaN` hoặc `Infinity` bị từ chối.
- [ ] Dictionary feature rỗng bị từ chối.
- [ ] Lỗi missing/extra feature được hiển thị dễ hiểu, không thành `[object Object]`.
- [ ] Không để stack trace nhạy cảm lộ ra production.

## 5. Bổ sung và chạy test

Chạy từ thư mục backend:

```bash
pytest -q
```

- [ ] Test health pass.
- [ ] Test metadata pass.
- [ ] Test happy path pass.
- [ ] Test thiếu feature pass.
- [ ] Bổ sung test feature dư.
- [ ] Bổ sung test giá trị không hữu hạn.
- [ ] Bổ sung test response schema.
- [ ] Bổ sung test probability hợp lệ.
- [ ] Bổ sung test class mapping.
- [ ] Tất cả test pass trước khi kết luận hoàn thành.

## 6. Kiểm tra dependency và reproducibility

- [ ] Kiểm tra phiên bản thực tế của Python, NumPy, scikit-learn, joblib, FastAPI và Pydantic.
- [ ] Khóa phiên bản dependency quan trọng nếu phù hợp.
- [ ] Xác nhận version deploy có thể load artifact được tạo từ version huấn luyện.
- [ ] Nếu cần re-train, cập nhật metadata và test lại.
- [ ] Ghi lại dataset, cách train, random seed và metric.

## 7. Kiểm tra CORS và bảo mật backend

- [ ] Xác định domain frontend Render thực tế.
- [ ] Không dùng `allow_origins=["*"]` trong production nếu không cần.
- [ ] Chỉ bật `allow_credentials` khi thật sự sử dụng credentials.
- [ ] Cho phép localhost phục vụ development nếu cần.
- [ ] Không nhận path model từ request.
- [ ] Không commit secret hoặc dữ liệu bệnh nhân.
- [ ] Không dùng nội dung client gửi lên để tạo HTML không an toàn.

## 8. Kiểm tra frontend

- [ ] Trang tải không lỗi HTML/CSS/JavaScript.
- [ ] 30 input được render đầy đủ.
- [ ] Mỗi input có `id` duy nhất.
- [ ] Mỗi label liên kết đúng với input.
- [ ] Tên 30 field khớp metadata/backend.
- [ ] Ba tab Mean, Error, Worst hoạt động đúng.
- [ ] Nút Tiếp theo/Quay lại hoạt động đúng.
- [ ] Preset Benign hoạt động.
- [ ] Preset Malignant hoạt động.
- [ ] Nút Xóa form hoạt động.
- [ ] Kết quả ban đầu được ẩn, không có kết quả giả.
- [ ] Không dùng `alert()`.
- [ ] Không có lỗi JavaScript trong Console.

## 9. Validation và trạng thái frontend

- [ ] Không gửi khi thiếu input.
- [ ] Không gửi khi input không phải số hữu hạn.
- [ ] Input lỗi được đánh dấu rõ.
- [ ] Hiển thị lỗi dưới input hoặc trong vùng lỗi phù hợp.
- [ ] Tự động chuyển tới tab có lỗi nếu cần.
- [ ] Focus vào input lỗi đầu tiên nếu phù hợp.
- [ ] Nút phân tích bị disable khi đang request.
- [ ] Hiển thị loader và text `Đang phân tích...`.
- [ ] Luôn khôi phục nút trong `finally`.
- [ ] Hiển thị thông báo riêng cho lỗi mạng, 422, 500 và response sai.
- [ ] Không hiển thị object lỗi thành `[object Object]`.
- [ ] Có thể thử lại sau khi lỗi.

## 10. Kết nối frontend với backend

- [ ] Xác nhận URL API production thật.
- [ ] Local dùng `http://localhost:8000` hoặc cấu hình tương đương.
- [ ] Production dùng đúng URL Render.
- [ ] Frontend gửi đúng `Content-Type`.
- [ ] Frontend gửi object `{ features: {...} }`.
- [ ] Frontend đọc đúng các trường response.
- [ ] Không có lỗi CORS trên trình duyệt.
- [ ] Health badge chỉ hiển thị sẵn sàng sau khi `/health` trả thành công.
- [ ] Có trạng thái đang kiểm tra và tạm thời không khả dụng.

## 11. UX, accessibility và responsive

- [ ] Medical disclaimer hiển thị rõ ràng.
- [ ] Không dùng ngôn ngữ khẳng định đây là chẩn đoán y khoa.
- [ ] Dùng các cụm như `dự đoán tham khảo` hoặc `kết quả mô hình`.
- [ ] Kết quả có `aria-live="polite"`.
- [ ] Lỗi có `role="alert"`.
- [ ] Form có `aria-busy` khi đang request.
- [ ] Progress bar có role và giá trị accessible.
- [ ] Tabs có `role="tablist"`, `role="tab"`, `role="tabpanel"` đúng.
- [ ] Keyboard navigation hoạt động.
- [ ] Focus state rõ ràng.
- [ ] Contrast đủ tốt.
- [ ] Không dùng màu sắc là tín hiệu duy nhất.
- [ ] Có `prefers-reduced-motion`.
- [ ] Kiểm tra tại 360x800, 390x844, 768x1024, 1366x768 và 1920x1080.
- [ ] Không có scroll ngang không cần thiết.
- [ ] Button đủ lớn trên mobile.

## 12. Định hướng giao diện

- [ ] Giữ nền trắng, xám nhạt hoặc trắng xám để dễ đọc.
- [ ] Không dùng nền quá sặc sỡ.
- [ ] Giao diện giữ cảm giác y tế, sạch, chuyên nghiệp và đáng tin cậy.
- [ ] Có thể dùng primary `#4A7C59` cho hướng tự nhiên/AI.
- [ ] Có thể dùng accent `#68B0AB` hoặc `#FFB5A7`.
- [ ] CTA có gradient nhẹ, không quá chói.
- [ ] Chỉ dùng một hướng gradient chính.
- [ ] Màu benign/malignant đi kèm text rõ ràng.
- [ ] Không để màu đỏ tạo cảm giác chẩn đoán chắc chắn.
- [ ] Có hỗ trợ reduced motion.

## 13. Kiểm tra Render

- [ ] Service backend tồn tại trên Render.
- [ ] Service frontend tồn tại trên Render.
- [ ] `rootDir` backend đúng.
- [ ] `rootDir` frontend đúng.
- [ ] Build command backend thành công.
- [ ] Start command backend thành công.
- [ ] Static publish path frontend đúng.
- [ ] Backend bind `0.0.0.0` và `$PORT`.
- [ ] Render health check `/health` pass.
- [ ] Backend không crash khi load model.
- [ ] Frontend không có 404 CSS/JS.
- [ ] Frontend gọi đúng backend production.
- [ ] Request `/predict` thành công từ production.
- [ ] Kiểm tra cold start của Render Free plan.
- [ ] Ghi rõ URL service thực tế.

Nếu không có quyền truy cập Render, phải ghi rõ:

> Chưa thể xác minh runtime production; mới chỉ kiểm tra tĩnh `render.yaml` và source code.

## 14. README và CI/CD

- [ ] Có README riêng cho Dự án 2.
- [ ] README có hướng dẫn local, test và Render.
- [ ] README có cảnh báo y khoa.
- [ ] README mô tả API và 30 feature.
- [ ] Có GitHub Actions chạy pytest nếu phù hợp.
- [ ] CI pass trên commit mới.
- [ ] Không kết luận production-ready khi chưa có bằng chứng runtime.

## 15. Báo cáo cuối cùng bắt buộc

- [ ] Liệt kê file đã thay đổi.
- [ ] Liệt kê test đã chạy và kết quả.
- [ ] Liệt kê URL Render đã kiểm tra.
- [ ] Ghi rõ endpoint nào pass/fail.
- [ ] Ghi rõ vấn đề còn lại.
- [ ] Phân loại từng vấn đề: `Đã xác minh`, `Cần sửa`, `Chưa thể xác minh`, hoặc `Không đạt`.
- [ ] Không ghi “đã hoàn thành” nếu chưa kiểm tra thành công, lỗi, validation, mobile, loading và Render.
