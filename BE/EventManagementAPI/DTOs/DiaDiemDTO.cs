namespace EventManagementAPI.DTOs;

public class DiaDiemDTO
{
    public int IdDiaDiem { get; set; }
    public string TenDiaDiem { get; set; } = string.Empty;
    public string? ViTri { get; set; }
    public int? SucChua { get; set; }
    public string TrangThaiSuDung { get; set; } = string.Empty;
}
