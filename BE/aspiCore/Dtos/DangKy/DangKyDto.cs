namespace aspiCore.Dtos.DangKy
{
    public class DangKyDto
    {
        public int IdSuKien { get; set; }
        public string IdNguoiDung { get; set; } = string.Empty;
    }

    public class DangKySuKienDto
    {
        public int IdDangKy { get; set; }
        public int IdSuKien { get; set; }
        public string TenSuKien { get; set; } = string.Empty;
        public string IdNguoiDung { get; set; } = string.Empty;
        public string HoTenNguoiDung { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public DateTime ThoiGianDangKy { get; set; }
        public DateTime? ThoiGianCheckin { get; set; }
        public DateTime? ThoiGianCheckout { get; set; }
    }

    public class CheckInDto
    {
        public int IdSuKien { get; set; }
        public string IdNguoiDung { get; set; } = string.Empty;
    }
}
