# UTE Events — Frontend

Giao diện web tĩnh (HTML/CSS/JavaScript) cho hệ thống quản lý sự kiện UTE.

> Tài liệu tổng dự án: **[../README.md](../README.md)** · API backend: **[../BE/README.md](../BE/README.md)**

## Yêu cầu

- Trình duyệt hiện đại (Chrome, Edge, Firefox)
- Backend API đang chạy: `https://localhost:7160`
- Extension **Live Server** (VS Code) hoặc web server tĩnh tương đương

## Chạy frontend

1. Khởi động API (xem `BE/README.md`).
2. Mở thư mục `FE/` bằng Live Server (root `FE` hoặc từng file trong `pages/`).
3. Truy cập ví dụ:
   - Landing: `index.html`
   - Đăng nhập: `pages/login.html`
   - Người tham gia: `pages/home-user.html`

### Cấu hình API

Hầu hết file trong `js/` dùng:

```javascript
const API_BASE = "https://localhost:7160/api";
```

Đổi port/URL tại các file JS tương ứng nếu BE không chạy 7160.

### Xác thực

- Đăng nhập lưu `token` và `userData` trong `localStorage`.
- Các trang người tham gia gửi header: `Authorization: Bearer {token}`.

---

## Cấu trúc thư mục

```
FE/
├── index.html              # Trang giới thiệu / landing
├── pages/                  # Trang theo vai trò
├── js/                     # Logic từng màn hình
├── css/                    # Style theo module
├── images/                 # Ảnh, logo
├── DAPM.sql                # (bản sao/tham chiếu DB)
├── DAPM_AlterTable.sql
├── DAPM_TestData.sql
├── DAPM_TestData_Realtime.sql   # Căn SK theo GETDATE (chạy lại được)
└── README.md               # File này
```

---

## Module dùng chung — `js/ticket-business.js`

Logic nghiệp vụ **vé / QR / hủy / cửa sổ check-in** (người tham gia). Các trang sau **nên load file này trước** script trang:

| Hàm / hằng | Mô tả |
|------------|--------|
| `buildQrPayload(idDangKy)` | `UTE-CHECKIN-{id}-{timestamp}` |
| `canShowQr(trangThai)` | Chỉ `Đã xác nhận` |
| `canCancel(ticket)` | Chưa CI, SK chưa kết thúc |
| `canSelfCheckin` / `canSelfCheckout` | Rule T−30 và sau khi SK bắt đầu |
| `normalizeTicket(raw)` | PascalCase API → object thống nhất |
| `ticketDetailUrl(id)` | `ticket-detail.html?id=` |

**Trang đã tích hợp:** `ticket-detail.html`, `my-tickets.html`, `event-detail.html`, `events.html`.

---

## Người tham gia — luồng & trang

```text
events.html → event-detail.html → [register-event.html]
                    ↓
            my-tickets.html (danh sách tab → chọn vé → chi tiết + QR)
                    ↓ (tùy chọn)
            ticket-detail.html (trang vé đầy đủ)
```

| File | Script | Chức năng |
|------|--------|-----------|
| `pages/home-user.html` | `home-user.js` | Trang chủ, SK nổi bật |
| `pages/events.html` | `events.js` | Danh sách, lọc, badge đăng ký |
| `pages/event-detail.html` | `event-detail.js` | Chi tiết, đăng ký nhanh, hủy |
| `pages/register-event.html` | `register-event.js` | Form đăng ký đầy đủ |
| `pages/my-tickets.html` | `my-tickets.js` | **Tab danh sách** (đang diễn ra / đã đăng ký / đã hủy) → bấm mới hiện chi tiết + QR |
| `pages/ticket-detail.html` | `ticket-detail.js` | **Vé điện tử, QR 45s, CI/CO** |
| `pages/history.html` | `history.js` | Lịch sử tham gia |
| `pages/calender.html` | `calender.js` | Lịch cá nhân |
| `pages/notifications.html` | `notifications.js` | Thông báo |
| `pages/profile.html` | `profile.js` | Hồ sơ |
| `pages/login.html` | `login.js` | Đăng nhập |

### API thường dùng (người tham gia)

