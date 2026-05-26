namespace aspiCore.Dtos.SuKien
{
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
        public string TrangThai { get; set; } = "Nháp";
        public DateTime ThoiGianTao { get; set; }
        public int SoDaDangKy { get; set; }
        // Danh mục liên kết
        public List<int> DanhMucIds { get; set; } = new();
        public List<string> TenDanhMucs { get; set; } = new();
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
        public List<int>? DanhMucIds { get; set; }
    }

    public class UpdateSuKienDto
    {
        public string? TenSuKien { get; set; }
        public string? MoTa { get; set; }
        public DateTime? ThoiGianBatDau { get; set; }
        public DateTime? ThoiGianKetThuc { get; set; }
        public int? IdDiaDiem { get; set; }
        public int? SoLuongToiDa { get; set; }
        public string? TrangThai { get; set; }
    }
}
