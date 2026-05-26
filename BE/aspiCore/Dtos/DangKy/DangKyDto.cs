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
        public DateTime? ThoiGianHuy { get; set; }
        public DateTime? ThoiGianCheckin { get; set; }
        public DateTime? ThoiGianCheckout { get; set; }

        // Thông tin sự kiện (join từ SuKien + DiaDiem)
        public DateTime? ThoiGianBatDau { get; set; }
        public DateTime? ThoiGianKetThuc { get; set; }
        public string TenDiaDiem { get; set; } = string.Empty;
        public string AnhBia { get; set; } = string.Empty;
    }

    public class CheckInDto
    {
        public int IdSuKien { get; set; }
        public string IdNguoiDung { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response trả về sau khi đăng ký thành công — bao gồm IdDangKy để FE redirect
    /// </summary>
    public class DangKyResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? IdDangKy { get; set; }
    }
}
