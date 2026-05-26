-- ============================================================
-- FILE: DAPM_TestData.sql
-- MỤC ĐÍCH: Thêm dữ liệu mẫu phong phú để test chức năng
--           Đăng ký sự kiện + Check-in/Check-out QR
-- CHẠY SAU: DAPM.sql (database đã tồn tại)
-- ============================================================

USE QuanLySuKien_DHSPKT;
GO

-- ============================================================
-- BƯỚC 1: THÊM NGƯỜI DÙNG MẪU (sinh viên để test đăng ký)
-- ============================================================
-- Xóa nếu đã tồn tại để tránh lỗi khi chạy lại
DELETE FROM VaiTro_NguoiDung WHERE idNguoiDung IN ('ND006','ND007','ND008','ND009','ND010','ND011','ND012');
DELETE FROM NguoiDung WHERE idNguoiDung IN ('ND006','ND007','ND008','ND009','ND010','ND011','ND012');
GO

INSERT INTO NguoiDung (idNguoiDung, maSoSSO, hoTen, email, SDT, matKhauSSO) VALUES
('ND006', '23115053006', N'Phạm Thị Dung',       'dung.pham@ute.udn.vn',      '0906789012', 'sv123'),
('ND007', '23115053007', N'Hoàng Văn Em',         'em.hoang@ute.udn.vn',       '0907890123', 'sv123'),
('ND008', '22115053008', N'Vũ Thị Phương',        'phuong.vu@ute.udn.vn',      '0908901234', 'sv123'),
('ND009', '22115053009', N'Đặng Minh Quân',       'quan.dang@ute.udn.vn',      '0909012345', 'sv123'),
('ND010', '21115053010', N'Bùi Thị Hoa',          'hoa.bui@ute.udn.vn',        '0910123456', 'sv123'),
('ND011', '21115053011', N'Ngô Văn Khải',         'khai.ngo@ute.udn.vn',       '0911234568', 'sv123'),
('ND012', '20115053012', N'Lý Thị Lan',           'lan.ly@ute.udn.vn',         '0912345679', 'sv123');
GO

-- Gán vai trò NguoiThamGia (idVaiTro = 2) cho tất cả sinh viên mới
INSERT INTO VaiTro_NguoiDung (idVaiTro, idNguoiDung) VALUES
(2, 'ND006'), (2, 'ND007'), (2, 'ND008'),
(2, 'ND009'), (2, 'ND010'), (2, 'ND011'), (2, 'ND012');
GO

-- ============================================================
-- BƯỚC 2: THÊM SỰ KIỆN MẪU (đa dạng trạng thái, thời gian)
-- ============================================================
-- Xóa sự kiện test cũ nếu có (idSuKien 4-10)
DELETE FROM DangKySuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM ThongBao WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM SuKien_DanhMuc WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM NguoiDung_SuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM HoSoSuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM CongViec WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM NganSachDuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM SuKien WHERE idSuKien BETWEEN 4 AND 10;
GO

-- Reset identity nếu cần (chỉ khi idSuKien 4-10 đã bị xóa)
-- DBCC CHECKIDENT ('SuKien', RESEED, 3);

