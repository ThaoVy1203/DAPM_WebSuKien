using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Model;
using aspiCore.Dtos.DanhMuc;

namespace aspiCore.Services
{
    public class DanhMucService : IDanhMucService
    {
        private readonly ApplicationDBContext _context;

        public DanhMucService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DanhMucDto>> GetAllAsync()
        {
            var danhMucs = await _context.DanhMucSuKiens
                .Include(d => d.SuKien_DanhMucs)
                .ToListAsync();

            return danhMucs.Select(d => new DanhMucDto
            {
                IdDanhMuc = d.IdDanhMuc,
                TenDanhMuc = d.TenDanhMuc,
                MoTa = d.MoTa,
                SoSuKien = d.SuKien_DanhMucs.Count
            });
        }

        public async Task<DanhMucDto?> GetByIdAsync(int id)
        {
            var danhMuc = await _context.DanhMucSuKiens
                .Include(d => d.SuKien_DanhMucs)
                .FirstOrDefaultAsync(d => d.IdDanhMuc == id);

            if (danhMuc == null)
                return null;

            return new DanhMucDto
            {
                IdDanhMuc = danhMuc.IdDanhMuc,
                TenDanhMuc = danhMuc.TenDanhMuc,
                MoTa = danhMuc.MoTa,
                SoSuKien = danhMuc.SuKien_DanhMucs.Count
            };
        }

        public async Task<DanhMucDto> CreateAsync(CreateDanhMucDto dto)
        {
            var danhMuc = new DanhMucSuKien
            {
                TenDanhMuc = dto.TenDanhMuc,
                MoTa = dto.MoTa
            };

            _context.DanhMucSuKiens.Add(danhMuc);
            await _context.SaveChangesAsync();

            return new DanhMucDto
            {
                IdDanhMuc = danhMuc.IdDanhMuc,
                TenDanhMuc = danhMuc.TenDanhMuc,
                MoTa = danhMuc.MoTa,
                SoSuKien = 0
            };
        }

        public async Task<DanhMucDto?> UpdateAsync(int id, UpdateDanhMucDto dto)
        {
            var danhMuc = await _context.DanhMucSuKiens
                .Include(d => d.SuKien_DanhMucs)
                .FirstOrDefaultAsync(d => d.IdDanhMuc == id);

            if (danhMuc == null)
                return null;

            danhMuc.TenDanhMuc = dto.TenDanhMuc;
            danhMuc.MoTa = dto.MoTa;

            await _context.SaveChangesAsync();

            return new DanhMucDto
            {
                IdDanhMuc = danhMuc.IdDanhMuc,
                TenDanhMuc = danhMuc.TenDanhMuc,
                MoTa = danhMuc.MoTa,
                SoSuKien = danhMuc.SuKien_DanhMucs.Count
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var danhMuc = await _context.DanhMucSuKiens.FindAsync(id);

            if (danhMuc == null)
                return false;

            _context.DanhMucSuKiens.Remove(danhMuc);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
