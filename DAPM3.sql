-- ============================================================
-- FILE: DAPM_Fix_CheckIn.sql
-- MỤC ĐÍCH: Cập nhật thời gian sự kiện để test check-in hôm nay
--           Chạy file này để fix dữ liệu test
-- NGÀY: 26/05/2026
-- ============================================================

USE QuanLySuKien_DHSPKT;
GO

-- ============================================================
-- 1. CẬP NHẬT SỰ KIỆN ĐỂ CÓ SỰ KIỆN ĐANG DIỄN RA HÔM NAY
--    (dùng GETDATE() để luôn đúng với ngày hiện tại)
-- ============================================================

-- SK6: Hackathon AI — đang diễn ra HÔM NAY (bắt đầu 1 giờ trước, kết thúc 5 giờ sau)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(HOUR, -1, GETDATE()),   -- 1 giờ trước
    thoiGianKetThuc = DATEADD(HOUR,  5, GETDATE()),   -- 5 giờ sau
    trangThai       = N'Đang diễn ra'
WHERE idSuKien = 6;
GO

-- SK4: Ngày hội Khởi nghiệp — sắp diễn ra (30 phút nữa → test cửa sổ check-in)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(MINUTE, 25, GETDATE()),  -- 25 phút nữa (trong cửa sổ T-30)
    thoiGianKetThuc = DATEADD(HOUR,   8, GETDATE()),   -- 8 giờ sau
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 4;
GO

-- SK5: Festival — sắp diễn ra (2 giờ nữa → chưa mở check-in)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(HOUR,  2, GETDATE()),   -- 2 giờ nữa
    thoiGianKetThuc = DATEADD(HOUR,  9, GETDATE()),   -- 9 giờ sau
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 5;
GO

-- SK7: Hội thảo Blockchain — đã kết thúc hôm qua
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(DAY, -1, DATEADD(HOUR, 9,  CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    thoiGianKetThuc = DATEADD(DAY, -1, DATEADD(HOUR, 12, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    trangThai       = N'Kết thúc'
WHERE idSuKien = 7;
GO

-- SK8: Workshop UI/UX — ngày mai
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(DAY, 1, DATEADD(HOUR, 13, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    thoiGianKetThuc = DATEADD(DAY, 1, DATEADD(HOUR, 17, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 8;
GO

-- SK10: Seminar — 3 ngày nữa
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(DAY, 3, DATEADD(HOUR, 8,  CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    thoiGianKetThuc = DATEADD(DAY, 3, DATEADD(HOUR, 11, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 10;
GO

-- ============================================================
-- 2. CẬP NHẬT ĐĂNG KÝ ND001 CHO SK6 → "Đã xác nhận" để test check-in
-- ============================================================
UPDATE DangKySuKien SET
    trangThai        = N'Đã xác nhận',
    thoiGianCheckin  = NULL,
    thoiGianCheckout = NULL
WHERE idSuKien = 6 AND idNguoiDung = 'ND001';
GO

-- ============================================================
-- 3. KIỂM TRA KẾT QUẢ
-- ============================================================
SELECT
    sk.idSuKien,
    sk.tenSuKien,
    sk.trangThai,
    FORMAT(sk.thoiGianBatDau,  'dd/MM/yyyy HH:mm') AS batDau,
    FORMAT(sk.thoiGianKetThuc, 'dd/MM/yyyy HH:mm') AS ketThuc,
    dd.tenDiaDiem,
    dd.viTri,
    CASE
        WHEN GETDATE() BETWEEN DATEADD(MINUTE,-30,sk.thoiGianBatDau) AND sk.thoiGianKetThuc
        THEN N'✅ Cửa sổ check-in ĐANG MỞ'
        WHEN GETDATE() < DATEADD(MINUTE,-30,sk.thoiGianBatDau)
        THEN N'⏳ Check-in chưa mở (còn ' + CAST(DATEDIFF(MINUTE,GETDATE(),DATEADD(MINUTE,-30,sk.thoiGianBatDau)) AS NVARCHAR) + N' phút)'
        ELSE N'❌ Đã hết giờ check-in'
    END AS trangThaiCheckIn
FROM SuKien sk
LEFT JOIN DiaDiem dd ON sk.idDiaDiem = dd.idDiaDiem
WHERE sk.idSuKien BETWEEN 4 AND 10
ORDER BY sk.idSuKien;
GO

-- Kiểm tra đăng ký của ND001
SELECT
    dk.idDangKy,
    sk.tenSuKien,
    FORMAT(sk.thoiGianBatDau,  'dd/MM/yyyy HH:mm') AS batDau,
    FORMAT(sk.thoiGianKetThuc, 'dd/MM/yyyy HH:mm') AS ketThuc,
    dd.tenDiaDiem,
    dk.trangThai,
    FORMAT(dk.thoiGianCheckin,  'dd/MM/yyyy HH:mm') AS checkin,
    FORMAT(dk.thoiGianCheckout, 'dd/MM/yyyy HH:mm') AS checkout
FROM DangKySuKien dk
JOIN SuKien sk ON dk.idSuKien = sk.idSuKien
LEFT JOIN DiaDiem dd ON sk.idDiaDiem = dd.idDiaDiem
WHERE dk.idNguoiDung = 'ND001'
ORDER BY dk.thoiGianDangKy DESC;
GO

PRINT N'=== HOÀN TẤT CẬP NHẬT DỮ LIỆU TEST ===';
PRINT N'';
PRINT N'KỊCH BẢN TEST CHECK-IN:';
PRINT N'  SK6 (Hackathon AI) — Đang diễn ra → ND001 có thể CHECK-IN NGAY';
PRINT N'  SK4 (Khởi nghiệp)  — Bắt đầu sau 25p → Cửa sổ check-in ĐÃ MỞ (T-30)';
PRINT N'  SK5 (Festival)     — Bắt đầu sau 2h → Chưa mở check-in';
PRINT N'  SK7 (Blockchain)   — Đã kết thúc → Không check-in được';
GO
