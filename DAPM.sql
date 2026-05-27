-- ============================================================
-- FILE: DAPM_Complete.sql
-- MÔ TẢ: Script tổng hợp toàn bộ database QuanLySuKien_DHSPKT
-- BAO GỒM: Schema, dữ liệu mẫu, views, stored procedures,
--           các alter table, và dữ liệu test realtime
-- 
-- THỨ TỰ CHẠY (tự động trong script):
--   1. Tạo database (DROP nếu tồn tại)
--   2. Tạo toàn bộ tables
--   3. Tạo indexes
--   4. Chèn dữ liệu mẫu cơ bản
--   5. Tạo views
--   6. Tạo stored procedures
--   7. Alter tables (thêm cột mới)
--   8. Thêm dữ liệu test mở rộng
--   9. Cập nhật thời gian thực (realtime)
-- ============================================================

USE master;
GO

-- ============================================================
-- PHẦN 1: TẠO DATABASE (DROP NẾU TỒN TẠI)
-- ============================================================

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySuKien_DHSPKT')
BEGIN
    ALTER DATABASE QuanLySuKien_DHSPKT SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QuanLySuKien_DHSPKT;
END
GO

CREATE DATABASE QuanLySuKien_DHSPKT
    COLLATE Vietnamese_CI_AS;
GO

USE QuanLySuKien_DHSPKT;
GO

-- ============================================================
-- PHẦN 2: TẠO CÁC BẢNG
-- ============================================================

-- 1. BẢNG VaiTro
IF OBJECT_ID('VaiTro', 'U') IS NOT NULL DROP TABLE VaiTro;
GO

CREATE TABLE VaiTro (
    idVaiTro INTEGER NOT NULL IDENTITY(1,1),
    tenVaiTro NVARCHAR(50) NOT NULL,
    moTa NVARCHAR(MAX) NULL,
    CONSTRAINT PK_VaiTro PRIMARY KEY (idVaiTro)
);
GO

-- 2. BẢNG NguoiDung
IF OBJECT_ID('NguoiDung', 'U') IS NOT NULL DROP TABLE NguoiDung;
GO

CREATE TABLE NguoiDung (
    idNguoiDung CHAR(5) NOT NULL,
    maSoSSO NVARCHAR(15) NOT NULL,
    hoTen NVARCHAR(50) NOT NULL,
    email NVARCHAR(50) NOT NULL,
    SDT VARCHAR(11) NULL,
    anhDaiDien NVARCHAR(MAX) NULL,
    matKhauSSO NVARCHAR(30) NOT NULL,
    soVangMatLienTiep INT NOT NULL CONSTRAINT DF_ND_SoVangMat DEFAULT 0,
    khoaDangKyDen DATETIME2 NULL,
    CONSTRAINT PK_NguoiDung PRIMARY KEY (idNguoiDung),
    CONSTRAINT UQ_NguoiDung_SSO UNIQUE (maSoSSO),
    CONSTRAINT UQ_NguoiDung_Email UNIQUE (email)
);
GO

-- 3. BẢNG VaiTro_NguoiDung
IF OBJECT_ID('VaiTro_NguoiDung', 'U') IS NOT NULL DROP TABLE VaiTro_NguoiDung;
GO

CREATE TABLE VaiTro_NguoiDung (
    idVaiTro INTEGER NOT NULL,
    idNguoiDung CHAR(5) NOT NULL,
    trangThai BIT NOT NULL DEFAULT 1,
    thoiGianCapQuan DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_VaiTro_NguoiDung PRIMARY KEY (idVaiTro, idNguoiDung),
    CONSTRAINT FK_VTN_VaiTro FOREIGN KEY (idVaiTro) REFERENCES VaiTro(idVaiTro),
    CONSTRAINT FK_VTN_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung)
);
GO

-- 4. BẢNG DiaDiem
IF OBJECT_ID('DiaDiem', 'U') IS NOT NULL DROP TABLE DiaDiem;
GO

CREATE TABLE DiaDiem (
    idDiaDiem INTEGER NOT NULL IDENTITY(1,1),
    tenDiaDiem NVARCHAR(50) NOT NULL,
    viTri NVARCHAR(50) NULL,
    sucChua INTEGER NULL,
    trangThaiSuDung NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_DiaDiem PRIMARY KEY (idDiaDiem)
);
GO

-- 5. BẢNG DanhMucSuKien
IF OBJECT_ID('DanhMucSuKien', 'U') IS NOT NULL DROP TABLE DanhMucSuKien;
GO

CREATE TABLE DanhMucSuKien (
    idDanhMuc INTEGER NOT NULL IDENTITY(1,1),
    tenDanhMuc NVARCHAR(50) NOT NULL,
    moTa NVARCHAR(MAX) NULL,
    CONSTRAINT PK_DanhMucSuKien PRIMARY KEY (idDanhMuc)
);
GO

-- 6. BẢNG SuKien
IF OBJECT_ID('SuKien', 'U') IS NOT NULL DROP TABLE SuKien;
GO

CREATE TABLE SuKien (
    idSuKien INTEGER NOT NULL IDENTITY(1,1),
    tenSuKien NVARCHAR(50) NOT NULL,
    moTa NVARCHAR(MAX) NULL,
    thoiGianBatDau DATETIME2 NOT NULL,
    thoiGianKetThuc DATETIME2 NOT NULL,
    idDiaDiem INTEGER NULL,
    idNguoiTao CHAR(5) NOT NULL,
    soLuongToiDa INTEGER NULL,
    trangThai NVARCHAR(20) NOT NULL DEFAULT N'Nháp',
    capPheDuyet CHAR(5) NULL,
    thoiGianTao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    yeuCauXacNhan BIT NOT NULL DEFAULT 0,
    gioHuyTruocBatDauPhut INT NOT NULL CONSTRAINT DF_SK_GioHuy DEFAULT 120,
    yeuCauKhaoSatCheckout BIT NOT NULL CONSTRAINT DF_SK_YeuCauKS DEFAULT 1,
    daXuLyKetThuc BIT NOT NULL CONSTRAINT DF_SK_DaXuLyKT DEFAULT 0,
    CONSTRAINT PK_SuKien PRIMARY KEY (idSuKien),
    CONSTRAINT FK_SK_DiaDiem FOREIGN KEY (idDiaDiem) REFERENCES DiaDiem(idDiaDiem),
    CONSTRAINT FK_SK_NguoiTao FOREIGN KEY (idNguoiTao) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT CHK_SK_ThoiGian CHECK (thoiGianKetThuc > thoiGianBatDau),
    CONSTRAINT CHK_SK_TrangThai CHECK (trangThai IN (
        N'Nháp', N'Chờ duyệt', N'Đã duyệt', N'Từ chối',
        N'Đang diễn ra', N'Kết thúc', N'Hủy'))
);
GO