INSERT INTO SuKien (tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc, idDiaDiem, idNguoiTao, soLuongToiDa, trangThai, capPheDuyet) VALUES
-- SK4: Đã duyệt, sắp diễn ra (tương lai gần) — để test đăng ký mới
(
    N'Ngày hội Khởi nghiệp UTE 2026',
    N'Sự kiện kết nối sinh viên với các nhà đầu tư và mentor khởi nghiệp. Cơ hội pitch ý tưởng và nhận tài trợ.',
    '2026-06-15 08:00:00', '2026-06-15 17:00:00',
    1, 'ND002', 200, N'Đã duyệt', 'ND005'
),
-- SK5: Đã duyệt, sắp diễn ra — để test đăng ký + check-in
(
    N'Festival Văn hóa Các Dân tộc 2026',
    N'Lễ hội văn hóa đặc sắc với các tiết mục nghệ thuật, ẩm thực và trò chơi dân gian từ 54 dân tộc Việt Nam.',
    '2026-06-20 14:00:00', '2026-06-20 21:00:00',
    3, 'ND002', 1000, N'Đã duyệt', 'ND005'
),
-- SK6: Đã duyệt, đang diễn ra — để test check-in ngay
(
    N'Hackathon AI 24h - UTE 2026',
    N'Cuộc thi lập trình 24 giờ liên tục với chủ đề Trí tuệ Nhân tạo. Giải thưởng lên đến 50 triệu đồng.',
    '2026-05-25 08:00:00', '2026-05-26 08:00:00',
    2, 'ND003', 120, N'Đang diễn ra', 'ND005'
),
-- SK7: Đã duyệt, đã kết thúc — để test lịch sử
(
    N'Hội thảo Blockchain & Web3 cho Sinh viên',
    N'Tìm hiểu về công nghệ Blockchain, NFT và tương lai của Web3 trong ngành kỹ thuật.',
    '2026-04-10 09:00:00', '2026-04-10 12:00:00',
    2, 'ND002', 80, N'Kết thúc', 'ND005'
),
-- SK8: Đã duyệt, sắp diễn ra, SỐ LƯỢNG HẠN CHẾ (5 chỗ) — để test hết chỗ
(
    N'Workshop Thiết kế UI/UX Nâng cao',
    N'Workshop thực hành thiết kế giao diện người dùng với Figma và các công cụ hiện đại.',
    '2026-07-01 13:30:00', '2026-07-01 17:30:00',
    4, 'ND003', 5, N'Đã duyệt', 'ND005'
),
-- SK9: Chờ duyệt — để test không thể đăng ký
(
    N'Cuộc thi Robotics UTE Cup 2026',
    N'Cuộc thi chế tạo robot tự động với các thử thách thực tế trong môi trường công nghiệp.',
    '2026-08-15 08:00:00', '2026-08-16 17:00:00',
    3, 'ND002', 60, N'Chờ duyệt', NULL
),
-- SK10: Đã duyệt, sắp diễn ra — thêm đăng ký đa dạng trạng thái
(
    N'Seminar Kỹ năng Phỏng vấn & Tìm việc làm',
    N'Chia sẻ kinh nghiệm phỏng vấn từ HR các công ty lớn: FPT, Viettel, Samsung, Bosch.',
    '2026-06-28 08:30:00', '2026-06-28 11:30:00',
    1, 'ND002', 300, N'Đã duyệt', 'ND005'
);
GO

-- Hồ sơ sự kiện cho các SK mới
INSERT INTO HoSoSuKien (idSuKien, noiDungKeHoach, duTruNganSach, trangThaiDuyet)
SELECT idSuKien,
    CASE idSuKien
        WHEN 4  THEN N'Kế hoạch tổ chức ngày hội khởi nghiệp với 20 gian hàng startup'
        WHEN 5  THEN N'Kế hoạch tổ chức festival văn hóa ngoài trời với 15 tiết mục'
        WHEN 6  THEN N'Kế hoạch tổ chức hackathon 24h với 30 đội tham dự'
        WHEN 7  THEN N'Kế hoạch hội thảo blockchain với 3 diễn giả chuyên gia'
        WHEN 8  THEN N'Kế hoạch workshop UI/UX với giảng viên từ doanh nghiệp'
        WHEN 9  THEN N'Kế hoạch cuộc thi robotics với 20 đội tham dự'
        WHEN 10 THEN N'Kế hoạch seminar phỏng vấn với 5 HR từ các công ty lớn'
    END,
    CASE idSuKien
        WHEN 4  THEN N'25,000,000 VNĐ'
        WHEN 5  THEN N'30,000,000 VNĐ'
        WHEN 6  THEN N'20,000,000 VNĐ'
        WHEN 7  THEN N'5,000,000 VNĐ'
        WHEN 8  THEN N'3,000,000 VNĐ'
        WHEN 9  THEN N'15,000,000 VNĐ'
        WHEN 10 THEN N'8,000,000 VNĐ'
    END,
    CASE trangThai
        WHEN N'Đã duyệt'      THEN N'Đã duyệt cấp 2'
        WHEN N'Đang diễn ra'  THEN N'Đã duyệt cấp 2'
        WHEN N'Kết thúc'      THEN N'Đã duyệt cấp 2'
        WHEN N'Chờ duyệt'     THEN N'Chờ duyệt'
        ELSE N'Đã duyệt cấp 2'
    END
