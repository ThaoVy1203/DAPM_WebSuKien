USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySuKien_DHSPKT')
    DROP DATABASE QuanLySuKien_DHSPKT;
GO

CREATE DATABASE QuanLySuKien_DHSPKT
    COLLATE Vietnamese_CI_AS;
GO

USE QuanLySuKien_DHSPKT;
GO

-- 1. BẢNG VaiTro
CREATE TABLE VaiTro (
    idVaiTro INTEGER NOT NULL IDENTITY(1,1),
    tenVaiTro NVARCHAR(50) NOT NULL,
    moTa NVARCHAR(MAX)NULL,

    CONSTRAINT PK_VaiTro PRIMARY KEY (idVaiTro)
);
GO

-- 2. BẢNG NguoiDung
CREATE TABLE NguoiDung (
    idNguoiDung CHAR(5) NOT NULL,
    maSoSSO NVARCHAR(15) NOT NULL,
    hoTen NVARCHAR(50) NOT NULL,
    email NVARCHAR(50) NOT NULL,
    SDT VARCHAR(11) NULL,
    anhDaiDien NVARCHAR(MAX) NULL,
    matKhauSSO NVARCHAR(30) NOT NULL,

    CONSTRAINT PK_NguoiDung PRIMARY KEY (idNguoiDung),
    CONSTRAINT UQ_NguoiDung_SSO UNIQUE (maSoSSO),
    CONSTRAINT UQ_NguoiDung_Email UNIQUE (email)
);
GO

-- 3. BẢNG VaiTro_NguoiDung
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
CREATE TABLE DanhMucSuKien (
    idDanhMuc INTEGER NOT NULL IDENTITY(1,1),
    tenDanhMuc NVARCHAR(50) NOT NULL,
    moTa NVARCHAR(MAX) NULL,

    CONSTRAINT PK_DanhMucSuKien PRIMARY KEY (idDanhMuc)
);
GO

-- 6. BẢNG SuKien
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
CREATE TABLE SuKien_DanhMuc (
    idSuKien INTEGER NOT NULL,
    idDanhMuc INTEGER NOT NULL,

    CONSTRAINT PK_SuKien_DanhMuc PRIMARY KEY (idSuKien, idDanhMuc),
    CONSTRAINT FK_SKDM_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT FK_SKDM_DanhMuc FOREIGN KEY (idDanhMuc) REFERENCES DanhMucSuKien(idDanhMuc)
);
GO

-- 8. BẢNG HoSoSuKien
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
CREATE TABLE DangKySuKien (
    idDangKy INTEGER NOT NULL IDENTITY(1,1),
    idSuKien INTEGER NOT NULL,
    idNguoiDung CHAR(5) NOT NULL,
    trangThai NVARCHAR(50) NOT NULL DEFAULT N'Chờ xác nhận',
    thoiGianDangKy DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    thoiGianHuy DATETIME2 NULL,
    thoiGianCheckin DATETIME2 NULL,
    thoiGianCheckout DATETIME2 NULL,

    CONSTRAINT PK_DangKySuKien PRIMARY KEY (idDangKy),
    CONSTRAINT FK_DKSK_SuKien FOREIGN KEY (idSuKien) REFERENCES SuKien(idSuKien),
    CONSTRAINT FK_DKSK_NguoiDung FOREIGN KEY (idNguoiDung) REFERENCES NguoiDung(idNguoiDung),
    CONSTRAINT UQ_DKSK UNIQUE (idSuKien, idNguoiDung),
    CONSTRAINT CHK_DKSK_TrangThai CHECK (trangThai IN (
        N'Chờ xác nhận', N'Đã xác nhận', N'Đã tham gia', N'Vắng mặt', N'Đã hủy'))
);
GO