-- 7. BẢNG SuKien_DanhMuc
IF OBJECT_ID('SuKien_DanhMuc', 'U') IS NOT NULL DROP TABLE SuKien_DanhMuc;
GO

CREATE TABLE SuKien_DanhMuc (
    idSuKien INTEGER NOT NULL,
    idDanhMuc INTEGER NOT NULL,
    CONSTRAINT PK_SuKien_DanhMuc PRIMARY KEY (idSuKien, idDanhMuc),
    CONSTRAINT FK_SKDM_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT FK_SKDM_DanhMuc FOREIGN KEY (idDanhMuc) REFERENCES DanhMucSuKien(idDanhMuc)
);
GO

-- 8. BẢNG HoSoSuKien
IF OBJECT_ID('HoSoSuKien', 'U') IS NOT NULL DROP TABLE HoSoSuKien;
GO

CREATE TABLE HoSoSuKien (
    idHoSo INTEGER NOT NULL IDENTITY(1,1),
    idSuKien INTEGER NOT NULL,
    noiDungKeHoach NVARCHAR(MAX) NULL,
    duTruNganSach NVARCHAR(50) NULL,
    trangThaiDuyet NVARCHAR(50) NOT NULL DEFAULT N'Chờ duyệt',
    thoiGianGui DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_HoSoSuKien PRIMARY KEY (idHoSo),
    CONSTRAINT FK_HSSL_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT CHK_HSSL_TrangThai CHECK (trangThaiDuyet IN (
        N'Chờ duyệt', N'Đã duyệt cấp 1', N'Đã duyệt cấp 2', N'Từ chối'))
);
GO

-- 9. BẢNG LichSuPheDuyet
IF OBJECT_ID('LichSuPheDuyet', 'U') IS NOT NULL DROP TABLE LichSuPheDuyet;
GO

CREATE TABLE LichSuPheDuyet (
    idPheDuyet INTEGER NOT NULL IDENTITY(1,1),
    idHoSo INTEGER NOT NULL,
    idNguoiDuyet CHAR(5) NOT NULL,
    capDuyet NVARCHAR(50) NULL,
    ketQua NVARCHAR(50) NOT NULL,
    ghiChu NVARCHAR(100) NULL,
    thoiGianPheDuyet DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_LichSuPheDuyet PRIMARY KEY (idPheDuyet),
    CONSTRAINT FK_LSPD_HoSo FOREIGN KEY (idHoSo) REFERENCES HoSoSuKien(idHoSo),
    CONSTRAINT FK_LSPD_NguoiDuyet FOREIGN KEY (idNguoiDuyet) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT CHK_LSPD_KetQua CHECK (ketQua IN (N'Đồng ý', N'Từ chối', N'Yêu cầu bổ sung'))
);
GO

-- 10. BẢNG NganSachDuKien
IF OBJECT_ID('NganSachDuKien', 'U') IS NOT NULL DROP TABLE NganSachDuKien;
GO

CREATE TABLE NganSachDuKien (
    idNganSach INTEGER NOT NULL IDENTITY(1,1),
    idSuKien INTEGER NOT NULL,
    tongChiPhiDuKien DECIMAL(18,2) NULL,
    chiTietNganSach DECIMAL(18,2) NULL,
    ghiChu NVARCHAR(100) NULL,
    CONSTRAINT PK_NganSachDuKien PRIMARY KEY (idNganSach),
    CONSTRAINT FK_NSDK_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien)
);
GO

-- 11. BẢNG CongViec
IF OBJECT_ID('CongViec', 'U') IS NOT NULL DROP TABLE CongViec;
GO

CREATE TABLE CongViec (
    idCongViec INTEGER NOT NULL IDENTITY(1,1),
    tenCongViec NVARCHAR(50) NOT NULL,
    idSuKien INTEGER NOT NULL,
    tieuDe NVARCHAR(100) NULL,
    moTa NVARCHAR(100) NULL,
    hanChot DATETIME2 NULL,
    trangThai NVARCHAR(50) NOT NULL DEFAULT N'Chưa bắt đầu',
    CONSTRAINT PK_CongViec PRIMARY KEY (idCongViec),
    CONSTRAINT FK_CV_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT CHK_CV_TrangThai CHECK (trangThai IN (
        N'Chưa bắt đầu', N'Đang thực hiện', N'Hoàn thành', N'Trễ hạn'))
);
GO

-- 12. BẢNG PhanCong
IF OBJECT_ID('PhanCong', 'U') IS NOT NULL DROP TABLE PhanCong;
GO

CREATE TABLE PhanCong (
    idPhanCong INTEGER NOT NULL IDENTITY(1,1),
    idCongViec INTEGER NOT NULL,
    idNguoiDung CHAR(5) NOT NULL,
    vaiTroTrongBTC NVARCHAR(50) NULL,
    thoiGianPhanCong DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_PhanCong PRIMARY KEY (idPhanCong),
    CONSTRAINT FK_PC_CongViec FOREIGN KEY (idCongViec) REFERENCES CongViec(idCongViec),
    CONSTRAINT FK_PC_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung)
);
GO

-- 13. BẢNG NguoiDung_SuKien
IF OBJECT_ID('NguoiDung_SuKien', 'U') IS NOT NULL DROP TABLE NguoiDung_SuKien;
GO

CREATE TABLE NguoiDung_SuKien (
    idNguoiDung CHAR(5) NOT NULL,
    idSuKien INTEGER NOT NULL,
    vaiTroTrongSuKien NVARCHAR(50) NOT NULL DEFAULT N'Thành viên',
    CONSTRAINT PK_NguoiDung_SuKien PRIMARY KEY (idNguoiDung, idSuKien),
    CONSTRAINT FK_NDSK_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT FK_NDSK_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien)
);
GO

-- 14. BẢNG DangKySuKien
IF OBJECT_ID('DangKySuKien', 'U') IS NOT NULL DROP TABLE DangKySuKien;
GO

CREATE TABLE DangKySuKien (
    idDangKy INTEGER NOT NULL IDENTITY(1,1),
    idSuKien INTEGER NOT NULL,
    idNguoiDung CHAR(5) NOT NULL,
    trangThai NVARCHAR(50) NOT NULL DEFAULT N'Chờ xác nhận',
    thoiGianDangKy DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    thoiGianHuy DATETIME2 NULL,
    thoiGianCheckin DATETIME2 NULL,
    thoiGianCheckout DATETIME2 NULL,
    checkoutTuDong BIT NOT NULL CONSTRAINT DF_DK_CheckoutTD DEFAULT 0,
    CONSTRAINT PK_DangKySuKien PRIMARY KEY (idDangKy),
    CONSTRAINT FK_DKSK_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT FK_DKSK_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT UQ_DKSK UNIQUE (idSuKien, idNguoiDung),
    CONSTRAINT CHK_DKSK_TrangThai CHECK (trangThai IN (
        N'Chờ xác nhận', N'Đã xác nhận', N'Đã tham gia', N'Hoàn thành',
        N'Vắng mặt', N'Đã hủy', N'Chờ chỗ', N'Chờ người dùng xác nhận'))
);
GO

