namespace EventManagementAPI.DTOs;

public class NguoiDungDTO
{
    public string IdNguoiDung { get; set; } = string.Empty;
    public string MaSoSSO { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? SDT { get; set; }
    public string? AnhDaiDien { get; set; }
    public List<string> VaiTros { get; set; } = new();
}

public class LoginDTO
{
    public string MaSoSSO { get; set; } = string.Empty;
    public string MatKhau { get; set; } = string.Empty;
}

public class LoginResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public NguoiDungDTO? NguoiDung { get; set; }
}
