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
    }
}