-- 15. BẢNG ThongBao
IF OBJECT_ID('ThongBao', 'U') IS NOT NULL DROP TABLE ThongBao;
GO

CREATE TABLE ThongBao (
    idThongBao INTEGER NOT NULL IDENTITY(1,1),
    idNguoiDung CHAR(5) NOT NULL,
    idSuKien INTEGER NULL,
    tieuDe NVARCHAR(100) NOT NULL,
    noiDung NVARCHAR(MAX) NULL,
    daDoc BIT NOT NULL DEFAULT 0,
    thoiGianGui DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_ThongBao PRIMARY KEY (idThongBao),
    CONSTRAINT FK_TB_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT FK_TB_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien)
);
GO

-- 16. BẢNG DangKyDanhGia (đánh giá sau sự kiện)
IF OBJECT_ID('DangKyDanhGia', 'U') IS NOT NULL DROP TABLE DangKyDanhGia;
GO

CREATE TABLE DangKyDanhGia (
    idDanhGia INT NOT NULL IDENTITY(1,1),
    idDangKy INT NOT NULL,
    diem TINYINT NOT NULL,
    nhanXet NVARCHAR(500) NULL,
    thoiGianDanhGia DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_DangKyDanhGia PRIMARY KEY (idDanhGia),
    CONSTRAINT FK_DG_DangKy FOREIGN KEY (idDangKy) REFERENCES DangKySuKien(idDangKy),
    CONSTRAINT UQ_DG_DangKy UNIQUE (idDangKy),
    CONSTRAINT CHK_DG_Diem CHECK (diem BETWEEN 1 AND 5)
);
GO

-- ============================================================
-- PHẦN 3: INDEXES
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NguoiDung_MaSoSSO')
    CREATE INDEX IX_NguoiDung_MaSoSSO ON NguoiDung(maSoSSO);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NguoiDung_Email')
    CREATE INDEX IX_NguoiDung_Email ON NguoiDung(email);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SuKien_TrangThai')
    CREATE INDEX IX_SuKien_TrangThai ON SuKien(trangThai);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SuKien_ThoiGian')
    CREATE INDEX IX_SuKien_ThoiGian ON SuKien(thoiGianBatDau, thoiGianKetThuc);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SuKien_NguoiTao')
    CREATE INDEX IX_SuKien_NguoiTao ON SuKien(idNguoiTao);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SuKien_DiaDiem')
    CREATE INDEX IX_SuKien_DiaDiem ON SuKien(idDiaDiem);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DKSK_SuKien')
    CREATE INDEX IX_DKSK_SuKien ON DangKySuKien(idSuKien);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DKSK_NguoiDung')
    CREATE INDEX IX_DKSK_NguoiDung ON DangKySuKien(idNguoiDung);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DKSK_TrangThai')
    CREATE INDEX IX_DKSK_TrangThai ON DangKySuKien(trangThai);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TB_NguoiDung')
    CREATE INDEX IX_TB_NguoiDung ON ThongBao(idNguoiDung);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TB_DaDoc')
    CREATE INDEX IX_TB_DaDoc ON ThongBao(daDoc);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HSSL_SuKien')
    CREATE INDEX IX_HSSL_SuKien ON HoSoSuKien(idSuKien);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LSPD_HoSo')
    CREATE INDEX IX_LSPD_HoSo ON LichSuPheDuyet(idHoSo);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LSPD_NguoiDuyet')
    CREATE INDEX IX_LSPD_NguoiDuyet ON LichSuPheDuyet(idNguoiDuyet);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PC_CongViec')
    CREATE INDEX IX_PC_CongViec ON PhanCong(idCongViec);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PC_NguoiDung')
    CREATE INDEX IX_PC_NguoiDung ON PhanCong(idNguoiDung);
GO

-- ============================================================
-- PHẦN 4: DỮ LIỆU MẪU CƠ BẢN
-- ============================================================

-- 4.1 Vai trò
INSERT INTO VaiTro (tenVaiTro, moTa) VALUES
(N'Admin', N'Quản trị hệ thống toàn quyền'),
(N'NguoiThamGia', N'Sinh viên đăng ký tham gia sự kiện'),
(N'TruongBanToChuc', N'Trưởng ban tổ chức sự kiện'),
(N'ThanhVienBanToChuc', N'Thành viên ban tổ chức'),
(N'CanBoPheDuyetCap1', N'Cán bộ phê duyệt cấp 1 (Đoàn/Khoa)'),
(N'CanBoPheDuyetCap2', N'Cán bộ phê duyệt cấp 2 (P.CTSV)');
GO

-- 4.2 Người dùng
INSERT INTO NguoiDung (idNguoiDung, maSoSSO, hoTen, email, SDT, matKhauSSO) VALUES
('ND001', '23115053001', N'Nguyễn Văn An',      'an.nguyen@ute.udn.vn',      '0901234567', 'sv123'),
('ND002', '23115053002', N'Trần Thị Bích',       'bich.tran@ute.udn.vn',      '0902345678', 'btc123'),
('ND003', '23115053003', N'Lê Văn Cường',        'cuong.le@ute.udn.vn',       '0903456789', 'btc123'),
('ND004', 'CB001',       N'ThS. Nguyễn Thị Hà',  'ha.nguyen.cb@ute.udn.vn',   '0911234567', 'cb123'),
('ND005', 'CB002',       N'TS. Phạm Minh Tuấn',  'tuan.pham.cb@ute.udn.vn',   '0922345678', 'cb123'),
('AD001', 'ADMIN001',    N'Admin Hệ thống',       'admin@ute.udn.vn',          '0900000001', 'admin123');
GO

-- 4.3 Phân quyền
INSERT INTO VaiTro_NguoiDung (idVaiTro, idNguoiDung) VALUES
(2, 'ND001'),
(3, 'ND002'),
(4, 'ND003'),
(5, 'ND004'),
(6, 'ND005'),
(1, 'AD001');
GO

-- 4.4 Địa điểm
INSERT INTO DiaDiem (tenDiaDiem, viTri, sucChua, trangThaiSuDung) VALUES
(N'Hội trường A', N'Tòa nhà A, Tầng 1', 500, N'Hoạt động'),
(N'Phòng hội thảo B1', N'Tòa nhà B, Tầng 1', 80, N'Hoạt động'),
(N'Sân khấu ngoài trời', N'Khu trung tâm trường', 2000, N'Hoạt động'),
(N'Phòng 201-A',  N'Tòa nhà A, Tầng 2', 45, N'Hoạt động'),
(N'Hội trường B lớn', N'Tòa nhà B, Tầng 3', 300,  N'Bảo trì');
GO

