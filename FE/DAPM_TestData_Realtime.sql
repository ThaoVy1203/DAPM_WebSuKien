-- ============================================================
-- DAPM_TestData_Realtime.sql
-- Dữ liệu mẫu theo THỜI GIAN THỰC (SYSDATETIME)
-- Chạy SAU: DAPM.sql và (khuyến nghị) DAPM_TestData.sql
--
-- Kịch bản chính (SK 11–20):
--   Đang diễn ra | Cửa sổ check-in T-30 | Sắp tới | Vừa kết thúc
--   Vắng mặt | Đã tham gia (CI/CO) | Chờ xác nhận | Đã hủy | Hết chỗ
--
-- Chạy LẠI file này bất cứ lúc nào để căn lại theo giờ hiện tại.
-- ============================================================

USE QuanLySuKien_DHSPKT;
GO

-- Dọn SK 11–25
DELETE FROM DangKySuKien WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM ThongBao WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM SuKien_DanhMuc WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM NguoiDung_SuKien WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM CongViec WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM NganSachDuKien WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM HoSoSuKien WHERE idSuKien BETWEEN 11 AND 25;
DELETE FROM SuKien WHERE idSuKien BETWEEN 11 AND 25;
GO

-- Toàn bộ thao tác dùng @now trong MỘT batch
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);

PRINT N'=== DAPM Test Data Realtime ===';
PRINT N'Thời điểm: ' + CONVERT(NVARCHAR(30), @now, 120);

