using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.NguoiDung;
using aspiCore.Model;

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

            return new LoginResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công",
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