-- 4.5 Danh mục sự kiện
INSERT INTO DanhMucSuKien (tenDanhMuc, moTa) VALUES
(N'Học thuật', N'Hội thảo, seminar, tọa đàm học thuật'),
(N'Tình nguyện', N'Hoạt động tình nguyện cộng đồng'),
(N'Văn nghệ thể thao', N'Sự kiện văn hóa, thể dục thể thao'),
(N'Kỹ năng mềm', N'Đào tạo kỹ năng, workshop'),
(N'Phong trào Đoàn', N'Hoạt động Đoàn – Hội sinh viên');
GO

-- 4.6 Sự kiện cơ bản
INSERT INTO SuKien (tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc, idDiaDiem, idNguoiTao, soLuongToiDa, trangThai, capPheDuyet) VALUES
(
    N'Hội thảo Chuyển đổi số 2025',
    N'Hội thảo về xu hướng chuyển đổi số trong giáo dục đại học',
    '2025-11-15 08:00:00', '2025-11-15 17:00:00',
    1, 'ND002', 300, N'Đã duyệt', 'ND005'
),
(
    N'Ngày hội Tình nguyện Mùa Hè Xanh',
    N'Chiến dịch tình nguyện hè hỗ trợ cộng đồng',
    '2025-07-20 06:00:00', '2025-07-25 18:00:00',
    3, 'ND002', 500, N'Đã duyệt', 'ND005'
),
(
    N'Workshop Kỹ năng thuyết trình chuyên nghiệp',
    N'Rèn luyện kỹ năng thuyết trình và giao tiếp',
    '2025-12-05 13:30:00', '2025-12-05 17:00:00',
    2, 'ND003', 80, N'Chờ duyệt', NULL
);
GO

-- 4.7 Sự kiện - Danh mục
INSERT INTO SuKien_DanhMuc (idSuKien, idDanhMuc) VALUES
(1, 1), (1, 4),
(2, 2), (2, 5),
(3, 4);
GO

-- 4.8 Hồ sơ sự kiện
INSERT INTO HoSoSuKien (idSuKien, noiDungKeHoach, duTruNganSach, trangThaiDuyet) VALUES
(1, N'Kế hoạch tổ chức hội thảo chuyển đổi số, gồm 3 phiên thảo luận chuyên đề', N'15,000,000 VNĐ', N'Đã duyệt cấp 2'),
(2, N'Kế hoạch tổ chức chiến dịch tình nguyện Mùa Hè Xanh 2025', N'8,000,000 VNĐ', N'Đã duyệt cấp 2'),
(3, N'Kế hoạch workshop kỹ năng thuyết trình dành cho sinh viên năm 2-3', N'2,000,000 VNĐ', N'Chờ duyệt');
GO

-- 4.9 Lịch sử phê duyệt
INSERT INTO LichSuPheDuyet (idHoSo, idNguoiDuyet, capDuyet, ketQua, ghiChu) VALUES
(1, 'ND004', N'Cấp 1 - Khoa', N'Đồng ý', N'Hồ sơ đầy đủ, nội dung phù hợp'),
(1, 'ND005', N'Cấp 2 - P.CTSV', N'Đồng ý', N'Phê duyệt chính thức'),
(2, 'ND004', N'Cấp 1 - Đoàn', N'Đồng ý', N'Hoạt động có ý nghĩa xã hội tốt'),
(2, 'ND005', N'Cấp 2 - P.CTSV', N'Đồng ý', N'Đồng ý tổ chức'),
(3, 'ND004', N'Cấp 1 - Khoa', N'Yêu cầu bổ sung', N'Cần bổ sung danh sách giảng viên hỗ trợ');
GO

-- 4.10 Ngân sách
INSERT INTO NganSachDuKien (idSuKien, tongChiPhiDuKien, chiTietNganSach, ghiChu) VALUES
(1, 15000000, 12500000, N'Bao gồm thuê hội trường, tiếp khách, in ấn tài liệu'),
(2, 8000000,  7200000,  N'Chi phí đi lại, dụng cụ, đồng phục tình nguyện viên'),
(3, 2000000,  1800000,  N'Thuê phòng, tài liệu học tập');
GO

-- 4.11 Công việc
INSERT INTO CongViec (tenCongViec, idSuKien, tieuDe, moTa, hanChot, trangThai) VALUES
(N'Chuẩn bị tài liệu', 1, N'In tài liệu hội thảo', N'In và đóng gói tài liệu cho đại biểu', '2025-11-14 17:00:00', N'Hoàn thành'),
(N'Trang trí sân khấu', 1, N'Setup hội trường', N'Trang trí banner, sắp xếp bàn ghế', '2025-11-15 07:00:00', N'Hoàn thành'),
(N'Quản lý đăng ký', 1, N'Xác nhận danh sách tham dự', N'Kiểm tra và xác nhận đăng ký online', '2025-11-13 17:00:00', N'Hoàn thành'),
(N'Chuẩn bị dụng cụ', 2, N'Mua sắm dụng cụ tình nguyện', N'Mua dụng cụ vệ sinh, trồng cây', '2025-07-19 17:00:00', N'Hoàn thành'),
(N'Thiết kế slides', 3, N'Làm slide workshop', N'Thiết kế nội dung bài giảng kỹ năng', '2025-12-03 17:00:00', N'Đang thực hiện');
GO

-- 4.12 Phân công
INSERT INTO PhanCong (idCongViec, idNguoiDung, vaiTroTrongBTC) VALUES
(1, 'ND003', N'Thành viên thực hiện'),
(2, 'ND003', N'Thành viên thực hiện'),
(3, 'ND002', N'Trưởng nhóm phụ trách'),
(4, 'ND003', N'Thành viên thực hiện'),
(5, 'ND002', N'Trưởng nhóm phụ trách');
GO

-- 4.13 Nhân sự BTC
INSERT INTO NguoiDung_SuKien (idNguoiDung, idSuKien, vaiTroTrongSuKien) VALUES
('ND002', 1, N'Trưởng Ban tổ chức'),
('ND003', 1, N'Thành viên'),
('ND002', 2, N'Trưởng Ban tổ chức'),
('ND003', 2, N'Thành viên'),
('ND002', 3, N'Trưởng Ban tổ chức'),
('ND003', 3, N'Thành viên');
GO

-- 4.14 Đăng ký sự kiện cơ bản
INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianCheckin, thoiGianCheckout) VALUES
(1, 'ND001', N'Đã tham gia', '2025-11-15 08:05:00', '2025-11-15 17:10:00'),
(2, 'ND001', N'Đã tham gia', '2025-07-20 06:15:00', '2025-07-20 18:00:00'),
(3, 'ND001', N'Đã xác nhận', NULL, NULL);
GO

-- 4.15 Thông báo cơ bản
INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung, daDoc) VALUES
('ND001', 1, N'Sự kiện đã được phê duyệt',
 N'Hội thảo Chuyển đổi số 2025 đã được phê duyệt. Vui lòng chuẩn bị tham dự đúng giờ.', 1),