| Thao tác | Endpoint |
|----------|----------|
| Danh sách SK | `GET /api/SuKien` |
| Chi tiết SK | `GET /api/SuKien/{id}` |
| Đăng ký | `POST /api/DangKy/dang-ky` |
| Hủy | `POST /api/DangKy/huy-dang-ky` |
| Vé của tôi | `GET /api/DangKy/nguoi-dung/{id}` |
| Tự check-in | `POST /api/DangKy/check-in` |
| Check-out | `POST /api/DangKy/check-out` |

---

## BTC (Ban tổ chức)

| File | Script | Chức năng |
|------|--------|-----------|
| `btc-dashboard.html` | `btc-dashboard.js` | Dashboard |
| `btc-events.html` | `btc-events.js` | Sự kiện của BTC |
| `btc-attendance.html` | `btc-attendance.js` | **Điểm danh, duyệt ĐK, quét QR** |
| `btc-approval.html` | `btc-approval.js` | Phê duyệt nội bộ |
| `btc-team-tasks.html` | `btc-team-tasks.js` | Công việc |
| `btc-budget.html` | `btc-budget.js` | Ngân sách |
| `btc-reports.html` | `btc-reports.js` | Báo cáo |

### Điểm danh BTC — `btc-attendance.html`

Mở kèm id sự kiện:

```text
pages/btc-attendance.html?idSuKien=1
```

| Thao tác | Endpoint |
|----------|----------|
| Danh sách đăng ký | `GET /api/DangKy/su-kien/{idSuKien}` |
| Quét QR check-in | `POST /api/DangKy/check-in-qr` `{ QrToken }` |
| Duyệt đăng ký | `POST /api/DangKy/xac-nhan` |
| Từ chối | `POST /api/DangKy/tu-choi` |

QR người tham gia hiển thị: `UTE-CHECKIN-{idDangKy}-{timestamp}` (hết hạn 45 giây).

Auth BTC: `btc-auth.js`, `btc-logout.js` (kiểm tra token/role).

---

## CTSV / BGH / Admin

| Vai trò | Trang chính |
|---------|-------------|
| CTSV | `ctsv-pending-approval.html`, `ctsv-approval-history.html`, `ctsv-reports.html` |
| BGH | `bgh-pending-approval.html`, `bgh-approval-history.html`, `bgh-reports.html` |
| Admin | `admin-dashboard.html`, `admin-users.html`, `admin-locations.html`, `admin-event-categories.html` |

Tài liệu chi tiết:

- `BTC_AUTHORIZATION_README.md`
- `CTSV_APPROVAL_README.md`
- `CHANGELOG_PERMISSIONS.md`
- `UPDATE_PERMISSIONS_V2.md`

---

## Trạng thái vé (`DangKySuKien`)

| Trạng thái | Ý nghĩa (UI) |
|------------|----------------|
| Chờ xác nhận | Đã gửi ĐK, chờ BTC |
| Đã xác nhận | Có thể hiện QR check-in |
| Đã tham gia | Đã check-in |
| Đã hủy | User/BTC hủy |
| Vắng mặt | Không check-in (BTC hệ thống) |

---

## Khắc phục sự cố

| Triệu chứng | Cách xử lý |
|-------------|------------|
| Không load sự kiện | BE chạy chưa? CORS? Sửa `API_BASE` |
| QR BTC “hết hạn” | Làm mới QR trên điện thoại (< 45s) |
| Điểm danh BTC trống | URL có `?idSuKien=` chưa? |
| 401 / redirect login | Xóa `localStorage`, đăng nhập lại |
| Mixed content | FE HTTPS + BE HTTPS cùng kiểu |

---

## Cập nhật gần đây (FE)

- Thêm `ticket-business.js` — logic vé thống nhất.
- `ticket-detail.html` — trang chi tiết vé chính.
- `my-tickets.html` — chỉ list; redirect `?dangKyId=` → ticket-detail.
- `events.html` / `event-detail.html` — link vé, QR format mới.
- `btc-attendance.js` — API `DangKy` thật, quét QR `check-in-qr`, duyệt/từ chối ĐK.

---

© 2026 — Frontend UTE Events (DAPM)
