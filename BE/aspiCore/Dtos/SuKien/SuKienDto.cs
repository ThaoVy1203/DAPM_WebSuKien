namespace aspiCore.Dtos.SuKien
{
    public class DanhMucInfo
    {
        public int IdDanhMuc { get; set; }
        public string TenDanhMuc { get; set; } = string.Empty;
    }

    public class ThanhVienBtcDto
    {
        public string IdNguoiDung { get; set; } = string.Empty;
        public string? HoTen { get; set; }
        public string? VaiTro { get; set; }
    }

    public class NganSachDto
    {
        public string TenHangMuc { get; set; } = string.Empty;
        public string? Loai { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public decimal ThanhTien { get; set; }
    }

    public class SuKienDto
    {
        public int IdSuKien { get; set; }
        public string TenSuKien { get; set; } = string.Empty;
        public string? MoTa { get; set; }
        public DateTime ThoiGianBatDau { get; set; }
        public DateTime ThoiGianKetThuc { get; set; }
        public int? IdDiaDiem { get; set; }
        public string? TenDiaDiem { get; set; }
        public string IdNguoiTao { get; set; } = string.Empty;
        public string? TenNguoiTao { get; set; }
        public int? SoLuongToiDa { get; set; }
        public string? HinhAnh { get; set; }
        public string TrangThai { get; set; } = "Nháp";
        public int GioHuyTruocBatDauPhut { get; set; } = 120;
        public bool YeuCauKhaoSatCheckout { get; set; } = true;
        public DateTime ThoiGianTao { get; set; }
        public int SoDaDangKy { get; set; }

        // Kết hợp cả hai cách thể hiện danh mục
        public List<DanhMucInfo> DanhMucs { get; set; } = new List<DanhMucInfo>();
        public List<int> DanhMucIds { get; set; } = new();
        public List<string> TenDanhMucs { get; set; } = new();

        // Các danh sách khác
        public List<ThanhVienBtcDto> ThanhVienBTCs { get; set; } = new List<ThanhVienBtcDto>();
        public List<NganSachDto> NganSachs { get; set; } = new List<NganSachDto>();
    }

    /// <summary>
    /// Tham số truy vấn tìm kiếm / lọc sự kiện
    /// </summary>
    public class SuKienQueryDto
    {
        /// Từ khóa tìm kiếm (tên sự kiện, mô tả, địa điểm)
        public string? Keyword { get; set; }
        /// Lọc theo danh mục
        public int? IdDanhMuc { get; set; }
        /// Lọc theo địa điểm
        public int? IdDiaDiem { get; set; }
        /// Lọc từ ngày bắt đầu
        public DateTime? TuNgay { get; set; }
        /// Lọc đến ngày bắt đầu
        public DateTime? DenNgay { get; set; }
        /// Lọc theo trạng thái
        public string? TrangThai { get; set; }
        /// Số trang (cho phân trang)
        public int? PageNumber { get; set; } = 1;
        /// Kích thước trang (cho phân trang)
        public int? PageSize { get; set; } = 10;
    }

    public class CreateSuKienDto
    {
        public string TenSuKien { get; set; } = string.Empty;
        public string? MoTa { get; set; }
        public DateTime ThoiGianBatDau { get; set; }
        public DateTime ThoiGianKetThuc { get; set; }
        public int? IdDiaDiem { get; set; }
        public string IdNguoiTao { get; set; } = string.Empty;
        public int? SoLuongToiDa { get; set; }
        public int GioHuyTruocBatDauPhut { get; set; } = 120;
        public bool YeuCauKhaoSatCheckout { get; set; } = true;
        public string? HinhAnh { get; set; }
        public string? TrangThai { get; set; }
        public List<int>? DanhMucIds { get; set; }
        public List<ThanhVienBtcDto>? ThanhVienBTCs { get; set; }
        public List<NganSachDto>? NganSachs { get; set; }
    }

    public class UpdateSuKienDto
    {
        public string? TenSuKien { get; set; }
        public string? MoTa { get; set; }
        public DateTime? ThoiGianBatDau { get; set; }
        public DateTime? ThoiGianKetThuc { get; set; }
        public int? IdDiaDiem { get; set; }
        public int? SoLuongToiDa { get; set; }
        public int? GioHuyTruocBatDauPhut { get; set; }
        public bool? YeuCauKhaoSatCheckout { get; set; }
        public string? HinhAnh { get; set; }
        public string? TrangThai { get; set; }
        public List<int>? DanhMucIds { get; set; }
        public List<ThanhVienBtcDto>? ThanhVienBTCs { get; set; }
        public List<NganSachDto>? NganSachs { get; set; }
    }

    public class CancelSuKienDto
    {
        public string? LyDoHuy { get; set; }
    }
}