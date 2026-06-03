namespace aspiCore.Dtos.Report
{
    public class DashboardDto
    {
        public int TongSuKien { get; set; }
        public int SuKienDangDienRa { get; set; }
        public int SuKienSapDienRa { get; set; }
        public int TongNguoiDung { get; set; }
        public int TongCongViec { get; set; }
        public int CongViecHoanThanh { get; set; }
        public int TongDangKy { get; set; }
        public List<SuKienGanDayDto> SuKienGanDay { get; set; } = new();
    }

    public class SuKienGanDayDto
    {
        public int IdSuKien { get; set; }
        public string TenSuKien { get; set; } = string.Empty;
        public DateTime ThoiGianBatDau { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public int SoNguoiDangKy { get; set; }
    }
}