FROM SuKien WHERE idSuKien BETWEEN 4 AND 10;
GO

-- Danh mục sự kiện
INSERT INTO SuKien_DanhMuc (idSuKien, idDanhMuc) VALUES
(4, 4), (4, 5),   -- Khởi nghiệp: Kỹ năng mềm + Phong trào Đoàn
(5, 3), (5, 5),   -- Festival: Văn nghệ + Phong trào Đoàn
(6, 1), (6, 4),   -- Hackathon: Học thuật + Kỹ năng mềm
(7, 1),           -- Blockchain: Học thuật
(8, 4),           -- UI/UX: Kỹ năng mềm
(9, 1), (9, 4),   -- Robotics: Học thuật + Kỹ năng mềm
(10, 4);          -- Seminar: Kỹ năng mềm
GO

-- BTC cho các sự kiện mới
INSERT INTO NguoiDung_SuKien (idNguoiDung, idSuKien, vaiTroTrongSuKien) VALUES
('ND002', 4,  N'Trưởng Ban tổ chức'),
('ND003', 4,  N'Thành viên'),
('ND002', 5,  N'Trưởng Ban tổ chức'),
('ND003', 5,  N'Thành viên'),
('ND003', 6,  N'Trưởng Ban tổ chức'),
('ND002', 6,  N'Thành viên'),
('ND002', 7,  N'Trưởng Ban tổ chức'),
('ND003', 7,  N'Thành viên'),
('ND003', 8,  N'Trưởng Ban tổ chức'),
('ND002', 9,  N'Trưởng Ban tổ chức'),
('ND002', 10, N'Trưởng Ban tổ chức'),
('ND003', 10, N'Thành viên');
GO

-- ============================================================
-- BƯỚC 3: ĐĂNG KÝ SỰ KIỆN MẪU — ĐA DẠNG TRẠNG THÁI
-- ============================================================
-- Xóa đăng ký cũ của các user test để tránh lỗi UNIQUE
DELETE FROM DangKySuKien WHERE idNguoiDung IN ('ND006','ND007','ND008','ND009','ND010','ND011','ND012');
-- Xóa đăng ký cũ của ND001 cho các SK mới
DELETE FROM DangKySuKien WHERE idNguoiDung = 'ND001' AND idSuKien BETWEEN 4 AND 10;
GO

INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianDangKy, thoiGianCheckin, thoiGianCheckout) VALUES

-- ND001 (tài khoản test chính sv123) — đa dạng trạng thái
(4,  'ND001', N'Đã xác nhận',  '2026-05-01 09:00:00', NULL, NULL),                                          -- Sắp check-in
(5,  'ND001', N'Đã xác nhận',  '2026-05-02 10:00:00', NULL, NULL),                                          -- Sắp check-in
(6,  'ND001', N'Đã tham gia',  '2026-05-20 08:00:00', '2026-05-25 08:10:00', NULL),                         -- Đã check-in, chưa check-out
(7,  'ND001', N'Đã tham gia',  '2026-03-15 14:00:00', '2026-04-10 09:05:00', '2026-04-10 12:15:00'),        -- Hoàn tất
(10, 'ND001', N'Đã hủy',       '2026-05-10 11:00:00', NULL, NULL),                                          -- Đã hủy

-- ND006 — đăng ký nhiều sự kiện
(4,  'ND006', N'Đã xác nhận',  '2026-05-03 08:30:00', NULL, NULL),
(5,  'ND006', N'Đã xác nhận',  '2026-05-03 08:35:00', NULL, NULL),
(6,  'ND006', N'Đã tham gia',  '2026-05-20 09:00:00', '2026-05-25 08:15:00', '2026-05-25 20:00:00'),
(7,  'ND006', N'Đã tham gia',  '2026-03-20 10:00:00', '2026-04-10 09:10:00', '2026-04-10 12:00:00'),
(10, 'ND006', N'Đã xác nhận',  '2026-05-15 09:00:00', NULL, NULL),

-- ND007 — có vắng mặt
(4,  'ND007', N'Đã xác nhận',  '2026-05-04 10:00:00', NULL, NULL),
(6,  'ND007', N'Vắng mặt',     '2026-05-21 11:00:00', NULL, NULL),
(7,  'ND007', N'Đã tham gia',  '2026-03-25 09:00:00', '2026-04-10 09:20:00', '2026-04-10 11:50:00'),
(10, 'ND007', N'Đã xác nhận',  '2026-05-16 10:00:00', NULL, NULL),

