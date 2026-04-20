namespace EventManagementAPI.DTOs;

public class DangKyRequestDTO
{
    public int IdSuKien { get; set; }
    public string? IdNguoiDung { get; set; }
}

public class DangKyResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class DangKySuKienDTO
{
    public int IdDangKy { get; set; }
    public int IdSuKien { get; set; }
    public string TenSuKien { get; set; } = string.Empty;
    public string IdNguoiDung { get; set; } = string.Empty;
    public string HoTenNguoiDung { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public DateTime ThoiGianDangKy { get; set; }
    public DateTime? ThoiGianCheckin { get; set; }
}
