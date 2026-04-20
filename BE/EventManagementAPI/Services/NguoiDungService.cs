using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Data;
using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public class NguoiDungService : INguoiDungService
{
    private readonly AppDbContext _context;

    public NguoiDungService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NguoiDungDTO?> GetByIdAsync(string id)
    {
        var nguoiDung = await _context.NguoiDungs
            .Include(n => n.VaiTro_NguoiDungs)
                .ThenInclude(vn => vn.VaiTro)
            .FirstOrDefaultAsync(n => n.IdNguoiDung == id);

        if (nguoiDung == null) return null;

        return new NguoiDungDTO
        {
            IdNguoiDung = nguoiDung.IdNguoiDung,
            MaSoSSO = nguoiDung.MaSoSSO,
            HoTen = nguoiDung.HoTen,
            Email = nguoiDung.Email,
            SDT = nguoiDung.SDT,
            AnhDaiDien = nguoiDung.AnhDaiDien,
            VaiTros = nguoiDung.VaiTro_NguoiDungs
                .Where(vn => vn.TrangThai)
                .Select(vn => vn.VaiTro!.TenVaiTro)
                .ToList()
        };
    }

    public async Task<LoginResponseDTO> LoginAsync(LoginDTO dto)
    {
        var nguoiDung = await _context.NguoiDungs
            .Include(n => n.VaiTro_NguoiDungs)
                .ThenInclude(vn => vn.VaiTro)
            .FirstOrDefaultAsync(n => n.MaSoSSO == dto.MaSoSSO && n.MatKhauSSO == dto.MatKhau);

        if (nguoiDung == null)
        {
            return new LoginResponseDTO
            {
                Success = false,
                Message = "Mã số SSO hoặc mật khẩu không đúng"
            };
        }

        return new LoginResponseDTO
        {
            Success = true,
            Message = "Đăng nhập thành công",
            NguoiDung = new NguoiDungDTO
            {
                IdNguoiDung = nguoiDung.IdNguoiDung,
                MaSoSSO = nguoiDung.MaSoSSO,
                HoTen = nguoiDung.HoTen,
                Email = nguoiDung.Email,
                SDT = nguoiDung.SDT,
                AnhDaiDien = nguoiDung.AnhDaiDien,
                VaiTros = nguoiDung.VaiTro_NguoiDungs
                    .Where(vn => vn.TrangThai)
                    .Select(vn => vn.VaiTro!.TenVaiTro)
                    .ToList()
            }
        };
    }

    public async Task<List<NguoiDungDTO>> GetAllNguoiDungsAsync()
    {
        return await _context.NguoiDungs
            .Include(n => n.VaiTro_NguoiDungs)
                .ThenInclude(vn => vn.VaiTro)
            .Select(n => new NguoiDungDTO
            {
                IdNguoiDung = n.IdNguoiDung,
                MaSoSSO = n.MaSoSSO,
                HoTen = n.HoTen,
                Email = n.Email,
                SDT = n.SDT,
                AnhDaiDien = n.AnhDaiDien,
                VaiTros = n.VaiTro_NguoiDungs
                    .Where(vn => vn.TrangThai)
                    .Select(vn => vn.VaiTro!.TenVaiTro)
                    .ToList()
            })
            .ToListAsync();
    }
}
