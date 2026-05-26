USE QuanLySuKien_DHSPKT;
GO

-- Bước 1: Thêm vai trò GiangVien nếu chưa có
IF NOT EXISTS (SELECT 1 FROM VaiTro WHERE tenVaiTro = 'GiangVien')
BEGIN
    INSERT INTO VaiTro (tenVaiTro, moTa)
    VALUES ('GiangVien', N'Giảng viên trường');
    PRINT N'Đã thêm vai trò GiangVien';
END
ELSE
    PRINT N'Vai trò GiangVien đã tồn tại';
GO

-- Bước 2: Xem idVaiTro của GiangVien
DECLARE @idVaiTroGV INT;
SELECT @idVaiTroGV = idVaiTro FROM VaiTro WHERE tenVaiTro = 'GiangVien';
PRINT N'idVaiTro của GiangVien = ' + CAST(@idVaiTroGV AS NVARCHAR);

-- Bước 3: Gán vai trò GiangVien cho TẤT CẢ user chưa có vai trò nào
-- (những user vaiTros = [] trong API chính là giảng viên chưa được gán)
-- Hiện tại user 22329 (Nguyễn Thị Cẩm Nhung) có vaiTros = [] → là sinh viên/người tham gia
-- Bạn cần chỉ định đúng idNguoiDung của giảng viên

-- Xem danh sách user và vai trò hiện tại
SELECT 
    nd.idNguoiDung,
    nd.hoTen,
    nd.email,
    ISNULL(STRING_AGG(vt.tenVaiTro, ', '), N'(Chưa có vai trò)') AS vaiTros
FROM NguoiDung nd
LEFT JOIN VaiTro_NguoiDung vtn ON nd.idNguoiDung = vtn.idNguoiDung AND vtn.trangThai = 1
LEFT JOIN VaiTro vt ON vtn.idVaiTro = vt.idVaiTro
GROUP BY nd.idNguoiDung, nd.hoTen, nd.email
ORDER BY nd.idNguoiDung;
GO

-- Bước 4: Gán GiangVien cho user cụ thể
-- SAU KHI xem kết quả bước 3, thay 'XXXXX' bằng idNguoiDung của giảng viên
-- Ví dụ nếu giảng viên có idNguoiDung = 'ND006':
/*
DECLARE @idVaiTroGV2 INT;
SELECT @idVaiTroGV2 = idVaiTro FROM VaiTro WHERE tenVaiTro = 'GiangVien';

INSERT INTO VaiTro_NguoiDung (idVaiTro, idNguoiDung, trangThai, thoiGianCapQuan)
SELECT @idVaiTroGV2, 'ND006', 1, SYSDATETIME()
WHERE NOT EXISTS (
    SELECT 1 FROM VaiTro_NguoiDung 
    WHERE idVaiTro = @idVaiTroGV2 AND idNguoiDung = 'ND006'
);
PRINT N'Đã gán GiangVien cho ND006';
*/
GO