('ND001', 3, N'Đăng ký thành công',
 N'Bạn đã đăng ký tham gia Workshop Kỹ năng thuyết trình thành công.', 0),
('ND002', 3, N'Hồ sơ cần bổ sung',
 N'Hồ sơ Workshop Kỹ năng thuyết trình yêu cầu bổ sung danh sách giảng viên hỗ trợ.', 0);
GO

-- ============================================================
-- PHẦN 5: VIEWS
-- ============================================================

IF OBJECT_ID('vw_SuKienDayDu', 'V') IS NOT NULL DROP VIEW vw_SuKienDayDu;
GO

CREATE VIEW vw_SuKienDayDu AS
SELECT
    sk.idSuKien, sk.tenSuKien, sk.moTa,
    sk.thoiGianBatDau, sk.thoiGianKetThuc,
    sk.soLuongToiDa, sk.trangThai, sk.thoiGianTao,
    dd.tenDiaDiem, dd.viTri,
    nd.hoTen  AS tenNguoiTao,
    nd.email  AS emailNguoiTao,
    COUNT(DISTINCT dksk.idDangKy) AS soDaDangKy
FROM SuKien sk
LEFT JOIN DiaDiem dd ON sk.idDiaDiem  = dd.idDiaDiem
LEFT JOIN NguoiDung nd ON sk.idNguoiTao = nd.idNguoiDung
LEFT JOIN DangKySuKien dksk ON sk.idSuKien = dksk.idSuKien
    AND dksk.trangThai NOT IN (N'Đã hủy')
GROUP BY
    sk.idSuKien, sk.tenSuKien, sk.moTa,
    sk.thoiGianBatDau, sk.thoiGianKetThuc,
    sk.soLuongToiDa, sk.trangThai, sk.thoiGianTao,
    dd.tenDiaDiem, dd.viTri, nd.hoTen, nd.email;
GO

IF OBJECT_ID('vw_ThongKeThamGia', 'V') IS NOT NULL DROP VIEW vw_ThongKeThamGia;
GO

CREATE VIEW vw_ThongKeThamGia AS
SELECT
    sk.idSuKien,
    sk.tenSuKien,
    COUNT(CASE WHEN dksk.trangThai = N'Đã xác nhận' THEN 1 END) AS soDaXacNhan,
    COUNT(CASE WHEN dksk.trangThai = N'Đã tham gia' THEN 1 END) AS soDaThamGia,
    COUNT(CASE WHEN dksk.trangThai = N'Vắng mặt' THEN 1 END) AS soVangMat,
    COUNT(CASE WHEN dksk.trangThai = N'Đã hủy' THEN 1 END) AS soHuyDangKy,
    COUNT(dksk.idDangKy) AS tongDangKy,
    sk.soLuongToiDa,
    CASE
        WHEN sk.soLuongToiDa IS NULL OR sk.soLuongToiDa = 0 THEN NULL
        ELSE CAST(
            COUNT(CASE WHEN dksk.trangThai != N'Đã hủy' THEN 1 END) * 100.0
            / sk.soLuongToiDa AS DECIMAL(5,2))
    END AS tiLeLayDo
FROM SuKien sk
LEFT JOIN DangKySuKien dksk ON sk.idSuKien = dksk.idSuKien
GROUP BY sk.idSuKien, sk.tenSuKien, sk.soLuongToiDa;
GO

IF OBJECT_ID('vw_LichSuThamGia', 'V') IS NOT NULL DROP VIEW vw_LichSuThamGia;
GO

CREATE VIEW vw_LichSuThamGia AS
SELECT
    nd.idNguoiDung, nd.hoTen, nd.maSoSSO,
    sk.idSuKien, sk.tenSuKien,
    sk.thoiGianBatDau, sk.thoiGianKetThuc,
    dd.tenDiaDiem,
    dksk.trangThai, dksk.thoiGianDangKy,
    dksk.thoiGianCheckin, dksk.thoiGianCheckout
FROM DangKySuKien dksk
JOIN NguoiDung nd ON dksk.idNguoiDung = nd.idNguoiDung
JOIN SuKien sk ON dksk.idSuKien = sk.idSuKien
LEFT JOIN DiaDiem dd ON sk.idDiaDiem = dd.idDiaDiem;
GO

-- ============================================================
-- PHẦN 6: STORED PROCEDURES
-- ============================================================

IF OBJECT_ID('sp_DangKySuKien', 'P') IS NOT NULL DROP PROCEDURE sp_DangKySuKien;
GO

CREATE PROCEDURE sp_DangKySuKien
    @idSuKien INTEGER,
    @idNguoiDung CHAR(5),
    @ketQua NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM SuKien
        WHERE idSuKien = @idSuKien AND trangThai = N'Đã duyệt'
    )
    BEGIN
        SET @ketQua = N'Sự kiện không tồn tại hoặc chưa được phê duyệt.';
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM DangKySuKien
        WHERE idSuKien = @idSuKien AND idNguoiDung = @idNguoiDung
          AND trangThai != N'Đã hủy'
    )
    BEGIN
        SET @ketQua = N'Bạn đã đăng ký sự kiện này rồi.';
        RETURN;
    END

    DECLARE @soLuongToiDa INTEGER;
    DECLARE @soDaDangKy INTEGER;

    SELECT @soLuongToiDa = soLuongToiDa FROM SuKien WHERE idSuKien = @idSuKien;
    SELECT @soDaDangKy = COUNT(*) FROM DangKySuKien
    WHERE idSuKien = @idSuKien AND trangThai NOT IN (N'Đã hủy');

    IF @soLuongToiDa IS NOT NULL AND @soDaDangKy >= @soLuongToiDa
    BEGIN
        SET @ketQua = N'Sự kiện đã đủ số lượng đăng ký.';
        RETURN;
    END

    INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai)
    VALUES (@idSuKien, @idNguoiDung, N'Đã xác nhận');

    DECLARE @tenSuKien NVARCHAR(50);
    SELECT @tenSuKien = tenSuKien FROM SuKien WHERE idSuKien = @idSuKien;

    INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung)
    VALUES (
        @idNguoiDung, @idSuKien,
        N'Đăng ký sự kiện thành công',
        N'Bạn đã đăng ký tham gia "' + @tenSuKien + N'" thành công. Vui lòng check-in đúng giờ.'
    );

    SET @ketQua = N'Đăng ký thành công.';
END;
GO

IF OBJECT_ID('sp_CheckInSuKien', 'P') IS NOT NULL DROP PROCEDURE sp_CheckInSuKien;
GO

CREATE PROCEDURE sp_CheckInSuKien
    @idSuKien    INTEGER,
    @idNguoiDung CHAR(5),
    @ketQua      NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM DangKySuKien
        WHERE idSuKien = @idSuKien AND idNguoiDung = @idNguoiDung
          AND trangThai = N'Đã xác nhận'
    )
    BEGIN
        SET @ketQua = N'Không tìm thấy đăng ký hợp lệ hoặc đã check-in rồi.';
        RETURN;
    END

    UPDATE DangKySuKien
    SET trangThai = N'Đã tham gia', thoiGianCheckin = SYSDATETIME()
    WHERE idSuKien = @idSuKien AND idNguoiDung = @idNguoiDung;

    SET @ketQua = N'Check-in thành công. Chào mừng bạn đến sự kiện!';
