# UTE Events — Hệ thống Quản lý Sự kiện

Ứng dụng web quản lý sự kiện cho **Trường Đại học Sư phạm Kỹ thuật — Đại học Đà Nẵng (UTE)**, gồm backend ASP.NET Core và frontend HTML/CSS/JavaScript.

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core |
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Tài liệu API | Swagger (khi chạy BE) |

---

## Mục lục

1. [Tổng quan chức năng](#tổng-quan-chức-năng)
2. [Cấu trúc dự án](#cấu-trúc-dự-án)
3. [Cài đặt & chạy](#cài-đặt--chạy)
4. [Luồng nghiệp vụ — Người tham gia](#luồng-nghiệp-vụ--người-tham-gia)
5. [API đăng ký / vé / check-in](#api-đăng-ký--vé--check-in)
6. [Trang frontend theo vai trò](#trang-frontend-theo-vai-trò)
7. [Cập nhật gần đây](#cập-nhật-gần-đây)
8. [Tài liệu bổ sung](#tài-liệu-bổ-sung)

---

## Tổng quan chức năng

Hệ thống hỗ trợ vòng đời sự kiện từ đề xuất → duyệt → đăng ký → check-in/check-out → báo cáo.

| Vai trò | Mô tả ngắn |
|---------|------------|
| **Người tham gia** | Xem sự kiện, đăng ký, vé điện tử, QR check-in, check-out, hủy đăng ký |
| **BTC (Ban tổ chức)** | Quản lý sự kiện, duyệt đăng ký, điểm danh QR, công việc, ngân sách |
| **CTSV** | Duyệt / từ chối sự kiện, báo cáo |
| **BGH** | Phê duyệt cấp cao, báo cáo |
| **Admin** | Người dùng, địa điểm, danh mục, dashboard |

---

## Cấu trúc dự án

```
DAPM_WebSuKien/
├── README.md                 # Tài liệu tổng (file này)
├── DAPM.sql                  # Script tạo DB chính
├── DAPM2.sql, DAPM3.sql …   # Script bổ sung / migration thủ công
│
├── BE/
│   ├── README.md             # Chi tiết API backend
│   └── aspiCore/             # ASP.NET Core Web API
│       ├── Controllers/
│       ├── Services/
│       ├── Model/
│       ├── Dtos/
│       └── Data/
│
└── FE/
    ├── index.html            # Trang landing / giới thiệu
    ├── pages/                # Trang theo vai trò
    ├── js/
    │   ├── ticket-business.js   # Logic nghiệp vụ vé (dùng chung)
    │   ├── events.js
    │   ├── event-detail.js
    │   ├── ticket-detail.js
    │   ├── my-tickets.js
    │   └── …
    ├── css/
    └── DAPM_TestData.sql     # Dữ liệu mẫu (tùy chọn)
```

---

## Cài đặt & chạy

### Yêu cầu

- .NET 8 SDK  
- SQL Server 2019+  
- Trình duyệt hiện đại (Chrome, Edge, Firefox)  
- (Khuyến nghị) Visual Studio 2022 hoặc VS Code  

### 1. Database

Chạy script trong SQL Server Management Studio (theo thứ tự phù hợp với môi trường của bạn):

1. `DAPM.sql` — tạo database và bảng  
2. `FE/DAPM_AlterTable.sql` — cột bổ sung (nếu có)  
3. `FE/DAPM_TestData.sql` — dữ liệu demo (tùy chọn)  

### 2. Backend

```bash
cd BE/aspiCore
dotnet restore
dotnet run --launch-profile https
```

- API HTTPS: **`https://localhost:7160`**  
- Swagger: **`https://localhost:7160/swagger`**  

Cập nhật connection string trong `BE/aspiCore/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=QuanLySuKien_DHSPKT;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

### 3. Frontend

Mở bằng **Live Server** (VS Code) hoặc host tĩnh bất kỳ, trỏ thư mục `FE/`.

Các file JS dùng chung base API:

```javascript
const API_BASE = "https://localhost:7160/api";
```

Nếu BE chạy port khác, sửa `API_BASE` trong các file `FE/js/*.js` tương ứng.

### 4. Đăng nhập thử

Sau khi import dữ liệu mẫu, dùng tài khoản trong DB (xem `DAPM.sql` / `DAPM_TestData.sql`). Mật khẩu mẫu thường ở dạng plain/hash cho **môi trường dev**.

---

## Luồng nghiệp vụ — Người tham gia

Logic đã được thống nhất theo sơ đồ nghiệp vụ (module `FE/js/ticket-business.js`).

### Giai đoạn 1 — Đăng ký

1. Xem chi tiết sự kiện: `pages/event-detail.html?id={idSuKien}`  
2. Hệ thống kiểm tra: sự kiện **Đã duyệt**, còn chỗ, chưa bắt đầu/kết thúc.  
3. Nếu **đã đăng ký** (trạng thái ≠ Đã hủy) → chuyển xem vé, không cho đăng ký lại.  
4. Form đăng ký: họ tên, MSSV, email **prefill từ tài khoản, readonly**.  
5. `POST /api/DangKy/dang-ky` → trạng thái **Chờ xác nhận** (nếu sự kiện yêu cầu duyệt) hoặc **Đã xác nhận** (tự động).  

### Giai đoạn 2 — Xét duyệt (BTC)

- BTC duyệt trên `btc-attendance.html` / luồng BTC: **Chờ xác nhận** → **Đã xác nhận**.  
- Sau duyệt, người tham gia mới thấy **mã QR** trên vé.

### Giai đoạn 3 — Xem vé & hủy

| Trang | Vai trò |
|-------|---------|
| `pages/my-tickets.html` | Danh sách vé — click mở chi tiết |
| `pages/ticket-detail.html?id={idDangKy}` | Chi tiết vé, QR, timeline, CI/CO, hủy |

**QR check-in (người tham gia hiển thị cho BTC quét):**

- Định dạng: `UTE-CHECKIN-{idDangKy}-{timestamp}`  
- Tự làm mới mỗi **45 giây**  
- Chỉ hiển thị khi trạng thái **Đã xác nhận**

**Hủy đăng ký:**

- Chỉ khi **Chờ xác nhận** hoặc **Đã xác nhận**  
- Chưa check-in  
- Sự kiện chưa kết thúc  
- Hủy → **Đã hủy**, giải phóng 1 slot (phía server)

### Giai đoạn 4 — Check-in QR tại sự kiện

- Cửa sổ check-in: **T−30 phút** đến **hết sự kiện** (validate **server-side**).  
- BTC quét QR → `POST /api/DangKy/check-in-qr` với `{ "QrToken": "UTE-CHECKIN-..." }`.  
- Token hết hạn sau **45 giây** (server từ chối nếu quá hạn).  
- Thành công → **Đã tham gia**, ghi `ThoiGianCheckin`.  
- Người tham gia có thể **tự check-in** qua app: `POST /api/DangKy/check-in` (cùng rule thời gian).

### Giai đoạn 5 — Check-out

- Không cần QR.  
- Điều kiện: đã check-in, sự kiện đã bắt đầu, chưa check-out.  
- `POST /api/DangKy/check-out` → ghi `ThoiGianCheckout`.

### Vòng đời trạng thái vé (`DangKySuKien.TrangThai`)

```
Chờ xác nhận ──(BTC duyệt)──► Đã xác nhận ──(check-in)──► Đã tham gia
       │                            │
       └──(hủy / từ chối)──► Đã hủy  └──(không CI sau SK)──► Vắng mặt *
```

\* Trạng thái **Vắng mặt**: dự kiến BTC đánh dấu thủ công hoặc job sau sự kiện — chưa có API tự động đầy đủ.

### Quy tắc nghiệp vụ (tóm tắt)

| Quy tắc | FE | BE |
|---------|----|----|
| Check-in T−30 → hết SK | `ticket-business.js` | `DangKyService.CheckInAsync` |
| QR 45s, format UTE-CHECKIN | `ticket-detail.js` | `CheckInByQrAsync` |
| Hủy trước CI, trước khi SK kết thúc | `canCancel()` | `HuyDangKyAsync` |
| Check-out sau khi SK bắt đầu | `canSelfCheckout()` | `CheckOutAsync` |
| Waitlist khi hủy chỗ | — | Chưa triển khai |

---

## API đăng ký / vé / check-in

Base: `https://localhost:7160/api/DangKy`

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/dang-ky` | Đăng ký `{ IdSuKien, IdNguoiDung }` |
| POST | `/huy-dang-ky` | Hủy đăng ký |
| POST | `/check-in` | Tự check-in (người tham gia) |
| POST | `/check-in-qr` | Check-in qua QR (BTC) — body `{ QrToken }` |
| POST | `/check-out` | Check-out |
| POST | `/xac-nhan` | BTC: Chờ xác nhận → Đã xác nhận |
| POST | `/tu-choi` | BTC: Chờ xác nhận → Đã hủy |
| GET | `/nguoi-dung/{id}` | Danh sách vé của user |
| GET | `/su-kien/{id}` | Danh sách đăng ký theo sự kiện |
| GET | `/public/{idDangKy}` | Tra cứu vé (public) |

Chi tiết controller, model và các API khác (SuKien, NguoiDung, …): xem **[BE/README.md](BE/README.md)**.

---

## Trang frontend theo vai trò

### Người tham gia

| File | Chức năng |
|------|-----------|
| `home-user.html` | Trang chủ, sự kiện nổi bật |
| `events.html` | Danh sách & lọc sự kiện |
| `event-detail.html` | Chi tiết + đăng ký nhanh |
| `register-event.html` | Form đăng ký đầy đủ |
| `my-tickets.html` | Danh sách vé |
| `ticket-detail.html` | **Chi tiết vé, QR, CI/CO** |
| `history.html` | Lịch sử tham gia |
| `calender.html` | Lịch cá nhân |
| `notifications.html` | Thông báo |
| `profile.html` | Hồ sơ |

### BTC / CTSV / BGH / Admin

| Nhóm | Ví dụ trang |
|------|-------------|
| BTC | `btc-dashboard.html`, `btc-events.html`, `btc-attendance.html`, `btc-approval.html`, … |
| CTSV | `ctsv-pending-approval.html`, `ctsv-reports.html`, … |
| BGH | `bgh-pending-approval.html`, `bgh-reports.html`, … |
| Admin | `admin-dashboard.html`, `admin-users.html`, `admin-locations.html`, … |

Tài liệu phân quyền: `FE/BTC_AUTHORIZATION_README.md`, `FE/CTSV_APPROVAL_README.md`, `FE/CHANGELOG_PERMISSIONS.md`.

---

## Cập nhật gần đây

### Người tham gia — logic vé & sự kiện (đồng bộ sơ đồ nghiệp vụ)

**Frontend**

- Thêm **`FE/js/ticket-business.js`**: QR, hủy, cửa sổ check-in/out dùng chung.  
- **`ticket-detail.html`**: trang trung tâm cho QR (45s), timeline, check-in/out, hủy.  
- **`my-tickets.html`**: chỉ danh sách; click / `?dangKyId=` → redirect `ticket-detail.html`.  
- **`events.html`**: badge trạng thái đăng ký; nút **Xem vé & QR** → `ticket-detail.html`.  
- **`event-detail.html`**: sửa `currentEvent`, form readonly, redirect khi đã đăng ký / trùng đăng ký.  
- Đồng bộ link vé: `history.js`, `calender.js`, `register-event.js`, `home-user.js` (PascalCase API).  
- QR chuẩn: `UTE-CHECKIN-{idDangKy}-{timestamp}` (thay cho format `UTE|CHECKIN|...` cũ).

**Backend**

- **`HuyDangKyAsync`**: chặn hủy nếu đã check-in hoặc sự kiện đã kết thúc.  
- **`CheckOutAsync`**: chặn nếu sự kiện chưa bắt đầu.  
- **`POST /api/DangKy/check-in-qr`**: validate QR + hết hạn 45s + cửa sổ T−30.  
- **`DangKySuKienAsync`**: trả `IdDangKy` khi đăng ký trùng (FE redirect sang vé).  
- DTO: **`QrCheckInDto.cs`**.  
- **`btc-attendance.js`**: danh sách `DangKy/su-kien`, quét QR, duyệt/từ chối ĐK (`xac-nhan` / `tu-choi`).  
- **`FE/README.md`**: tài liệu frontend đầy đủ.

### Việc cần làm tiếp (chưa có trong bản này)

- Waitlist khi có chỗ trống sau hủy  
- Job / API gán **Vắng mặt** sau sự kiện  
- Gửi email xác nhận vé (hiện chủ yếu thông báo trong app)  
- Map cột `YeuCauXacNhan` trên `SuKien` (EF) nếu dùng duyệt thủ công  

---

## Tài liệu bổ sung

| File | Nội dung |
|------|----------|
| [FE/README.md](FE/README.md) | Cấu trúc frontend, trang theo vai trò, `ticket-business.js` |
| [BE/README.md](BE/README.md) | Cài đặt API, cấu trúc BE, endpoint tổng hợp |
| `FE/BTC_AUTHORIZATION_README.md` | Phân quyền BTC |
| `FE/CTSV_APPROVAL_README.md` | Luồng duyệt CTSV |
| `FE/CHANGELOG_PERMISSIONS.md` | Lịch sử thay đổi phân quyền |

---

## Khắc phục sự cố

| Vấn đề | Gợi ý |
|--------|--------|
| FE không gọi được API | Kiểm tra BE đang chạy `https://localhost:7160`, CORS, chứng chỉ HTTPS |
| Không tải được sự kiện | Chạy `DAPM.sql`, kiểm tra connection string |
| QR BTC báo hết hạn | Làm mới QR trên điện thoại (< 45s), gọi `check-in-qr` |
| Build BE lỗi copy DLL | Dừng process `aspiCore` / IIS Express rồi `dotnet build` lại |

---

© 2026 — Dự án môn **DAPM** / Quản lý sự kiện UTE-ĐN
