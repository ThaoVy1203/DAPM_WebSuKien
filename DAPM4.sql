-- ============================================================
-- FILE: DAPM_AlterTable.sql
-- MỤC ĐÍCH: Thêm cột yeuCauXacNhan vào bảng SuKien
--           (cột này được thêm vào C# model nhưng chưa có trong DB)
-- CHẠY FILE NÀY TRƯỚC KHI KHỞI ĐỘNG BACKEND
-- ============================================================

USE QuanLySuKien_DHSPKT;
GO

-- Thêm cột yeuCauXacNhan nếu chưa có
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('SuKien')
    AND name = 'yeuCauXacNhan'
)
BEGIN
    ALTER TABLE SuKien
    ADD yeuCauXacNhan BIT NOT NULL DEFAULT 0;
    PRINT N'✅ Đã thêm cột yeuCauXacNhan vào bảng SuKien';
END
ELSE
BEGIN
    PRINT N'ℹ️ Cột yeuCauXacNhan đã tồn tại';
END
GO

-- Kiểm tra kết quả
SELECT
    c.name AS column_name,
    t.name AS data_type,
    c.is_nullable,
    dc.definition AS default_value
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
WHERE c.object_id = OBJECT_ID('SuKien')
ORDER BY c.column_id;
GO

-- Kiểm tra dữ liệu sự kiện có đầy đủ ngày giờ và địa điểm không
SELECT
    sk.idSuKien,
    sk.tenSuKien,
    sk.trangThai,
    FORMAT(sk.thoiGianBatDau,  'dd/MM/yyyy HH:mm') AS batDau,
    FORMAT(sk.thoiGianKetThuc, 'dd/MM/yyyy HH:mm') AS ketThuc,
    dd.tenDiaDiem,
    dd.viTri,
    sk.yeuCauXacNhan
FROM SuKien sk
LEFT JOIN DiaDiem dd ON sk.idDiaDiem = dd.idDiaDiem
ORDER BY sk.idSuKien;
GO

PRINT N'=== HOÀN TẤT ===';
PRINT N'Sau khi chạy file này, hãy RESTART Backend để EF Core nhận cột mới.';
GO
