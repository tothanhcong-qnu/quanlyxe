# Quản lý xe tập lái - Desktop app Windows

Đây là bộ mã nguồn Electron để đóng gói thành ứng dụng Windows có file cài đặt `.exe`.

## Chức năng
- Thêm, sửa, xóa xe tập lái
- Cảnh báo hết hạn đăng kiểm, GPTL, hợp đồng
- Nhập Excel
- Xuất Excel
- In báo cáo
- Lưu dữ liệu cục bộ trên máy

## Build file cài đặt trên Windows
1. Cài Node.js LTS
2. Mở PowerShell tại thư mục dự án
3. Chạy:
   ```powershell
   npm install
   npm run dist
   ```
4. File cài đặt sẽ nằm trong thư mục `dist/`

## Chạy thử
```powershell
npm install
npm start
```

## Ghi chú
- Bộ dự án đã cấu hình `electron-builder` để xuất bộ cài NSIS cho Windows x64.
- Trong môi trường trò chuyện này, tôi tạo được bộ mã nguồn đóng gói sẵn. Việc build ra `.exe` nên chạy trên máy Windows để cho ra installer đầy đủ và tương thích nhất.
