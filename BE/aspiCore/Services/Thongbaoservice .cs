using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.ThongBao;

namespace aspiCore.Services
{
    public class ThongBaoService : IThongBaoService
    {
        private readonly ApplicationDBContext _context;

        public ThongBaoService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ThongBaoDto>> GetByNguoiDungAsync(string idNguoiDung)
        {
            return await _context.ThongBaos
                .Include(t => t.SuKien)
                .Where(t => t.IdNguoiDung == idNguoiDung)
                .OrderByDescending(t => t.ThoiGianGui)
                .Select(t => new ThongBaoDto
                {
                    IdThongBao = t.IdThongBao,
                    IdNguoiDung = t.IdNguoiDung,
                    IdSuKien = t.IdSuKien,
                    TenSuKien = t.SuKien != null ? t.SuKien.TenSuKien : null,
                    TieuDe = t.TieuDe,
                    NoiDung = t.NoiDung,
                    DaDoc = t.DaDoc,
                    ThoiGianGui = t.ThoiGianGui
                })
                .ToListAsync();
        }

        public async Task<bool> DanhDauDaDocAsync(int idThongBao)
        {
            var tb = await _context.ThongBaos.FindAsync(idThongBao);
            if (tb == null) return false;

            tb.DaDoc = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(string idNguoiDung)
        {
            var unread = await _context.ThongBaos
                .Where(t => t.IdNguoiDung == idNguoiDung && !t.DaDoc)
                .ToListAsync();

            if (unread.Count == 0) return true;

            foreach (var tb in unread)
            {
                tb.DaDoc = true;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}