-- ND008 — chủ yếu đã tham gia
(5,  'ND008', N'Đã xác nhận',  '2026-05-05 09:00:00', NULL, NULL),
(6,  'ND008', N'Đã tham gia',  '2026-05-22 08:00:00', '2026-05-25 08:20:00', '2026-05-25 19:30:00'),
(7,  'ND008', N'Đã tham gia',  '2026-03-28 14:00:00', '2026-04-10 09:15:00', '2026-04-10 12:05:00'),
(10, 'ND008', N'Đã xác nhận',  '2026-05-17 11:00:00', NULL, NULL),

-- ND009 — đăng ký workshop (sắp hết chỗ)
(8,  'ND009', N'Đã xác nhận',  '2026-05-10 08:00:00', NULL, NULL),
(4,  'ND009', N'Đã xác nhận',  '2026-05-10 08:05:00', NULL, NULL),
(10, 'ND009', N'Đã hủy',       '2026-05-11 09:00:00', NULL, NULL),

-- ND010 — đăng ký workshop (sắp hết chỗ)
(8,  'ND010', N'Đã xác nhận',  '2026-05-11 09:00:00', NULL, NULL),
(5,  'ND010', N'Đã xác nhận',  '2026-05-11 09:05:00', NULL, NULL),
(7,  'ND010', N'Đã tham gia',  '2026-04-01 10:00:00', '2026-04-10 09:25:00', '2026-04-10 11:45:00'),

-- ND011 — đăng ký workshop (sắp hết chỗ)
(8,  'ND011', N'Đã xác nhận',  '2026-05-12 10:00:00', NULL, NULL),
(6,  'ND011', N'Đã tham gia',  '2026-05-23 08:00:00', '2026-05-25 08:30:00', NULL),  -- Check-in chưa check-out
(10, 'ND011', N'Đã xác nhận',  '2026-05-18 08:00:00', NULL, NULL),

-- ND012 — đăng ký workshop (sắp hết chỗ — chỗ thứ 4/5)
(8,  'ND012', N'Đã xác nhận',  '2026-05-13 11:00:00', NULL, NULL),
(4,  'ND012', N'Đã xác nhận',  '2026-05-13 11:05:00', NULL, NULL),
(5,  'ND012', N'Đã xác nhận',  '2026-05-13 11:10:00', NULL, NULL);
GO

-- ============================================================
-- BƯỚC 4: THÔNG BÁO MẪU
-- ============================================================
-- Thêm thông báo đăng ký cho các user
INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung, daDoc, thoiGianGui) VALUES
('ND001', 4,  N'Đăng ký thành công', N'Bạn đã đăng ký tham gia "Ngày hội Khởi nghiệp UTE 2026". Vui lòng check-in đúng giờ.', 1, '2026-05-01 09:00:00'),
('ND001', 5,  N'Đăng ký thành công', N'Bạn đã đăng ký tham gia "Festival Văn hóa Các Dân tộc 2026". Vui lòng check-in đúng giờ.', 0, '2026-05-02 10:00:00'),
('ND001', 6,  N'Check-in thành công', N'Bạn đã check-in thành công tại "Hackathon AI 24h - UTE 2026". Chúc bạn thi đấu tốt!', 0, '2026-05-25 08:10:00'),
('ND001', 7,  N'Cảm ơn đã tham gia', N'Cảm ơn bạn đã tham gia "Hội thảo Blockchain & Web3". Hy vọng gặp lại bạn ở sự kiện tiếp theo!', 1, '2026-04-10 12:15:00'),
('ND001', 10, N'Hủy đăng ký thành công', N'Bạn đã hủy đăng ký "Seminar Kỹ năng Phỏng vấn". Bạn có thể đăng ký lại nếu còn chỗ.', 0, '2026-05-10 11:00:00'),
('ND006', 6,  N'Check-out thành công', N'Bạn đã check-out thành công tại "Hackathon AI 24h". Cảm ơn bạn đã tham gia!', 0, '2026-05-25 20:00:00'),
('ND007', 6,  N'Thông báo vắng mặt', N'Bạn đã không check-in tại "Hackathon AI 24h". Nếu có lý do, vui lòng liên hệ BTC.', 0, '2026-05-26 09:00:00');
GO

