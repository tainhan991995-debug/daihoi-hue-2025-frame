# Kết nối Google Sheets và Drive

Ảnh được lưu vào thư mục LoichucDoan đã cung cấp. Google Sheet ghi: mã lượt tải, thời gian lưu, họ tên, chức vụ–đơn vị, lời nhắn, link ảnh và tên file.

## 1. Tạo Apps Script

1. Mở https://script.google.com và đăng nhập tài khoản có quyền thêm ảnh vào thư mục LoichucDoan.
2. Chọn **Dự án mới**, đặt tên **Lưu lời chúc Đại hội Huế**.
3. Thay nội dung `Code.gs` bằng file `google-apps-script/Code.gs` trong dự án này.
4. Chọn hàm **setup** rồi **Chạy / Run**. Cấp quyền Google Sheets và Drive cho script của chính bạn. Hàm này tạo một Google Sheet mới; link Sheet xuất hiện trong nhật ký thực thi. Chạy lại không tạo trùng khi Script Properties còn nguyên.
5. Vào **Triển khai / Deploy → Triển khai mới / New deployment → Ứng dụng web / Web app**. Chọn **Thực thi dưới quyền tôi / Execute as Me**, quyền truy cập **Bất kỳ ai / Anyone**, rồi triển khai. Sao chép URL kết thúc bằng `/exec`.
6. Vào **Cài đặt dự án / Project Settings → Script Properties** để lấy `UPLOAD_SECRET`. Chỉ lưu khóa này ở cấu hình máy chủ, không đưa vào mã giao diện hoặc GitHub.

## 2. Cấu hình website

Tạo `.env.local` tại thư mục gốc dự án:

```dotenv
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/THAY_BANG_MA_TRIEN_KHAI/exec
GOOGLE_UPLOAD_SECRET=THAY_BANG_UPLOAD_SECRET_TRONG_SCRIPT_PROPERTIES
```

Trên Vercel, thêm cùng hai biến trong cấu hình Environment Variables của đúng dự án rồi triển khai lại website. Không dùng tiền tố `NEXT_PUBLIC_` cho khóa.

## 3. Kiểm tra thực tế

1. Chọn ảnh, nhập họ tên, đơn vị, lời nhắn rồi bấm tải.
2. Chờ thông báo đã lưu; ảnh sẽ được gửi đến trình duyệt để tải.
3. Kiểm tra một dòng mới trong tab `LuotTai` và mở link ảnh tại cột F. Ảnh Drive và ảnh tải về sử dụng cùng dữ liệu JPEG.
4. Nếu mạng lỗi, bấm **Thử lưu và tải lại**. Cùng mã lượt tải được dùng để tránh tạo dòng/ảnh trùng. Nếu bấm nút tải chính lần nữa, đó là một lượt mới.

Website ghi nhận lượt yêu cầu tải đã được lưu thành công, không thể xác nhận người dùng đã chọn lưu file trên thiết bị hay hủy hộp thoại tải. Đóng trang giữa lúc đang gửi có thể làm lượt tải chưa hoàn tất; giữ trang mở đến khi có thông báo.

Ảnh giới hạn 3 MB. Chưa có hàng đợi bền vững hay chống spam chuyên dụng; cần theo dõi dung lượng Drive và hạn mức Apps Script nếu mở chiến dịch đông người. Quyền xem ảnh kế thừa từ thư mục Drive đã chọn.

Tài liệu Google: https://developers.google.com/apps-script/guides/web