-- Cập nhật SK 4–10 (nếu đã có từ DAPM_TestData.sql)
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 14, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 14, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 4;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 14, DATEADD(day, 21, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 21, DATEADD(day, 21, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 5;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, -2, @now),
    thoiGianKetThuc = DATEADD(hour, 6, @now),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 6;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 9,  DATEADD(day, -3, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 12, DATEADD(day, -3, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 7;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 13, DATEADD(day, 30, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 30, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 8;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(day, 60, @now),
    thoiGianKetThuc = DATEADD(day, 61, @now),
    trangThai       = N'Chờ duyệt'
WHERE idSuKien = 9;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 10, CAST(@today AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 11, DATEADD(day, 10, CAST(@today AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 10;

UPDATE DangKySuKien SET
    thoiGianDangKy   = DATEADD(day, -5, @now),
    thoiGianCheckin  = DATEADD(hour, -1, @now),
    thoiGianCheckout = NULL,
    trangThai        = N'Đã tham gia'
WHERE idSuKien = 6 AND idNguoiDung = 'ND001';

-- Sự kiện 11–20
INSERT INTO SuKien (tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc, idDiaDiem, idNguoiTao, soLuongToiDa, trangThai, capPheDuyet) VALUES
(
    N'[LIVE] Hội thảo Chuyển đổi số UTE — Phiên chiều',
    N'Đang diễn ra. Test tab Đang diễn ra + QR check-in.',
    DATEADD(hour, -2, @now), DATEADD(hour, 4, @now),
    1, 'ND002', 250, N'Đã duyệt', 'ND005'
),
(
    N'[T-30] Workshop IoT & Nhúng — Check-in đã mở',
    N'Bắt đầu sau ~20 phút. Cửa sổ check-in (T-30) đã mở.',
    DATEADD(minute, 20, @now), DATEADD(hour, 3, @now),
    2, 'ND003', 80, N'Đã duyệt', 'ND005'
),
(
    N'Ngày hội Việc làm CNTT 2026',
    N'Sắp tới — tab Đã đăng ký.',
    DATEADD(hour, 8, DATEADD(day, 2, CAST(@today AS DATETIME2))),
    DATEADD(hour, 17, DATEADD(day, 2, CAST(@today AS DATETIME2))),
    1, 'ND002', 400, N'Đã duyệt', 'ND005'
),
(
    N'[LIVE] Seminar Kỹ năng Thuyết trình',
    N'Vừa bắt đầu 15 phút trước.',
    DATEADD(minute, -15, @now), DATEADD(hour, 2, @now),
    4, 'ND002', 120, N'Đã duyệt', 'ND005'
),
(
    N'[Vừa kết thúc] Meetup Startup UTE',
    N'Kết thúc 2 giờ trước — test Vắng mặt.',
    DATEADD(hour, -5, @now), DATEADD(hour, -2, @now),
    3, 'ND003', 100, N'Đã duyệt', 'ND005'
),
(
    N'[Lịch sử] Festival Âm nhạc Sinh viên',
    N'Đã kết thúc — check-in + check-out đầy đủ.',
    DATEADD(hour, 18, DATEADD(day, -1, CAST(@today AS DATETIME2))),
    DATEADD(hour, 22, DATEADD(day, -1, CAST(@today AS DATETIME2))),
    3, 'ND002', 500, N'Đã duyệt', 'ND005'
),
(
    N'[Lịch sử] Hội thảo An toàn Thông tin',
    N'Kết thúc 5 ngày trước — nhiều vắng mặt.',
    DATEADD(hour, 9, DATEADD(day, -5, CAST(@today AS DATETIME2))),
    DATEADD(hour, 13, DATEADD(day, -5, CAST(@today AS DATETIME2))),
    2, 'ND002', 150, N'Đã duyệt', 'ND005'
),
(
    N'Cuộc thi Thiết kế Poster Khoa',
    N'Mix Chờ xác nhận / Đã xác nhận.',
    DATEADD(day, 5, @now), DATEADD(hour, 5, DATEADD(day, 5, @now)),
    1, 'ND003', 60, N'Đã duyệt', 'ND005'
),
(
    N'[FULL] Phòng lab AI — 5 chỗ',
    N'Đủ 5 đăng ký — test hết chỗ.',
    DATEADD(day, 7, @now), DATEADD(hour, 3, DATEADD(day, 7, @now)),
    4, 'ND003', 5, N'Đã duyệt', 'ND005'
),
(
    N'[LIVE] Hackathon Mini 6h',
    N'Đang diễn ra — đã check-in, chưa check-out.',
    DATEADD(hour, -1, @now), DATEADD(hour, 5, @now),
    2, 'ND003', 100, N'Đã duyệt', 'ND005'
);

INSERT INTO HoSoSuKien (idSuKien, noiDungKeHoach, duTruNganSach, trangThaiDuyet)
SELECT idSuKien, N'Kế hoạch test realtime', N'10,000,000 VNĐ', N'Đã duyệt cấp 2'
FROM SuKien WHERE idSuKien BETWEEN 11 AND 20;

INSERT INTO SuKien_DanhMuc (idSuKien, idDanhMuc) VALUES
(11,1),(11,4),(12,1),(12,4),(13,4),(14,4),(15,4),(16,3),(17,1),(18,3),(19,1),(20,1),(20,4);

INSERT INTO NguoiDung_SuKien (idNguoiDung, idSuKien, vaiTroTrongSuKien) VALUES
('ND002',11,N'Trưởng Ban tổ chức'),('ND003',11,N'Thành viên'),
('ND003',12,N'Trưởng Ban tổ chức'),('ND002',12,N'Thành viên'),
('ND002',13,N'Trưởng Ban tổ chức'),('ND002',14,N'Trưởng Ban tổ chức'),
('ND003',15,N'Trưởng Ban tổ chức'),('ND002',16,N'Trưởng Ban tổ chức'),
('ND002',17,N'Trưởng Ban tổ chức'),('ND003',18,N'Trưởng Ban tổ chức'),
('ND003',19,N'Trưởng Ban tổ chức'),('ND003',20,N'Trưởng Ban tổ chức');

DELETE FROM DangKySuKien WHERE idSuKien BETWEEN 11 AND 20
    AND idNguoiDung IN ('ND001','ND006','ND007','ND008','ND009','ND010','ND011','ND012');

INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianDangKy, thoiGianCheckin, thoiGianCheckout, thoiGianHuy) VALUES
-- ND001 (sv123)
(11, 'ND001', N'Đã xác nhận',  DATEADD(day, -3, @now), NULL, NULL, NULL),
(12, 'ND001', N'Đã xác nhận',  DATEADD(day, -2, @now), NULL, NULL, NULL),
(13, 'ND001', N'Đã xác nhận',  DATEADD(day, -1, @now), NULL, NULL, NULL),
(14, 'ND001', N'Đã tham gia',  DATEADD(day, -2, @now), DATEADD(minute, -10, @now), NULL, NULL),
(15, 'ND001', N'Vắng mặt',     DATEADD(day, -4, @now), NULL, NULL, NULL),
(16, 'ND001', N'Đã tham gia',  DATEADD(day, -3, @now),
    DATEADD(hour, 18, DATEADD(day, -1, CAST(@today AS DATETIME2))),
    DATEADD(hour, 21, DATEADD(day, -1, CAST(@today AS DATETIME2))), NULL),
(17, 'ND001', N'Vắng mặt',     DATEADD(day, -8, @now), NULL, NULL, NULL),
(18, 'ND001', N'Chờ xác nhận', DATEADD(day, -1, @now), NULL, NULL, NULL),
(19, 'ND001', N'Đã hủy',       DATEADD(day, -2, @now), NULL, NULL, DATEADD(day, -1, @now)),
(20, 'ND001', N'Đã tham gia',  DATEADD(day, -2, @now), DATEADD(minute, -45, @now), NULL, NULL),
-- ND006–ND012
(11, 'ND006', N'Đã xác nhận',  DATEADD(day, -2, @now), NULL, NULL, NULL),
(12, 'ND006', N'Đã xác nhận',  DATEADD(day, -2, @now), NULL, NULL, NULL),
(20, 'ND006', N'Đã tham gia',  DATEADD(day, -1, @now), DATEADD(minute, -30, @now), DATEADD(minute, -5, @now), NULL),
(15, 'ND007', N'Vắng mặt',     DATEADD(day, -5, @now), NULL, NULL, NULL),
(17, 'ND007', N'Vắng mặt',     DATEADD(day, -7, @now), NULL, NULL, NULL),
(16, 'ND007', N'Đã tham gia',  DATEADD(day, -2, @now),
    DATEADD(hour, 18, DATEADD(day, -1, CAST(@today AS DATETIME2))),
    DATEADD(hour, 21, DATEADD(day, -1, CAST(@today AS DATETIME2))), NULL),
(13, 'ND007', N'Đã xác nhận',  DATEADD(day, -1, @now), NULL, NULL, NULL),
(14, 'ND008', N'Đã tham gia',  DATEADD(day, -1, @now), DATEADD(minute, -12, @now), NULL, NULL),
(20, 'ND008', N'Đã tham gia',  DATEADD(day, -1, @now), DATEADD(minute, -50, @now), NULL, NULL),
(18, 'ND008', N'Đã xác nhận',  DATEADD(hour, -6, @now), NULL, NULL, NULL),
(19, 'ND009', N'Đã xác nhận', DATEADD(day, -3, @now), NULL, NULL, NULL),
(19, 'ND010', N'Đã xác nhận', DATEADD(day, -3, @now), NULL, NULL, NULL),
(19, 'ND011', N'Đã xác nhận', DATEADD(day, -3, @now), NULL, NULL, NULL),
(19, 'ND012', N'Đã xác nhận', DATEADD(day, -3, @now), NULL, NULL, NULL),
(19, 'ND006', N'Đã xác nhận', DATEADD(day, -3, @now), NULL, NULL, NULL),
(18, 'ND009', N'Chờ xác nhận', DATEADD(hour, -12, @now), NULL, NULL, NULL),
(18, 'ND010', N'Chờ xác nhận', DATEADD(hour, -10, @now), NULL, NULL, NULL);

INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung, daDoc, thoiGianGui) VALUES
('ND001', 11, N'Đăng ký đã xác nhận', N'Sự kiện đang diễn ra — check-in ngay.', 0, DATEADD(day, -3, @now)),
('ND001', 12, N'QR check-in', N'Cửa sổ check-in (T-30) đã mở.', 0, DATEADD(hour, -1, @now)),
('ND001', 15, N'Vắng mặt', N'Không check-in tại Meetup Startup.', 0, DATEADD(hour, -1, @now)),
('ND001', 16, N'Cảm ơn đã tham gia', N'Đã hoàn tất check-out Festival.', 1, DATEADD(day, -1, @now)),
('ND007', 17, N'Vắng mặt', N'Ghi nhận vắng mặt Hội thảo An toàn Thông tin.', 0, DATEADD(day, -4, @now));

PRINT N'';
PRINT N'--- Sự kiện realtime (11-20) ---';
SELECT
    idSuKien,
    LEFT(tenSuKien, 50) AS tenSuKien,
    thoiGianBatDau,
    thoiGianKetThuc,
    CASE
        WHEN @now BETWEEN thoiGianBatDau AND thoiGianKetThuc THEN N'ĐANG DIỄN RA'
        WHEN @now BETWEEN DATEADD(minute, -30, thoiGianBatDau) AND thoiGianKetThuc
             AND @now < thoiGianBatDau THEN N'CỬA SỔ T-30'
        WHEN thoiGianBatDau > @now THEN N'Sắp tới'
        ELSE N'Đã qua'
    END AS phanLoai
FROM SuKien
WHERE idSuKien BETWEEN 11 AND 20
ORDER BY thoiGianBatDau;

PRINT N'';
PRINT N'--- Vé ND001 ---';
SELECT dk.idDangKy, LEFT(sk.tenSuKien, 40) AS suKien, dk.trangThai, sk.thoiGianBatDau
FROM DangKySuKien dk
JOIN SuKien sk ON dk.idSuKien = sk.idSuKien
WHERE dk.idNguoiDung = 'ND001' AND dk.idSuKien >= 6
ORDER BY sk.thoiGianBatDau DESC;

PRINT N'';
PRINT N'=== HOÀN TẤT — ND001/sv123 | Chạy lại file để căn giờ ===';
GO