END;
GO

IF OBJECT_ID('sp_HuyDangKy', 'P') IS NOT NULL DROP PROCEDURE sp_HuyDangKy;
GO

CREATE PROCEDURE sp_HuyDangKy
    @idSuKien INTEGER,
    @idNguoiDung CHAR(5),
    @ketQua NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @trangThai NVARCHAR(50);
    SELECT @trangThai = trangThai FROM DangKySuKien
    WHERE idSuKien = @idSuKien AND idNguoiDung = @idNguoiDung;

    IF @trangThai IS NULL
    BEGIN
        SET @ketQua = N'Không tìm thấy đăng ký.';
        RETURN;
    END

    IF @trangThai IN (N'Đã tham gia', N'Đã hủy')
    BEGIN
        SET @ketQua = N'Không thể hủy đăng ký ở trạng thái hiện tại.';
        RETURN;
    END

    UPDATE DangKySuKien
    SET trangThai = N'Đã hủy', thoiGianHuy = SYSDATETIME()
    WHERE idSuKien = @idSuKien AND idNguoiDung = @idNguoiDung;

    SET @ketQua = N'Hủy đăng ký thành công.';
END;
GO

-- ============================================================
-- PHẦN 7: DỮ LIỆU TEST MỞ RỘNG (sinh viên + sự kiện)
-- ============================================================

-- 7.1 Thêm sinh viên test
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

INSERT INTO VaiTro_NguoiDung (idVaiTro, idNguoiDung) VALUES
(2, 'ND006'), (2, 'ND007'), (2, 'ND008'),
(2, 'ND009'), (2, 'ND010'), (2, 'ND011'), (2, 'ND012');
GO

-- 7.2 Thêm sự kiện mở rộng (SK4-SK10)
DELETE FROM DangKySuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM ThongBao WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM SuKien_DanhMuc WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM NguoiDung_SuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM HoSoSuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM CongViec WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM NganSachDuKien WHERE idSuKien BETWEEN 4 AND 10;
DELETE FROM SuKien WHERE idSuKien BETWEEN 4 AND 10;
GO

INSERT INTO SuKien (tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc, idDiaDiem, idNguoiTao, soLuongToiDa, trangThai, capPheDuyet) VALUES
(
    N'Ngày hội Khởi nghiệp UTE 2026',
    N'Sự kiện kết nối sinh viên với các nhà đầu tư và mentor khởi nghiệp.',
    '2026-06-15 08:00:00', '2026-06-15 17:00:00',
    1, 'ND002', 200, N'Đã duyệt', 'ND005'
),
(
    N'Festival Văn hóa Các Dân tộc 2026',
    N'Lễ hội văn hóa đặc sắc với các tiết mục nghệ thuật, ẩm thực và trò chơi dân gian.',
    '2026-06-20 14:00:00', '2026-06-20 21:00:00',
    3, 'ND002', 1000, N'Đã duyệt', 'ND005'
),
(
    N'Hackathon AI 24h - UTE 2026',
    N'Cuộc thi lập trình 24 giờ liên tục với chủ đề Trí tuệ Nhân tạo.',
    '2026-05-25 08:00:00', '2026-05-26 08:00:00',
    2, 'ND003', 120, N'Đang diễn ra', 'ND005'
),
(
    N'Hội thảo Blockchain & Web3 cho Sinh viên',
    N'Tìm hiểu về công nghệ Blockchain, NFT và tương lai của Web3.',
    '2026-04-10 09:00:00', '2026-04-10 12:00:00',
    2, 'ND002', 80, N'Kết thúc', 'ND005'
),
(
    N'Workshop Thiết kế UI/UX Nâng cao',
    N'Workshop thực hành thiết kế giao diện người dùng với Figma.',
    '2026-07-01 13:30:00', '2026-07-01 17:30:00',
    4, 'ND003', 5, N'Đã duyệt', 'ND005'
),
(
    N'Cuộc thi Robotics UTE Cup 2026',
    N'Cuộc thi chế tạo robot tự động với các thử thách thực tế.',
    '2026-08-15 08:00:00', '2026-08-16 17:00:00',
    3, 'ND002', 60, N'Chờ duyệt', NULL
),
(
    N'Seminar Kỹ năng Phỏng vấn & Tìm việc làm',
    N'Chia sẻ kinh nghiệm phỏng vấn từ HR các công ty lớn.',
    '2026-06-28 08:30:00', '2026-06-28 11:30:00',
    1, 'ND002', 300, N'Đã duyệt', 'ND005'
);
GO

-- 7.3 Hồ sơ sự kiện mở rộng
INSERT INTO HoSoSuKien (idSuKien, noiDungKeHoach, duTruNganSach, trangThaiDuyet)
SELECT idSuKien,
    CASE idSuKien
        WHEN 4 THEN N'Kế hoạch tổ chức ngày hội khởi nghiệp với 20 gian hàng startup'
        WHEN 5 THEN N'Kế hoạch tổ chức festival văn hóa ngoài trời với 15 tiết mục'
        WHEN 6 THEN N'Kế hoạch tổ chức hackathon 24h với 30 đội tham dự'
        WHEN 7 THEN N'Kế hoạch hội thảo blockchain với 3 diễn giả chuyên gia'
        WHEN 8 THEN N'Kế hoạch workshop UI/UX với giảng viên từ doanh nghiệp'
        WHEN 9 THEN N'Kế hoạch cuộc thi robotics với 20 đội tham dự'
        WHEN 10 THEN N'Kế hoạch seminar phỏng vấn với 5 HR từ các công ty lớn'
    END,
    CASE idSuKien
        WHEN 4 THEN N'25,000,000 VNĐ'
        WHEN 5 THEN N'30,000,000 VNĐ'
        WHEN 6 THEN N'20,000,000 VNĐ'
        WHEN 7 THEN N'5,000,000 VNĐ'
        WHEN 8 THEN N'3,000,000 VNĐ'
        WHEN 9 THEN N'15,000,000 VNĐ'
        WHEN 10 THEN N'8,000,000 VNĐ'
    END,
    CASE trangThai
        WHEN N'Đã duyệt' THEN N'Đã duyệt cấp 2'
        WHEN N'Đang diễn ra' THEN N'Đã duyệt cấp 2'
        WHEN N'Kết thúc' THEN N'Đã duyệt cấp 2'
        WHEN N'Chờ duyệt' THEN N'Chờ duyệt'
        ELSE N'Đã duyệt cấp 2'
    END
FROM SuKien WHERE idSuKien BETWEEN 4 AND 10;
GO

