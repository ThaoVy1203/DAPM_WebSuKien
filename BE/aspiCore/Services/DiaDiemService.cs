using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.DiaDiem;
using aspiCore.Model;

namespace aspiCore.Services
{
    public class DiaDiemService : IDiaDiemService
    {
        private readonly ApplicationDBContext _context;

        public DiaDiemService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DiaDiemDto>> GetAllAsync()
        {
            return await _context.DiaDiems
                .Select(d => new DiaDiemDto
                {
                    IdDiaDiem = d.IdDiaDiem,
                    TenDiaDiem = d.TenDiaDiem,
                    ViTri = d.ViTri,
                    SucChua = d.SucChua,
                    TrangThaiSuDung = d.TrangThaiSuDung
                })
                .ToListAsync();
        }

        public async Task<DiaDiemDto?> GetByIdAsync(int id)
        {
            var diaDiem = await _context.DiaDiems.FindAsync(id);
            if (diaDiem == null) return null;

            return new DiaDiemDto
            {
                IdDiaDiem = diaDiem.IdDiaDiem,
                TenDiaDiem = diaDiem.TenDiaDiem,
                ViTri = diaDiem.ViTri,
                SucChua = diaDiem.SucChua,
                TrangThaiSuDung = diaDiem.TrangThaiSuDung
            };
        }

        public async Task<DiaDiemDto> CreateAsync(CreateDiaDiemDto dto)
        {
            var diaDiem = new DiaDiem
            {
                TenDiaDiem = dto.TenDiaDiem,
                ViTri = dto.ViTri,
                SucChua = dto.SucChua,
                TrangThaiSuDung = "Hoạt động"
            };

            _context.DiaDiems.Add(diaDiem);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(diaDiem.IdDiaDiem))!;
        }

        public async Task<DiaDiemDto?> UpdateAsync(int id, UpdateDiaDiemDto dto)
        {
            var diaDiem = await _context.DiaDiems.FindAsync(id);
            if (diaDiem == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.TenDiaDiem))
                diaDiem.TenDiaDiem = dto.TenDiaDiem;
            if (dto.ViTri != null)
                diaDiem.ViTri = dto.ViTri;
            if (dto.SucChua.HasValue)
                diaDiem.SucChua = dto.SucChua;
            if (!string.IsNullOrWhiteSpace(dto.TrangThaiSuDung))
                diaDiem.TrangThaiSuDung = dto.TrangThaiSuDung;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var diaDiem = await _context.DiaDiems.FindAsync(id);
            if (diaDiem == null) return false;

            // Kiểm tra xem địa điểm có đang được dùng bởi sự kiện nào không
            bool inUse = await _context.SuKiens.AnyAsync(s => s.IdDiaDiem == id);
            if (inUse)
                throw new InvalidOperationException("Địa điểm đang được sử dụng bởi một hoặc nhiều sự kiện. Không thể xóa.");

            _context.DiaDiems.Remove(diaDiem);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
