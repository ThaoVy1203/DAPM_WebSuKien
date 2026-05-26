namespace aspiCore.Dtos.CongViec
{
    public class CongViecDto
    {
        public int IdCongViec { get; set; }
        public string TenCongViec { get; set; } = string.Empty;
        public int IdSuKien { get; set; }
        public string? TenSuKien { get; set; }
        public string? TieuDe { get; set; }
        public string? MoTa { get; set; }
        public DateTime? HanChot { get; set; }
        public string TrangThai { get; set; } = "Chưa bắt đầu";
        public string? NguoiPhuTrach { get; set; } // Lấy từ PhanCong
    }

    public class CreateCongViecDto
    {
        public string TenCongViec { get; set; } = string.Empty;
        public int IdSuKien { get; set; }
        public string? TieuDe { get; set; }
        public string? MoTa { get; set; }
        public DateTime? HanChot { get; set; }
        public string TrangThai { get; set; } = "Chưa bắt đầu";
    }

    public class UpdateCongViecDto
    {
        public string? TenCongViec { get; set; }
        public string? TieuDe { get; set; }
        public string? MoTa { get; set; }
        public DateTime? HanChot { get; set; }
        public string? TrangThai { get; set; }
    }
}