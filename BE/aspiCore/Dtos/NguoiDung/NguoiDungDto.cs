namespace aspiCore.Dtos.NguoiDung
{
    public class NguoiDungDto
    {
        public string IdNguoiDung { get; set; } = string.Empty;
        public string MaSoSSO { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? SDT { get; set; }
        public string? AnhDaiDien { get; set; }
        public bool TrangThai { get; set; } = true;
        public List<string> VaiTros { get; set; } = new();
    }

    public class CreateNguoiDungDto
    {
        public string IdNguoiDung { get; set; } = string.Empty;
        public string MaSoSSO { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? SDT { get; set; }
        public string MatKhauSSO { get; set; } = string.Empty;
    }

    public class UpdateNguoiDungDto
    {
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? SDT { get; set; }
        public string? AnhDaiDien { get; set; }
        public bool? TrangThai { get; set; }
    }

    public class LoginDto
    {
        public string MaSoSSO { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public NguoiDungDto? NguoiDung { get; set; }
        public string? Token { get; set; }
    }

    public class RegisterDto
    {
        public string IdNguoiDung { get; set; } = string.Empty;
        public string MaSoSSO { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? SDT { get; set; }
        public string MatKhauSSO { get; set; } = string.Empty;
    }
}
