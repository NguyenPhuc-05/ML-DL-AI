# Hướng dẫn đóng góp

## Quy trình làm việc

1. Tạo nhánh từ `main`: `feat/...`, `fix/...`, `test/...`, `docs/...` hoặc `refactor/...`.
2. Mỗi commit chỉ nên giải quyết một thay đổi có mục đích rõ ràng.
3. Chạy test của dự án bị ảnh hưởng trước khi đẩy code.
4. Mở pull request vào `main` và chờ GitHub Actions hoàn thành.
5. Ưu tiên squash merge để lịch sử `main` gọn và dễ đọc.

## Quy ước commit

```text
feat(iris): add prediction metadata endpoint
fix(render): correct backend start command
test(breast-cancer): reject unknown features
docs: clarify local setup
refactor(frontend): reuse API status helper
```

## Checklist pull request

- [ ] Không chứa secret, `.env` hoặc dữ liệu nhận dạng cá nhân.
- [ ] Test backend liên quan đã chạy thành công.
- [ ] JavaScript không có lỗi cú pháp.
- [ ] README được cập nhật nếu cách chạy hoặc API thay đổi.
- [ ] Artifact và metadata cùng phiên bản nếu mô hình được huấn luyện lại.
- [ ] Nội dung Breast Cancer vẫn ghi rõ mục đích giáo dục.

