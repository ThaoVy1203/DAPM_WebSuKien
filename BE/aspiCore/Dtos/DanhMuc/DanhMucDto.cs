namespace aspiCore.Dtos.DanhMuc
{
    public class DanhMucSuKienDto
    {
        public int IdDanhMuc { get; set; }
        public string TenDanhMuc { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }

    public class CreateDanhMucDto
    {
        public string TenDanhMuc { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }
}