-- 15. BẢNG ThongBao
CREATE TABLE ThongBao (
    idThongBao  INTEGER NOT NULL IDENTITY(1,1),
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

-- INDEXES
CREATE INDEX IX_NguoiDung_MaSoSSO ON NguoiDung(maSoSSO);
CREATE INDEX IX_NguoiDung_Email ON NguoiDung(email);
CREATE INDEX IX_SuKien_TrangThai ON SuKien(trangThai);
CREATE INDEX IX_SuKien_ThoiGian ON SuKien(thoiGianBatDau, thoiGianKetThuc);
CREATE INDEX IX_SuKien_NguoiTao ON SuKien(idNguoiTao);
CREATE INDEX IX_SuKien_DiaDiem ON SuKien(idDiaDiem);
CREATE INDEX IX_DKSK_SuKien ON DangKySuKien(idSuKien);
CREATE INDEX IX_DKSK_NguoiDung ON DangKySuKien(idNguoiDung);
CREATE INDEX IX_DKSK_TrangThai ON DangKySuKien(trangThai);
CREATE INDEX IX_TB_NguoiDung ON ThongBao(idNguoiDung);
CREATE INDEX IX_TB_DaDoc ON ThongBao(daDoc);
CREATE INDEX IX_HSSL_SuKien ON HoSoSuKien(idSuKien);
CREATE INDEX IX_LSPD_HoSo ON LichSuPheDuyet(idHoSo);
CREATE INDEX IX_LSPD_NguoiDuyet ON LichSuPheDuyet(idNguoiDuyet);
CREATE INDEX IX_PC_CongViec ON PhanCong(idCongViec);
CREATE INDEX IX_PC_NguoiDung ON PhanCong(idNguoiDung);
GO

-- DỮ LIỆU MẪU
-- 1. Vai trò
INSERT INTO VaiTro (tenVaiTro, moTa) VALUES
(N'Admin', N'Quản trị hệ thống toàn quyền'),
(N'NguoiThamGia', N'Sinh viên đăng ký tham gia sự kiện'),
(N'TruongBanToChuc', N'Trưởng ban tổ chức sự kiện'),
(N'ThanhVienBanToChuc', N'Thành viên ban tổ chức'),
(N'CanBoPheDuyetCap1', N'Cán bộ phê duyệt cấp 1 (Đoàn/Khoa)'),
(N'CanBoPheDuyetCap2', N'Cán bộ phê duyệt cấp 2 (P.CTSV)');
GO

-- 2. Người dùng
INSERT INTO NguoiDung (idNguoiDung, maSoSSO, hoTen, email, SDT, matKhauSSO) VALUES
('ND001', '23115053001', N'Nguyễn Văn An', 'an.nguyen@ute.udn.vn', '0901234567', 'hashed_pw_1'),
('ND002', '23115053002', N'Trần Thị Bích', 'bich.tran@ute.udn.vn', '0902345678', 'hashed_pw_2'),
('ND003', '23115053003', N'Lê Văn Cường', 'cuong.le@ute.udn.vn', '0903456789', 'hashed_pw_3'),
('ND004', 'CB001', N'ThS. Nguyễn Thị Hà', 'ha.nguyen.cb@ute.udn.vn', '0911234567', 'hashed_pw_4'),
('ND005', 'CB002', N'TS. Phạm Minh Tuấn', 'tuan.pham.cb@ute.udn.vn', '0922345678', 'hashed_pw_5'),
('AD001', 'ADMIN001', N'Admin Hệ thống', 'admin@ute.udn.vn', '0900000001', 'hashed_pw_admin');
GO

-- 3. Phân quyền
INSERT INTO VaiTro_NguoiDung (idVaiTro, idNguoiDung) VALUES
(2, 'ND001'),
(3, 'ND002'),
(4, 'ND003'),
(5, 'ND004'),
(6, 'ND005'),
(1, 'AD001');
GO

-- 4. Địa điểm
INSERT INTO DiaDiem (tenDiaDiem, viTri, sucChua, trangThaiSuDung) VALUES
(N'Hội trường A', N'Tòa nhà A, Tầng 1', 500, N'Hoạt động'),
(N'Phòng hội thảo B1', N'Tòa nhà B, Tầng 1', 80, N'Hoạt động'),
(N'Sân khấu ngoài trời', N'Khu trung tâm trường', 2000, N'Hoạt động'),
(N'Phòng 201-A',  N'Tòa nhà A, Tầng 2', 45, N'Hoạt động'),
(N'Hội trường B lớn', N'Tòa nhà B, Tầng 3', 300,  N'Bảo trì');
GO

-- 5. Danh mục sự kiện
INSERT INTO DanhMucSuKien (tenDanhMuc, moTa) VALUES
(N'Học thuật', N'Hội thảo, seminar, tọa đàm học thuật'),
(N'Tình nguyện', N'Hoạt động tình nguyện cộng đồng'),
(N'Văn nghệ thể thao', N'Sự kiện văn hóa, thể dục thể thao'),
(N'Kỹ năng mềm', N'Đào tạo kỹ năng, workshop'),
(N'Phong trào Đoàn', N'Hoạt động Đoàn – Hội sinh viên');
GO

-- 6. Sự kiện
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

-- 7. Sự kiện - Danh mục
INSERT INTO SuKien_DanhMuc (idSuKien, idDanhMuc) VALUES
(1, 1), (1, 4),
(2, 2), (2, 5),
(3, 4);
GO

-- 8. Hồ sơ sự kiện
INSERT INTO HoSoSuKien (idSuKien, noiDungKeHoach, duTruNganSach, trangThaiDuyet) VALUES
(1, N'Kế hoạch tổ chức hội thảo chuyển đổi số, gồm 3 phiên thảo luận chuyên đề', N'15,000,000 VNĐ', N'Đã duyệt cấp 2'),
(2, N'Kế hoạch tổ chức chiến dịch tình nguyện Mùa Hè Xanh 2025', N'8,000,000 VNĐ', N'Đã duyệt cấp 2'),
(3, N'Kế hoạch workshop kỹ năng thuyết trình dành cho sinh viên năm 2-3', N'2,000,000 VNĐ', N'Chờ duyệt');
GO

-- 9. Lịch sử phê duyệt
INSERT INTO LichSuPheDuyet (idHoSo, idNguoiDuyet, capDuyet, ketQua, ghiChu) VALUES
(1, 'ND004', N'Cấp 1 - Khoa', N'Đồng ý', N'Hồ sơ đầy đủ, nội dung phù hợp'),
(1, 'ND005', N'Cấp 2 - P.CTSV', N'Đồng ý', N'Phê duyệt chính thức'),
(2, 'ND004', N'Cấp 1 - Đoàn', N'Đồng ý', N'Hoạt động có ý nghĩa xã hội tốt'),
(2, 'ND005', N'Cấp 2 - P.CTSV', N'Đồng ý', N'Đồng ý tổ chức'),
(3, 'ND004', N'Cấp 1 - Khoa', N'Yêu cầu bổ sung', N'Cần bổ sung danh sách giảng viên hỗ trợ');
GO

-- 10. Ngân sách
INSERT INTO NganSachDuKien (idSuKien, tongChiPhiDuKien, chiTietNganSach, ghiChu) VALUES
(1, 15000000, 12500000, N'Bao gồm thuê hội trường, tiếp khách, in ấn tài liệu'),
(2, 8000000,  7200000,  N'Chi phí đi lại, dụng cụ, đồng phục tình nguyện viên'),
(3, 2000000,  1800000,  N'Thuê phòng, tài liệu học tập');
GO

-- 11. Công việc
INSERT INTO CongViec (tenCongViec, idSuKien, tieuDe, moTa, hanChot, trangThai) VALUES
(N'Chuẩn bị tài liệu', 1, N'In tài liệu hội thảo', N'In và đóng gói tài liệu cho đại biểu', '2025-11-14 17:00:00', N'Hoàn thành'),
(N'Trang trí sân khấu', 1, N'Setup hội trường', N'Trang trí banner, sắp xếp bàn ghế', '2025-11-15 07:00:00', N'Hoàn thành'),
(N'Quản lý đăng ký', 1, N'Xác nhận danh sách tham dự', N'Kiểm tra và xác nhận đăng ký online', '2025-11-13 17:00:00', N'Hoàn thành'),
(N'Chuẩn bị dụng cụ', 2, N'Mua sắm dụng cụ tình nguyện', N'Mua dụng cụ vệ sinh, trồng cây', '2025-07-19 17:00:00', N'Hoàn thành'),
(N'Thiết kế slides', 3, N'Làm slide workshop', N'Thiết kế nội dung bài giảng kỹ năng', '2025-12-03 17:00:00', N'Đang thực hiện');
GO

-- 12. Phân công
INSERT INTO PhanCong (idCongViec, idNguoiDung, vaiTroTrongBTC) VALUES
(1, 'ND003', N'Thành viên thực hiện'),
(2, 'ND003', N'Thành viên thực hiện'),
(3, 'ND002', N'Trưởng nhóm phụ trách'),
(4, 'ND003', N'Thành viên thực hiện'),
(5, 'ND002', N'Trưởng nhóm phụ trách');
GO

-- 13. Nhân sự BTC
INSERT INTO NguoiDung_SuKien (idNguoiDung, idSuKien, vaiTroTrongSuKien) VALUES
('ND002', 1, N'Trưởng Ban tổ chức'),
('ND003', 1, N'Thành viên'),
('ND002', 2, N'Trưởng Ban tổ chức'),
('ND003', 2, N'Thành viên'),
('ND002', 3, N'Trưởng Ban tổ chức'),
('ND003', 3, N'Thành viên');
GO

-- 14. Đăng ký sự kiện
INSERT INTO DangKySuKien (idSuKien, idNguoiDung, trangThai, thoiGianCheckin, thoiGianCheckout) VALUES
(1, 'ND001', N'Đã tham gia', '2025-11-15 08:05:00', '2025-11-15 17:10:00'),
(2, 'ND001', N'Đã tham gia', '2025-07-20 06:15:00', '2025-07-20 18:00:00'),
(3, 'ND001', N'Đã xác nhận', NULL, NULL);
GO

-- 15. Thông báo
INSERT INTO ThongBao (idNguoiDung, idSuKien, tieuDe, noiDung, daDoc) VALUES
('ND001', 1, N'Sự kiện đã được phê duyệt',
 N'Hội thảo Chuyển đổi số 2025 đã được phê duyệt. Vui lòng chuẩn bị tham dự đúng giờ.', 1),
('ND001', 3, N'Đăng ký thành công',
 N'Bạn đã đăng ký tham gia Workshop Kỹ năng thuyết trình thành công.', 0),
('ND002', 3, N'Hồ sơ cần bổ sung',
 N'Hồ sơ Workshop Kỹ năng thuyết trình yêu cầu bổ sung danh sách giảng viên hỗ trợ.', 0);
GO

-- ============================================================
-- VIEWS
-- ============================================================
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
-- STORED PROCEDURES
-- ============================================================
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

PRINT N'=== Script tạo CSDL QuanLySuKien_DHSPKT hoàn tất thành công! ===';
GO