-- ============================================================
-- BƯỚC 5: KIỂM TRA KẾT QUẢ
-- ============================================================
PRINT N'=== KIỂM TRA DỮ LIỆU TEST ===';
GO

-- Tổng đăng ký theo sự kiện
SELECT
    sk.idSuKien,
    sk.tenSuKien,
    sk.trangThai AS trangThaiSuKien,
    sk.soLuongToiDa,
    COUNT(dk.idDangKy) AS tongDangKy,
    COUNT(CASE WHEN dk.trangThai = N'Đã xác nhận' THEN 1 END) AS daXacNhan,
    COUNT(CASE WHEN dk.trangThai = N'Đã tham gia' THEN 1 END) AS daThamGia,
    COUNT(CASE WHEN dk.trangThai = N'Vắng mặt'    THEN 1 END) AS vangMat,
    COUNT(CASE WHEN dk.trangThai = N'Đã hủy'      THEN 1 END) AS daHuy
FROM SuKien sk
LEFT JOIN DangKySuKien dk ON sk.idSuKien = dk.idSuKien
WHERE sk.idSuKien BETWEEN 4 AND 10
GROUP BY sk.idSuKien, sk.tenSuKien, sk.trangThai, sk.soLuongToiDa
ORDER BY sk.idSuKien;
GO

-- Lịch sử đăng ký của ND001 (tài khoản test chính)
PRINT N'--- Lịch sử ND001 (sv123) ---';
SELECT
    dk.idDangKy,
    sk.tenSuKien,
    dk.trangThai,
    dk.thoiGianDangKy,
    dk.thoiGianCheckin,
    dk.thoiGianCheckout
FROM DangKySuKien dk
JOIN SuKien sk ON dk.idSuKien = sk.idSuKien
WHERE dk.idNguoiDung = 'ND001'
ORDER BY dk.thoiGianDangKy DESC;
GO

-- Workshop còn bao nhiêu chỗ (SK8 - giới hạn 5)
PRINT N'--- Workshop UI/UX (SK8) - Kiểm tra chỗ trống ---';
SELECT
    sk.tenSuKien,
    sk.soLuongToiDa,
    COUNT(dk.idDangKy) AS daDangKy,
    sk.soLuongToiDa - COUNT(dk.idDangKy) AS conLai
FROM SuKien sk
LEFT JOIN DangKySuKien dk ON sk.idSuKien = dk.idSuKien AND dk.trangThai != N'Đã hủy'
WHERE sk.idSuKien = 8
GROUP BY sk.tenSuKien, sk.soLuongToiDa;
GO

PRINT N'=== HOÀN TẤT THÊM DỮ LIỆU TEST ===';
PRINT N'';
PRINT N'TÀI KHOẢN TEST:';
PRINT N'  ND001 / sv123 — Sinh viên (có đủ các trạng thái đăng ký)';
PRINT N'  ND006 / sv123 — Sinh viên (đăng ký nhiều sự kiện)';
PRINT N'  ND007 / sv123 — Sinh viên (có vắng mặt)';
PRINT N'  ND002 / btc123 — Trưởng BTC';
PRINT N'  AD001 / admin123 — Admin';
PRINT N'';
PRINT N'SỰ KIỆN TEST:';
PRINT N'  SK4  — Ngày hội Khởi nghiệp (Đã duyệt, tương lai) → Đăng ký được';
PRINT N'  SK5  — Festival Văn hóa (Đã duyệt, tương lai) → Đăng ký được';
PRINT N'  SK6  — Hackathon AI (Đang diễn ra) → Check-in được';
PRINT N'  SK7  — Hội thảo Blockchain (Kết thúc) → Xem lịch sử';
PRINT N'  SK8  — Workshop UI/UX (Đã duyệt, 5 chỗ, đã có 4 đăng ký) → Sắp hết chỗ';
PRINT N'  SK9  — Robotics (Chờ duyệt) → Không đăng ký được';
PRINT N'  SK10 — Seminar Phỏng vấn (Đã duyệt) → Đăng ký được';
GO
