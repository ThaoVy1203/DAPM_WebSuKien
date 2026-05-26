-- DAPM_Alter_Phase35.sql
-- Giai đoạn 5: Check-out + khảo sát, auto check-out / vắng mặt
-- Giai đoạn 3/6: Trust score, deadline hủy vé theo sự kiện
-- Chạy trên DB đã có schema DAPM (SQL Server)

USE DAPM;
GO

-- ── SuKien: tham số hủy vé & khảo sát check-out ─────────────────────────────
IF COL_LENGTH('SuKien', 'gioHuyTruocBatDauPhut') IS NULL
    ALTER TABLE SuKien ADD gioHuyTruocBatDauPhut INT NOT NULL
        CONSTRAINT DF_SK_GioHuy DEFAULT 120;  -- 2 giờ trước khi bắt đầu
GO

IF COL_LENGTH('SuKien', 'yeuCauKhaoSatCheckout') IS NULL
    ALTER TABLE SuKien ADD yeuCauKhaoSatCheckout BIT NOT NULL
        CONSTRAINT DF_SK_YeuCauKS DEFAULT 1;
GO

IF COL_LENGTH('SuKien', 'daXuLyKetThuc') IS NULL
    ALTER TABLE SuKien ADD daXuLyKetThuc BIT NOT NULL
        CONSTRAINT DF_SK_DaXuLyKT DEFAULT 0;
GO

-- ── NguoiDung: điểm uy tín / khóa đăng ký ───────────────────────────────────
IF COL_LENGTH('NguoiDung', 'soVangMatLienTiep') IS NULL
    ALTER TABLE NguoiDung ADD soVangMatLienTiep INT NOT NULL
        CONSTRAINT DF_ND_SoVangMat DEFAULT 0;
GO

IF COL_LENGTH('NguoiDung', 'khoaDangKyDen') IS NULL
    ALTER TABLE NguoiDung ADD khoaDangKyDen DATETIME2 NULL;
GO

-- ── DangKySuKien: checkout tự động ───────────────────────────────────────────
IF COL_LENGTH('DangKySuKien', 'checkoutTuDong') IS NULL
    ALTER TABLE DangKySuKien ADD checkoutTuDong BIT NOT NULL
        CONSTRAINT DF_DK_CheckoutTD DEFAULT 0;
GO

-- Mở rộng CHECK trạng thái đăng ký (waitlist + hoàn thành)
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_DKSK_TrangThai')
    ALTER TABLE DangKySuKien DROP CONSTRAINT CHK_DKSK_TrangThai;
GO

ALTER TABLE DangKySuKien ADD CONSTRAINT CHK_DKSK_TrangThai CHECK (trangThai IN (
    N'Chờ xác nhận', N'Đã xác nhận', N'Đã tham gia', N'Hoàn thành',
    N'Vắng mặt', N'Đã hủy', N'Chờ chỗ', N'Chờ người dùng xác nhận'));
GO

-- ── Bảng đánh giá sau sự kiện ────────────────────────────────────────────────
IF OBJECT_ID('DangKyDanhGia', 'U') IS NULL
BEGIN
    CREATE TABLE DangKyDanhGia (
        idDanhGia      INT NOT NULL IDENTITY(1,1),
        idDangKy       INT NOT NULL,
        diem           TINYINT NOT NULL,
        nhanXet        NVARCHAR(500) NULL,
        thoiGianDanhGia DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_DangKyDanhGia PRIMARY KEY (idDanhGia),
        CONSTRAINT FK_DG_DangKy FOREIGN KEY (idDangKy) REFERENCES DangKySuKien(idDangKy),
        CONSTRAINT UQ_DG_DangKy UNIQUE (idDangKy),
        CONSTRAINT CHK_DG_Diem CHECK (diem BETWEEN 1 AND 5)
    );
END
GO

PRINT N'DAPM_Alter_Phase35.sql — hoàn tất.';
GO
