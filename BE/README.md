# Event Management API - Backend

API quản lý sự kiện cho Trường Đại học Sư phạm Kỹ thuật Đà Nẵng

## Yêu cầu hệ thống

- .NET 8.0 SDK
- SQL Server 2019 trở lên
- Visual Studio 2022 hoặc VS Code

## Cài đặt

### 1. Cài đặt .NET 8.0 SDK
Tải và cài đặt từ: https://dotnet.microsoft.com/download/dotnet/8.0

### 2. Cấu hình Database

Chạy file `DAPM.sql` trong SQL Server Management Studio để tạo database và dữ liệu mẫu.

### 3. Cấu hình Connection String

Cập nhật connection string trong `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=QuanLySuKien_DHSPKT;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

### 4. Khôi phục packages

```bash
cd BE/EventManagementAPI
dotnet restore
```

### 5. Chạy API

```bash
dotnet run
```

API sẽ chạy tại:
- HTTPS: `https://localhost:7000`
- HTTP: `http://localhost:5000`
- Swagger UI: `https://localhost:7000/swagger`

## Mở project trong Visual Studio

1. Mở Visual Studio 2022
2. File > Open > Project/Solution
3. Chọn file `BE/EventManagementAPI/EventManagementAPI.csproj`
4. Nhấn F5 để chạy

## API Endpoints

### Sự kiện (SuKien)

- `GET /api/sukien` - Lấy danh sách tất cả sự kiện
- `GET /api/sukien/{id}` - Lấy chi tiết sự kiện
- `GET /api/sukien/trang-thai/{trangThai}` - Lấy sự kiện theo trạng thái
- `POST /api/sukien` - Tạo sự kiện mới
- `PUT /api/sukien/{id}` - Cập nhật sự kiện
- `DELETE /api/sukien/{id}` - Xóa sự kiện

### Người dùng (NguoiDung)

- `POST /api/nguoidung/login` - Đăng nhập
- `GET /api/nguoidung` - Lấy danh sách người dùng
- `GET /api/nguoidung/{id}` - Lấy thông tin người dùng

### Đăng ký (DangKy)

- `POST /api/dangky/dang-ky` - Đăng ký tham gia sự kiện
- `POST /api/dangky/huy-dang-ky` - Hủy đăng ký
- `POST /api/dangky/check-in` - Check-in sự kiện
- `GET /api/dangky/su-kien/{idSuKien}` - Lấy danh sách đăng ký theo sự kiện
- `GET /api/dangky/nguoi-dung/{idNguoiDung}` - Lấy danh sách đăng ký theo người dùng

### Địa điểm (DiaDiem)

- `GET /api/diadiem` - Lấy danh sách địa điểm
- `GET /api/diadiem/{id}` - Lấy chi tiết địa điểm

## Cấu trúc thư mục

```
BE/EventManagementAPI/
├── Controllers/           # API Controllers
│   ├── SuKienController.cs
│   ├── NguoiDungController.cs
│   ├── DangKyController.cs
│   └── DiaDiemController.cs
├── Models/               # Entity Models
│   ├── SuKien.cs
│   ├── NguoiDung.cs
│   ├── DiaDiem.cs
│   ├── DangKySuKien.cs
│   ├── DanhMucSuKien.cs
│   ├── SuKien_DanhMuc.cs
│   ├── VaiTro.cs
│   └── VaiTro_NguoiDung.cs
├── DTOs/                 # Data Transfer Objects
│   ├── SuKienDTO.cs
│   ├── NguoiDungDTO.cs
│   ├── DiaDiemDTO.cs
│   └── DangKyDTO.cs
├── Services/             # Business Logic
│   ├── SuKienService.cs
│   ├── NguoiDungService.cs
│   ├── DangKyService.cs
│   └── DiaDiemService.cs
├── Data/                 # DbContext
│   └── AppDbContext.cs
├── Program.cs            # Entry point
├── appsettings.json      # Configuration
└── EventManagementAPI.csproj
```

## Test API

### Sử dụng Swagger UI

1. Chạy API
2. Mở trình duyệt: `https://localhost:7000/swagger`
3. Test các endpoints trực tiếp trên giao diện

### Sử dụng Postman

**Đăng nhập:**
```
POST https://localhost:7000/api/nguoidung/login
Content-Type: application/json

{
  "maSoSSO": "23115053001",
  "matKhau": "hashed_pw_1"
}
```

**Lấy danh sách sự kiện:**
```
GET https://localhost:7000/api/sukien
```

**Đăng ký sự kiện:**
```
POST https://localhost:7000/api/dangky/dang-ky
Content-Type: application/json

{
  "idSuKien": 1,
  "idNguoiDung": "ND001"
}
```

## CORS Configuration

API đã được cấu hình CORS để cho phép frontend kết nối từ mọi origin.

## Lưu ý

- Mật khẩu trong database mẫu chưa được hash (chỉ dùng cho development)
- Authentication/Authorization chưa được implement đầy đủ
- Cần implement JWT token cho production
- Cần thêm validation và error handling chi tiết hơn

## Troubleshooting

### Lỗi kết nối database

Kiểm tra:
1. SQL Server đã chạy chưa
2. Connection string đúng chưa
3. Database đã được tạo chưa (chạy DAPM.sql)

### Lỗi port đã được sử dụng

Thay đổi port trong `Properties/launchSettings.json` hoặc dừng process đang sử dụng port.
