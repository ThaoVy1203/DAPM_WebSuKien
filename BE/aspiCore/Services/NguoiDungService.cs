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
            // Hỗ trợ login bằng Email HOẶC MaSoSSO
            var nguoiDung = await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                    .ThenInclude(vn => vn.VaiTro)
                .FirstOrDefaultAsync(n => 
                    (n.MaSoSSO == dto.MaSoSSO || n.Email == dto.MaSoSSO) 
                    && n.MatKhauSSO == dto.MatKhau);

            if (nguoiDung == null)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Email/Mã số SSO hoặc mật khẩu không đúng"
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
                    TrangThai = nguoiDung.TrangThai,
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
                    TrangThai = n.TrangThai,
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
                TrangThai = nguoiDung.TrangThai,
                VaiTros = nguoiDung.VaiTro_NguoiDungs
                    .Where(vn => vn.TrangThai && vn.VaiTro != null)
                    .Select(vn => vn.VaiTro!.TenVaiTro)
                    .ToList()
            };
        }

        public async Task<NguoiDungDto> CreateAsync(CreateNguoiDungDto dto)
        {
            var nguoiDung = new NguoiDung
            {
                IdNguoiDung = dto.IdNguoiDung,
                MaSoSSO = dto.MaSoSSO,
                HoTen = dto.HoTen,
                Email = dto.Email,
                SDT = dto.SDT,
                MatKhauSSO = dto.MatKhauSSO
            };

            _context.NguoiDungs.Add(nguoiDung);
            await _context.SaveChangesAsync();

            return new NguoiDungDto
            {
                IdNguoiDung = nguoiDung.IdNguoiDung,
                MaSoSSO = nguoiDung.MaSoSSO,
                HoTen = nguoiDung.HoTen,
                Email = nguoiDung.Email,
                SDT = nguoiDung.SDT,
                AnhDaiDien = nguoiDung.AnhDaiDien,
                TrangThai = nguoiDung.TrangThai,
                VaiTros = new List<string>()
            };
        }

        public async Task<NguoiDungDto?> UpdateAsync(string id, UpdateNguoiDungDto dto)
        {
            var nguoiDung = await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                    .ThenInclude(vn => vn.VaiTro)
                .FirstOrDefaultAsync(n => n.IdNguoiDung == id);

            if (nguoiDung == null)
                return null;

            nguoiDung.HoTen = dto.HoTen;
            nguoiDung.Email = dto.Email;
            nguoiDung.SDT = dto.SDT;
            if (dto.AnhDaiDien != null)
                nguoiDung.AnhDaiDien = dto.AnhDaiDien;
            if (dto.TrangThai.HasValue)
                nguoiDung.TrangThai = dto.TrangThai.Value;

            await _context.SaveChangesAsync();

            return new NguoiDungDto
            {
                IdNguoiDung = nguoiDung.IdNguoiDung,
                MaSoSSO = nguoiDung.MaSoSSO,
                HoTen = nguoiDung.HoTen,
                Email = nguoiDung.Email,
                SDT = nguoiDung.SDT,
                AnhDaiDien = nguoiDung.AnhDaiDien,
                TrangThai = nguoiDung.TrangThai,
                VaiTros = nguoiDung.VaiTro_NguoiDungs
                    .Where(vn => vn.TrangThai && vn.VaiTro != null)
                    .Select(vn => vn.VaiTro!.TenVaiTro)
                    .ToList()
            };
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var nguoiDung = await _context.NguoiDungs
                .Include(n => n.VaiTro_NguoiDungs)
                .Include(n => n.DangKySuKiens)
                .Include(n => n.NguoiDung_SuKiens)
                .Include(n => n.ThongBaos)
                .Include(n => n.SuKiensTao)
                .FirstOrDefaultAsync(n => n.IdNguoiDung == id);

            if (nguoiDung == null)
                return false;

            // Check if user has created events
            if (nguoiDung.SuKiensTao.Any())
            {
                throw new InvalidOperationException("Không thể xóa người dùng đã tạo sự kiện. Vui lòng xóa các sự kiện trước.");
            }

            // Remove related records first
            if (nguoiDung.VaiTro_NguoiDungs.Any())
            {
                _context.VaiTro_NguoiDungs.RemoveRange(nguoiDung.VaiTro_NguoiDungs);
            }

            if (nguoiDung.DangKySuKiens.Any())
            {
                _context.DangKySuKiens.RemoveRange(nguoiDung.DangKySuKiens);
            }

            if (nguoiDung.NguoiDung_SuKiens.Any())
            {
                _context.NguoiDung_SuKiens.RemoveRange(nguoiDung.NguoiDung_SuKiens);
            }

            if (nguoiDung.ThongBaos.Any())
            {
                _context.ThongBaos.RemoveRange(nguoiDung.ThongBaos);
            }

            // Now remove the user
            _context.NguoiDungs.Remove(nguoiDung);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> GanVaiTroAsync(string idNguoiDung, int idVaiTro)
        {
            // Kiểm tra vai trò tồn tại
            var vaiTro = await _context.VaiTros.FindAsync(idVaiTro);
            if (vaiTro == null) return false;

            // Kiểm tra đã gán chưa
            var exists = await _context.VaiTro_NguoiDungs
                .AnyAsync(vn => vn.IdNguoiDung == idNguoiDung && vn.IdVaiTro == idVaiTro);
            if (exists) return false;

            _context.VaiTro_NguoiDungs.Add(new VaiTro_NguoiDung
            {
                IdNguoiDung = idNguoiDung,
                IdVaiTro = idVaiTro,
                TrangThai = true,
                ThoiGianCapQuan = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
