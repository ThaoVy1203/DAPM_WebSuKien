namespace aspiCore.Dtos.DanhMuc
{
    public class DanhMucDto
    {
        public int IdDanhMuc { get; set; }
        public string TenDanhMuc { get; set; } = string.Empty;
        public string? MoTa { get; set; }
        public int SoSuKien { get; set; } = 0;
    }

    public class CreateDanhMucDto
    {
        public string TenDanhMuc { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }

    public class UpdateDanhMucDto
    {
        public string TenDanhMuc { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }
}
