namespace aspiCore.Dtos.DiaDiem
{
    public class DiaDiemDto
    {
        public int IdDiaDiem { get; set; }
        public string TenDiaDiem { get; set; } = string.Empty;
        public string? ViTri { get; set; }
        public int? SucChua { get; set; }
        public string TrangThaiSuDung { get; set; } = "Hoạt động";
    }

    public class CreateDiaDiemDto
    {
        public string TenDiaDiem { get; set; } = string.Empty;
        public string? ViTri { get; set; }
        public int? SucChua { get; set; }
    }
}
