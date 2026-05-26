# Event Management API — Backend

API quản lý sự kiện cho Trường Đại học Sư phạm Kỹ thuật — Đà Nẵng (UTE).

> Tài liệu tổng thể dự án (frontend, luồng người tham gia, changelog): **[../README.md](../README.md)**

## Yêu cầu hệ thống

- .NET 8.0 SDK
- SQL Server 2019 trở lên
- Visual Studio 2022 hoặc VS Code

## Cài đặt

### 1. Database

Chạy `../DAPM.sql` (và `../FE/DAPM_AlterTable.sql` nếu cần) trong SQL Server Management Studio.

### 2. Connection string

`BE/aspiCore/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=QuanLySuKien_DHSPKT;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

### 3. Chạy API

```bash
cd BE/aspiCore
dotnet restore
dotnet run --launch-profile https
```

| Môi trường | URL |
|------------|-----|
| HTTPS (mặc định profile `https`) | `https://localhost:7160` |
| HTTP | `http://localhost:5103` |
| Swagger | `https://localhost:7160/swagger` |

Frontend (`FE/js/*.js`) đang trỏ `API_BASE = "https://localhost:7160/api"`.

## Cấu trúc thư mục

```
BE/aspiCore/
├── Controllers/
│   ├── SuKienController.cs
│   ├── NguoiDungController.cs
│   ├── AuthController.cs
│   ├── DangKyController.cs      # Đăng ký, vé, CI/CO, QR
│   ├── DiaDiemController.cs
│   ├── ThongBaoController.cs
│   ├── CongviecController.cs
│   └── ReportController.cs
├── Model/
├── Dtos/
│   └── DangKy/
│       ├── DangKyDto.cs
│       └── QrCheckInDto.cs      # QR BTC scan
├── Services/
│   └── DangKyService.cs         # Logic nghiệp vụ đăng ký / CI / CO
├── Data/ApplicationDBContext.cs
└── Program.cs
```

## API — Đăng ký & vé (`/api/DangKy`)

| Method | Route | Body | Ghi chú |
|--------|-------|------|---------|
| POST | `dang-ky` | `{ IdSuKien, IdNguoiDung }` | Kiểm tra trùng, chỗ, thời gian SK |
| POST | `huy-dang-ky` | `{ IdSuKien, IdNguoiDung }` | Không hủy sau CI / sau khi SK kết thúc |
| POST | `check-in` | `{ IdSuKien, IdNguoiDung }` | T−30 phút → hết SK; trạng thái **Đã xác nhận** |
| POST | `check-in-qr` | `{ QrToken }` | BTC quét `UTE-CHECKIN-{id}-{ts}`, TTL 45s |
| POST | `check-out` | `{ IdSuKien, IdNguoiDung }` | Sau khi SK bắt đầu |
| POST | `xac-nhan` | `{ IdSuKien, IdNguoiDung }` | BTC: Chờ xác nhận → Đã xác nhận |
| POST | `tu-choi` | `{ IdSuKien, IdNguoiDung }` | BTC: Chờ xác nhận → Đã hủy |
| GET | `nguoi-dung/{id}` | — | Vé / đăng ký của user |
| GET | `su-kien/{id}` | — | Danh sách đăng ký theo SK |
| GET | `public/{idDangKy}` | — | Tra cứu vé (public) |

### Trạng thái `DangKySuKien.TrangThai`

`Chờ xác nhận` → `Đã xác nhận` → `Đã tham gia` (sau check-in) · `Đã hủy` · `Vắng mặt`

### Ví dụ — Check-in QR (BTC)

```http
POST https://localhost:7160/api/DangKy/check-in-qr
Content-Type: application/json

{
  "QrToken": "UTE-CHECKIN-12-1716634523456"
}
```

### Ví dụ — Đăng ký

```http
POST https://localhost:7160/api/DangKy/dang-ky
Content-Type: application/json

{
  "IdSuKien": 1,
  "IdNguoiDung": "ND001"
}
```

Response thành công: `{ "Success": true, "Message": "...", "IdDangKy": 5 }`  
Đăng ký trùng: `Success: false`, kèm `IdDangKy` để client redirect.

## API — Các module khác (tóm tắt)

### Sự kiện (`/api/SuKien`)

- CRUD, lọc theo trạng thái, câu hỏi sự kiện, v.v.

### Người dùng (`/api/NguoiDung`, `/api/Auth`)

- Đăng nhập, đăng ký, quản lý tài khoản

### Địa điểm (`/api/DiaDiem`)

- CRUD địa điểm

### Thông báo (`/api/ThongBao`)

- Danh sách, đếm chưa đọc

Chi tiết: mở **Swagger** khi API đang chạy.

## Cập nhật service layer (gần đây)

File **`Services/DangKyService.cs`**:

- `HuyDangKyAsync` — Include `SuKien`, chặn hủy sau check-in / sau `ThoiGianKetThuc`
- `CheckOutAsync` — chặn check-out trước `ThoiGianBatDau`
- `CheckInByQrAsync` — parse `UTE-CHECKIN-{id}-{timestamp}`, expiry 45s, cửa sổ T−30
- `DangKySuKienAsync` — trả `IdDangKy` khi đã đăng ký

## Database

Bảng chính: `NguoiDung`, `SuKien`, `DangKySuKien`, `DiaDiem`, `ThongBao`, `CongViec`, `PhanCong`, `VaiTro`, …

Script: `../DAPM.sql`

## Lưu ý phát triển

- JWT đã cấu hình; một số endpoint `DangKy` vẫn nhận `IdNguoiDung` từ body — cần gắn `[Authorize]` + claim user cho production
- Mật khẩu mẫu trong DB có thể chưa hash đầy đủ (chỉ dev)
- Stored procedures trong `DAPM.sql` (`sp_CheckInSuKien`, …) **không** được gọi từ C# — logic nằm trong `DangKyService`
- Cột `SuKien.YeuCauXacNhan`: kiểm tra đã map EF sau khi chạy script alter

## Troubleshooting

**Lỗi kết nối database** — SQL Server chạy, đúng connection string, đã chạy `DAPM.sql`.

**Port bận** — Đổi port trong `Properties/launchSettings.json` hoặc dừng process `aspiCore`.

**Build: file locked** — Dừng API đang chạy (VS / terminal) rồi `dotnet build` lại.