-- 7.4 Danh mục sự kiện mở rộng
INSERT INTO SuKien_DanhMuc (idSuKien, idDanhMuc) VALUES
(4, 4), (4, 5),
(5, 3), (5, 5),
(6, 1), (6, 4),
(7, 1),
(8, 4),
(9, 1), (9, 4),
(10, 4);
GO

-- 7.5 BTC sự kiện mở rộng
INSERT INTO NguoiDung_SuKien (idNguoiDung, idSuKien, vaiTroTrongSuKien) VALUES
('ND002', 4, N'Trưởng Ban tổ chức'),
('ND003', 4, N'Thành viên'),
('ND002', 5, N'Trưởng Ban tổ chức'),
('ND003', 5, N'Thành viên'),
('ND003', 6, N'Trưởng Ban tổ chức'),
('ND002', 6, N'Thành viên'),
('ND002', 7, N'Trưởng Ban tổ chức'),
('ND003', 7, N'Thành viên'),
('ND003', 8, N'Trưởng Ban tổ chức'),
('ND002', 9, N'Trưởng Ban tổ chức'),
('ND002', 10, N'Trưởng Ban tổ chức'),
('ND003', 10, N'Thành viên');
GO

-- 7.6 Đăng ký sự kiện mở rộng
DELETE FROM DangKySuKien WHERE idNguoiDung IN ('ND006','ND007','ND008','ND009','ND010','ND011','ND012');
DELETE FROM DangKySuKien WHERE idNguoiDung = 'ND001' AND idSuKien BETWEEN 4 AND 10;
GO

INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianDangKy, thoiGianCheckin, thoiGianCheckout) VALUES
(4, 'ND001', N'Đã xác nhận', '2026-05-01 09:00:00', NULL, NULL),
(5, 'ND001', N'Đã xác nhận', '2026-05-02 10:00:00', NULL, NULL),
(6, 'ND001', N'Đã tham gia', '2026-05-20 08:00:00', '2026-05-25 08:10:00', NULL),
(7, 'ND001', N'Đã tham gia', '2026-03-15 14:00:00', '2026-04-10 09:05:00', '2026-04-10 12:15:00'),
(10, 'ND001', N'Đã hủy', '2026-05-10 11:00:00', NULL, NULL),
(4, 'ND006', N'Đã xác nhận', '2026-05-03 08:30:00', NULL, NULL),
(5, 'ND006', N'Đã xác nhận', '2026-05-03 08:35:00', NULL, NULL),
(6, 'ND006', N'Đã tham gia', '2026-05-20 09:00:00', '2026-05-25 08:15:00', '2026-05-25 20:00:00'),
(7, 'ND006', N'Đã tham gia', '2026-03-20 10:00:00', '2026-04-10 09:10:00', '2026-04-10 12:00:00'),
(10, 'ND006', N'Đã xác nhận', '2026-05-15 09:00:00', NULL, NULL),
(4, 'ND007', N'Đã xác nhận', '2026-05-04 10:00:00', NULL, NULL),
(6, 'ND007', N'Vắng mặt', '2026-05-21 11:00:00', NULL, NULL),
(7, 'ND007', N'Đã tham gia', '2026-03-25 09:00:00', '2026-04-10 09:20:00', '2026-04-10 11:50:00'),
(10, 'ND007', N'Đã xác nhận', '2026-05-16 10:00:00', NULL, NULL),
(5, 'ND008', N'Đã xác nhận', '2026-05-05 09:00:00', NULL, NULL),
(6, 'ND008', N'Đã tham gia', '2026-05-22 08:00:00', '2026-05-25 08:20:00', '2026-05-25 19:30:00'),
(7, 'ND008', N'Đã tham gia', '2026-03-28 14:00:00', '2026-04-10 09:15:00', '2026-04-10 12:05:00'),
(10, 'ND008', N'Đã xác nhận', '2026-05-17 11:00:00', NULL, NULL),
(8, 'ND009', N'Đã xác nhận', '2026-05-10 08:00:00', NULL, NULL),
(4, 'ND009', N'Đã xác nhận', '2026-05-10 08:05:00', NULL, NULL),
(10, 'ND009', N'Đã hủy', '2026-05-11 09:00:00', NULL, NULL),
(8, 'ND010', N'Đã xác nhận', '2026-05-11 09:00:00', NULL, NULL),
(5, 'ND010', N'Đã xác nhận', '2026-05-11 09:05:00', NULL, NULL),
(7, 'ND010', N'Đã tham gia', '2026-04-01 10:00:00', '2026-04-10 09:25:00', '2026-04-10 11:45:00'),
(8, 'ND011', N'Đã xác nhận', '2026-05-12 10:00:00', NULL, NULL),
(6, 'ND011', N'Đã tham gia', '2026-05-23 08:00:00', '2026-05-25 08:30:00', NULL),
(10, 'ND011', N'Đã xác nhận', '2026-05-18 08:00:00', NULL, NULL),
(8, 'ND012', N'Đã xác nhận', '2026-05-13 11:00:00', NULL, NULL),
(4, 'ND012', N'Đã xác nhận', '2026-05-13 11:05:00', NULL, NULL),
(5, 'ND012', N'Đã xác nhận', '2026-05-13 11:10:00', NULL, NULL);
GO

-- 7.7 Thông báo mở rộng
INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung, daDoc, thoiGianGui) VALUES
('ND001', 4, N'Đăng ký thành công', N'Bạn đã đăng ký tham gia "Ngày hội Khởi nghiệp UTE 2026".', 1, '2026-05-01 09:00:00'),
('ND001', 5, N'Đăng ký thành công', N'Bạn đã đăng ký tham gia "Festival Văn hóa Các Dân tộc 2026".', 0, '2026-05-02 10:00:00'),
('ND001', 6, N'Check-in thành công', N'Bạn đã check-in thành công tại "Hackathon AI 24h - UTE 2026".', 0, '2026-05-25 08:10:00'),
('ND001', 7, N'Cảm ơn đã tham gia', N'Cảm ơn bạn đã tham gia "Hội thảo Blockchain & Web3".', 1, '2026-04-10 12:15:00'),
('ND001', 10, N'Hủy đăng ký thành công', N'Bạn đã hủy đăng ký "Seminar Kỹ năng Phỏng vấn".', 0, '2026-05-10 11:00:00'),
('ND006', 6, N'Check-out thành công', N'Bạn đã check-out thành công tại "Hackathon AI 24h".', 0, '2026-05-25 20:00:00'),
('ND007', 6, N'Thông báo vắng mặt', N'Bạn đã không check-in tại "Hackathon AI 24h".', 0, '2026-05-26 09:00:00');
GO

-- ============================================================
-- PHẦN 8: CẬP NHẬT THỜI GIAN THỰC (REALTIME)
-- ============================================================

DECLARE @now_realtime DATETIME2 = SYSDATETIME();
DECLARE @today_realtime DATE = CAST(@now_realtime AS DATE);

