using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Data;
using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public class DiaDiemService : IDiaDiemService
{
    private readonly AppDbContext _context;

    public DiaDiemService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DiaDiemDTO>> GetAllDiaDiemsAsync()
    {
        return await _context.DiaDiems
            .Select(d => new DiaDiemDTO
            {
                IdDiaDiem = d.IdDiaDiem,
                TenDiaDiem = d.TenDiaDiem,
                ViTri = d.ViTri,
                SucChua = d.SucChua,
                TrangThaiSuDung = d.TrangThaiSuDung
            })
            .ToListAsync();
    }

    public async Task<DiaDiemDTO?> GetDiaDiemByIdAsync(int id)
    {
        var diaDiem = await _context.DiaDiems.FindAsync(id);
        if (diaDiem == null) return null;

        return new DiaDiemDTO
        {
            IdDiaDiem = diaDiem.IdDiaDiem,
            TenDiaDiem = diaDiem.TenDiaDiem,
            ViTri = diaDiem.ViTri,
            SucChua = diaDiem.SucChua,
            TrangThaiSuDung = diaDiem.TrangThaiSuDung
        };
    }
}
