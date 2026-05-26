using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.CongViec;
using aspiCore.Model;

namespace aspiCore.Services
{
    public class CongViecService : ICongViecService
    {
        private readonly ApplicationDBContext _context;

        public CongViecService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CongViecDto>> GetAllAsync()
        {
            return await _context.CongViecs
                .Include(c => c.SuKien)
                .Include(c => c.PhanCongs)
                    .ThenInclude(p => p.NguoiDung)
                .Select(c => MapToDto(c))
                .ToListAsync();
        }

        public async Task<CongViecDto?> GetByIdAsync(int id)
        {
            var cv = await _context.CongViecs
                .Include(c => c.SuKien)
                .Include(c => c.PhanCongs)
                    .ThenInclude(p => p.NguoiDung)
                .FirstOrDefaultAsync(c => c.IdCongViec == id);

            return cv == null ? null : MapToDto(cv);
        }

        public async Task<IEnumerable<CongViecDto>> GetBySuKienAsync(int idSuKien)
        {
            return await _context.CongViecs
                .Include(c => c.SuKien)
                .Include(c => c.PhanCongs)
                    .ThenInclude(p => p.NguoiDung)
                .Where(c => c.IdSuKien == idSuKien)
                .Select(c => MapToDto(c))
                .ToListAsync();
        }

        public async Task<CongViecDto> CreateAsync(CreateCongViecDto dto)
        {
            var cv = new CongViec
            {
                TenCongViec = dto.TenCongViec,
                IdSuKien = dto.IdSuKien,
                TieuDe = dto.TieuDe,
                MoTa = dto.MoTa,
                HanChot = dto.HanChot,
                TrangThai = dto.TrangThai
            };

            _context.CongViecs.Add(cv);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(dto.NguoiPhuTrach))
            {
                var user = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.HoTen == dto.NguoiPhuTrach);
                if (user != null)
                {
                    var pc = new PhanCong
                    {
                        IdCongViec = cv.IdCongViec,
                        IdNguoiDung = user.IdNguoiDung,
                        VaiTroTrongBTC = "Thành viên thực hiện",
                        ThoiGianPhanCong = DateTime.Now
                    };
                    _context.PhanCongs.Add(pc);
                    await _context.SaveChangesAsync();
                }
            }

            return await GetByIdAsync(cv.IdCongViec) ?? MapToDto(cv);
        }

        public async Task<CongViecDto?> UpdateAsync(int id, UpdateCongViecDto dto)
        {
            var cv = await _context.CongViecs.FindAsync(id);
            if (cv == null) return null;

            if (dto.TenCongViec != null) cv.TenCongViec = dto.TenCongViec;
            if (dto.TieuDe != null) cv.TieuDe = dto.TieuDe;
            if (dto.MoTa != null) cv.MoTa = dto.MoTa;
            if (dto.HanChot != null) cv.HanChot = dto.HanChot;
            if (dto.TrangThai != null) cv.TrangThai = dto.TrangThai;

            await _context.SaveChangesAsync();

            if (dto.NguoiPhuTrach != null)
            {
                var existingPcs = await _context.PhanCongs.Where(p => p.IdCongViec == id).ToListAsync();
                _context.PhanCongs.RemoveRange(existingPcs);
                await _context.SaveChangesAsync();

                if (!string.IsNullOrEmpty(dto.NguoiPhuTrach))
                {
                    var user = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.HoTen == dto.NguoiPhuTrach);
                    if (user != null)
                    {
                        var pc = new PhanCong
                        {
                            IdCongViec = id,
                            IdNguoiDung = user.IdNguoiDung,
                            VaiTroTrongBTC = "Thành viên thực hiện",
                            ThoiGianPhanCong = DateTime.Now
                        };
                        _context.PhanCongs.Add(pc);
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var cv = await _context.CongViecs.FindAsync(id);
            if (cv == null) return false;

            _context.CongViecs.Remove(cv);
            await _context.SaveChangesAsync();
            return true;
        }

        private static CongViecDto MapToDto(CongViec c)
        {
            var nguoiPhuTrach = c.PhanCongs?
                .FirstOrDefault()?.NguoiDung?.HoTen;

            return new CongViecDto
            {
                IdCongViec = c.IdCongViec,
                TenCongViec = c.TenCongViec,
                IdSuKien = c.IdSuKien,
                TenSuKien = c.SuKien?.TenSuKien,
                TieuDe = c.TieuDe,
                MoTa = c.MoTa,
                HanChot = c.HanChot,
                TrangThai = c.TrangThai,
                NguoiPhuTrach = nguoiPhuTrach
            };
        }
    }
}