-- Cập nhật SK4-SK10 theo thời gian thực
UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 14, CAST(@today_realtime AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 14, CAST(@today_realtime AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 4;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 14, DATEADD(day, 21, CAST(@today_realtime AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 21, DATEADD(day, 21, CAST(@today_realtime AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 5;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, -2, @now_realtime),
    thoiGianKetThuc = DATEADD(hour, 6, @now_realtime),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 6;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 9,  DATEADD(day, -3, CAST(@today_realtime AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 12, DATEADD(day, -3, CAST(@today_realtime AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 7;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 13, DATEADD(day, 30, CAST(@today_realtime AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 17, DATEADD(day, 30, CAST(@today_realtime AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 8;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(day, 60, @now_realtime),
    thoiGianKetThuc = DATEADD(day, 61, @now_realtime),
    trangThai       = N'Chờ duyệt'
WHERE idSuKien = 9;

UPDATE SuKien SET
    thoiGianBatDau  = DATEADD(hour, 8,  DATEADD(day, 10, CAST(@today_realtime AS DATETIME2))),
    thoiGianKetThuc = DATEADD(hour, 11, DATEADD(day, 10, CAST(@today_realtime AS DATETIME2))),
    trangThai       = N'Đã duyệt'
WHERE idSuKien = 10;

-- Cập nhật đăng ký ND001 cho SK6
UPDATE DangKySuKien SET
    trangThai        = N'Đã xác nhận',
    thoiGianCheckin  = NULL,
    thoiGianCheckout = NULL
WHERE idSuKien = 6 AND idNguoiDung = 'ND001';
GO

-- ============================================================
-- PHẦN 9: THÔNG TIN KIỂM TRA VÀ KẾT LUẬN
-- ============================================================

PRINT N'=== DATABASE QuanLySuKien_DHSPKT HOÀN TẤT ===';
PRINT N'';
PRINT N'=== THÔNG TIN TÀI KHOẢN ===';
PRINT N'  ND001 / sv123 — Sinh viên (tài khoản test chính)';
PRINT N'  ND002 / btc123 — Trưởng BTC';
PRINT N'  ND003 / btc123 — Thành viên BTC';
PRINT N'  ND004 / cb123 — Cán bộ phê duyệt cấp 1';
PRINT N'  ND005 / cb123 — Cán bộ phê duyệt cấp 2';
PRINT N'  AD001 / admin123 — Admin hệ thống';
PRINT N'';
PRINT N'=== SỰ KIỆN CHÍNH ĐỂ TEST ===';
PRINT N'  SK4 — Ngày hội Khởi nghiệp (Đã duyệt, tương lai) → Đăng ký được';
PRINT N'  SK5 — Festival Văn hóa (Đã duyệt, tương lai) → Đăng ký được';
PRINT N'  SK6 — Hackathon AI (Đang diễn ra) → Check-in được';
PRINT N'  SK7 — Hội thảo Blockchain (Kết thúc) → Xem lịch sử';
PRINT N'  SK8 — Workshop UI/UX (5 chỗ, đã có 4 đăng ký) → Sắp hết chỗ';
PRINT N'  SK9 — Robotics (Chờ duyệt) → Không đăng ký được';
PRINT N'  SK10 — Seminar Phỏng vấn (Đã duyệt) → Đăng ký được';
PRINT N'';
PRINT N'=== GH CHÚ ===';
PRINT N'  Script đã tích hợp đầy đủ: schema, dữ liệu mẫu, views,';
PRINT N'  stored procedures, alter tables, test data, và realtime.';
PRINT N'  Có thể chạy lại script này bất cứ lúc nào để reset database.';
GO

PRINT N'=== Script tạo CSDL QuanLySuKien_DHSPKT hoàn tất thành công! ===';
GO

SELECT * FROM VaiTro;
SELECT * FROM NguoiDung;
SELECT * FROM VaiTro_NguoiDung
SELECT * FROM DiaDiem;
SELECT * FROM DanhMucSuKien;
SELECT * FROM SuKien
SELECT * FROM SuKien_DanhMuc
SELECT * FROM HoSoSuKien
SELECT * FROM LichSuPheDuyet
SELECT * FROM NganSachDuKien
SELECT * FROM CongViec
SELECT * FROM PhanCong
SELECT * FROM NguoiDung_SuKien
SELECT * FROM DangKySuKien
SELECT * FROM ThongBao
-- ============================================================
-- KIỂM TRA VIEWS
-- ============================================================

PRINT N'=== KIỂM TRA VIEWS ===';
PRINT N'';

-- View 1: Sự kiện đầy đủ
PRINT N'VIEW 1: vw_SuKienDayDu';
SELECT * FROM vw_SuKienDayDu;
PRINT N'';

-- View 2: Thống kê tham gia
PRINT N'VIEW 2: vw_ThongKeThamGia';
SELECT * FROM vw_ThongKeThamGia;
PRINT N'';

-- View 3: Lịch sử tham gia
PRINT N'VIEW 3: vw_LichSuThamGia';
SELECT * FROM vw_LichSuThamGia;
PRINT N'';

-- ============================================================
-- THỐNG KÊ TỔNG QUAN
-- ============================================================

PRINT N'=== THỐNG KÊ TỔNG QUAN ===';
PRINT N'';

PRINT N'Tổng số bản ghi trong các bảng:';
SELECT 
    'VaiTro' AS BangDuLieu, COUNT(*) AS SoLuong FROM VaiTro
UNION ALL SELECT 'NguoiDung', COUNT(*) FROM NguoiDung
UNION ALL SELECT 'VaiTro_NguoiDung', COUNT(*) FROM VaiTro_NguoiDung
UNION ALL SELECT 'DiaDiem', COUNT(*) FROM DiaDiem
UNION ALL SELECT 'DanhMucSuKien', COUNT(*) FROM DanhMucSuKien
UNION ALL SELECT 'SuKien', COUNT(*) FROM SuKien
UNION ALL SELECT 'SuKien_DanhMuc', COUNT(*) FROM SuKien_DanhMuc
UNION ALL SELECT 'HoSoSuKien', COUNT(*) FROM HoSoSuKien
UNION ALL SELECT 'LichSuPheDuyet', COUNT(*) FROM LichSuPheDuyet
UNION ALL SELECT 'NganSachDuKien', COUNT(*) FROM NganSachDuKien
UNION ALL SELECT 'CongViec', COUNT(*) FROM CongViec
UNION ALL SELECT 'PhanCong', COUNT(*) FROM PhanCong
UNION ALL SELECT 'NguoiDung_SuKien', COUNT(*) FROM NguoiDung_SuKien
UNION ALL SELECT 'DangKySuKien', COUNT(*) FROM DangKySuKien
UNION ALL SELECT 'ThongBao', COUNT(*) FROM ThongBao;

PRINT N'';
PRINT N'=== HOÀN TẤT KIỂM TRA DỮ LIỆU ===';
GO