namespace aspiCore.Dtos.ThongBao
{
    public class ThongBaoDto
    {
        public int IdThongBao { get; set; }
        public string IdNguoiDung { get; set; } = string.Empty;
        public int? IdSuKien { get; set; }
        public string? TenSuKien { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string? NoiDung { get; set; }
        public bool DaDoc { get; set; }
        public DateTime ThoiGianGui { get; set; }
    }
}