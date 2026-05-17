using aspiCore.Data;
using aspiCore.Dtos.NguoiDung;
using aspiCore.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace aspiCore.Services
{
    public class NguoiDungService : INguoiDungService
    {
        private readonly ApplicationDBContext _context;

        public NguoiDungService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginDto dto)
        {
            var nguoiDung = await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                    .ThenInclude(vn => vn.VaiTro)
                .FirstOrDefaultAsync(n => n.MaSoSSO == dto.MaSoSSO && n.MatKhauSSO == dto.MatKhau);

            if (nguoiDung == null)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Mã số SSO hoặc mật khẩu không đúng"
                };
            }

            // ⚠️ THIẾU PHẦN NÀY - Tạo JWT Token
            var token = GenerateJwtToken(nguoiDung);  // Cần thêm method này

            return new LoginResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công",
                Token = token,  // ✅ Phải gán token vào đây
                NguoiDung = new NguoiDungDto
                {
                    IdNguoiDung = nguoiDung.IdNguoiDung,
                    MaSoSSO = nguoiDung.MaSoSSO,
                    HoTen = nguoiDung.HoTen,
                    Email = nguoiDung.Email,
                    SDT = nguoiDung.SDT,
                    AnhDaiDien = nguoiDung.AnhDaiDien,
                    VaiTros = nguoiDung.VaiTro_NguoiDungs
                        .Where(vn => vn.TrangThai && vn.VaiTro != null)
                        .Select(vn => vn.VaiTro!.TenVaiTro)
                        .ToList()
                }
            };
        }

        // Thêm method này vào NguoiDungService
        private string GenerateJwtToken(NguoiDung user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("UTE-Events-SecretKey-2026-For-JWT-Token-VeryLongAndSecure!!!");

            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.IdNguoiDung),
        new Claim(ClaimTypes.Name, user.HoTen),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim("MaSoSSO", user.MaSoSSO)
    };

            // Thêm role claims
            foreach (var vt in user.VaiTro_NguoiDungs.Where(vn => vn.TrangThai && vn.VaiTro != null))
            {
                claims.Add(new Claim(ClaimTypes.Role, vt.VaiTro!.TenVaiTro));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<IEnumerable<NguoiDungDto>> GetAllAsync()
        {
            return await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                    .ThenInclude(vn => vn.VaiTro)
                .Select(n => new NguoiDungDto
                {
                    IdNguoiDung = n.IdNguoiDung,
                    MaSoSSO = n.MaSoSSO,
                    HoTen = n.HoTen,
                    Email = n.Email,
                    SDT = n.SDT,
                    AnhDaiDien = n.AnhDaiDien,
                    VaiTros = n.VaiTro_NguoiDungs
                        .Where(vn => vn.TrangThai && vn.VaiTro != null)
                        .Select(vn => vn.VaiTro!.TenVaiTro)
                        .ToList()
                })
                .ToListAsync();
        }

        public async Task<NguoiDungDto?> GetByIdAsync(string id)
        {
            var nguoiDung = await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                    .ThenInclude(vn => vn.VaiTro)
                .FirstOrDefaultAsync(n => n.IdNguoiDung == id);

            if (nguoiDung == null) return null;

            return new NguoiDungDto
            {
                IdNguoiDung = nguoiDung.IdNguoiDung,
                MaSoSSO = nguoiDung.MaSoSSO,
                HoTen = nguoiDung.HoTen,
                Email = nguoiDung.Email,
                SDT = nguoiDung.SDT,
                AnhDaiDien = nguoiDung.AnhDaiDien,
                VaiTros = nguoiDung.VaiTro_NguoiDungs
                    .Where(vn => vn.TrangThai && vn.VaiTro != null)
                    .Select(vn => vn.VaiTro!.TenVaiTro)
                    .ToList()
            };
        }
    }
}
