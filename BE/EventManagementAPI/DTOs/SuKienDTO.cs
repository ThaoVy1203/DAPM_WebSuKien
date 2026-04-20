namespace EventManagementAPI.DTOs;

public class SuKienDTO
{
    public int IdSuKien { get; set; }
    public string TenSuKien { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public DateTime ThoiGianBatDau { get; set; }
    public DateTime ThoiGianKetThuc { get; set; }
    public string? TenDiaDiem { get; set; }
    public string? ViTri { get; set; }
    public int? SoLuongToiDa { get; set; }
    public int SoDaDangKy { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public string TenNguoiTao { get; set; } = string.Empty;
    public List<string> DanhMucs { get; set; } = new();
}

public class CreateSuKienDTO
{
    public string TenSuKien { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public DateTime ThoiGianBatDau { get; set; }
    public DateTime ThoiGianKetThuc { get; set; }
    public int? IdDiaDiem { get; set; }
    public int? SoLuongToiDa { get; set; }
    public List<int>? IdDanhMucs { get; set; }
}

public class UpdateSuKienDTO
{
    public string? TenSuKien { get; set; }
    public string? MoTa { get; set; }
    public DateTime? ThoiGianBatDau { get; set; }
    public DateTime? ThoiGianKetThuc { get; set; }
    public int? IdDiaDiem { get; set; }
    public int? SoLuongToiDa { get; set; }
    public string? TrangThai { get; set; }
}
