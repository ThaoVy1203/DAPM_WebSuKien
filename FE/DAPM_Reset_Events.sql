-- ============================================================
-- DAPM_Reset_Events.sql
-- Mục đích: Reset toàn bộ sự kiện về thời gian TƯƠNG LAI
--           để test đăng ký, check-in, check-out
-- Chạy file này mỗi khi cần reset dữ liệu test
-- ============================================================

USE QuanLySuKien_DHSPKT;
GO

DECLARE @now  DATETIME2 = SYSDATETIME();
DECLARE @today DATE     = CAST(@now AS DATE);

PRINT N'=== Reset sự kiện về thời gian tương lai ===';
PRINT N'Thời điểm hiện tại: ' + CONVERT(NVARCHAR(30), @now, 120);
PRINT N'';

-- ============================================================
-- 1. XÓA ĐĂNG KÝ CŨ CỦA ND001 (tài khoản test chính)
--    để có thể đăng ký lại
-- ============================================================
DELETE FROM DangKySuKien
WHERE idNguoiDung = 'ND001'
  AND idSuKien IN (4, 5, 6, 7, 8, 10);
PRINT N'Đã xóa đăng ký cũ của ND001 cho SK 4-10';
GO

-- ============================================================
-- 2. CẬP NHẬT THỜI GIAN SỰ KIỆN SK 4-10
-- ============================================================
DECLARE @now  DATETIME2 = SYSDATETIME();
DECLARE @today DATE     = CAST(@now AS DATE);

-- SK4: Ngày hội Khởi nghiệp — 7 ngày nữa (đăng ký được)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 7, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 7, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 4;

-- SK5: Festival Văn hóa — 14 ngày nữa (đăng ký được)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 14, DATEADD(day, 14, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 21, DATEADD(day, 14, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 5;

-- SK6: Hackathon AI — ĐANG DIỄN RA (bắt đầu 2h trước, kết thúc 6h sau)
--      → ND001 có thể check-in ngay
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, -2, @now),
    thoiGianKetThuc = DATEADD(hour,  6, @now),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 6;

-- SK7: Hội thảo Blockchain — ĐÃ KẾT THÚC 3 ngày trước (xem lịch sử)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 9,  DATEADD(day, -3, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 12, DATEADD(day, -3, CAST(@today AS DATETIME2))),
    trangThai       = N'Kết thúc'
WHERE idSuKien = 7;

-- SK8: Workshop UI/UX — 21 ngày nữa, giới hạn 5 chỗ (đăng ký được)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 13, DATEADD(day, 21, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 21, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 8;

-- SK9: Robotics — Chờ duyệt (không đăng ký được)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(day, 45, @now),
    thoiGianKetThuc = DATEADD(day, 46, @now),
    trangThai       = N'Chờ duyệt'
WHERE idSuKien = 9;

-- SK10: Seminar Phỏng vấn — 10 ngày nữa (đăng ký được)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 10, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 11, DATEADD(day, 10, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 10;

PRINT N'Đã cập nhật thời gian SK 4-10';
GO

-- ============================================================
-- 3. THÊM ĐĂNG KÝ MẪU CHO ND001 (trạng thái đa dạng)
-- ============================================================
DECLARE @now DATETIME2 = SYSDATETIME();

-- SK6: ND001 đã xác nhận → có thể check-in (sự kiện đang diễn ra)
INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianDangKy)
VALUES (6, 'ND001', N'Đã xác nhận', DATEADD(day, -1, @now));

-- SK7: ND001 đã tham gia (lịch sử)
INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianDangKy,
    thoiGianCheckin, thoiGianCheckout)
VALUES (7, 'ND001', N'Đã tham gia',
    DATEADD(day, -5, @now),
    DATEADD(hour, 9,  DATEADD(day, -3, CAST(CAST(@now AS DATE) AS DATETIME2))),
    DATEADD(hour, 12, DATEADD(day, -3, CAST(CAST(@now AS DATE) AS DATETIME2))));

PRINT N'Đã thêm đăng ký mẫu cho ND001';
GO

-- ============================================================
-- 4. KIỂM TRA KẾT QUẢ
-- ============================================================
DECLARE @now DATETIME2 = SYSDATETIME();

SELECT
    sk.idSuKien,
    LEFT(sk.tenSuKien, 45) AS tenSuKien,
    sk.trangThai,
    FORMAT(sk.thoiGianBatDau,  'dd/MM/yyyy HH:mm') AS batDau,
    FORMAT(sk.thoiGianKetThuc, 'dd/MM/yyyy HH:mm') AS ketThuc,
    CASE
        WHEN @now > sk.thoiGianKetThuc
            THEN N'❌ Đã kết thúc — KHÔNG đăng ký được'
        WHEN @now BETWEEN sk.thoiGianBatDau AND sk.thoiGianKetThuc
            THEN N'🟡 Đang diễn ra — đăng ký được (nếu Đã duyệt)'
        WHEN sk.trangThai = N'Đã duyệt'
            THEN N'✅ Sắp tới — ĐĂNG KÝ ĐƯỢC'
        ELSE N'⚠️ ' + sk.trangThai + N' — không đăng ký được'
    END AS trangThaiDangKy
FROM SuKien sk
WHERE sk.idSuKien BETWEEN 4 AND 10
ORDER BY sk.idSuKien;
GO

SELECT
    dk.idDangKy,
    LEFT(sk.tenSuKien, 40) AS tenSuKien,
    dk.trangThai,
    FORMAT(sk.thoiGianBatDau,  'dd/MM HH:mm') AS batDau,
    FORMAT(sk.thoiGianKetThuc, 'dd/MM HH:mm') AS ketThuc,
    FORMAT(dk.thoiGianCheckin, 'dd/MM HH:mm') AS checkin
FROM DangKySuKien dk
JOIN SuKien sk ON dk.idSuKien = sk.idSuKien
WHERE dk.idNguoiDung = 'ND001'
ORDER BY sk.thoiGianBatDau DESC;
GO

PRINT N'';
PRINT N'=== HOÀN TẤT ===';
PRINT N'Tài khoản test: 23115053001 / sv123 (ND001)';
PRINT N'SK4  — 7 ngày nữa  → Đăng ký được';
PRINT N'SK5  — 14 ngày nữa → Đăng ký được';
PRINT N'SK6  — Đang diễn ra → ND001 đã đăng ký, có thể CHECK-IN ngay';
PRINT N'SK7  — Đã kết thúc  → Xem lịch sử';
PRINT N'SK8  — 21 ngày nữa → Đăng ký được (5 chỗ)';
PRINT N'SK10 — 10 ngày nữa → Đăng ký được';
GO
