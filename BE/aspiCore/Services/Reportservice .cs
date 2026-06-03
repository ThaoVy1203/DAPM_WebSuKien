using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.Report;

namespace aspiCore.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDBContext _context;

        public ReportService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<DashboardDto> GetDashboardAsync()
        {
            var now = DateTime.Now;

            var tongSuKien = await _context.SuKiens.CountAsync();
            var dangDienRa = await _context.SuKiens
                .CountAsync(s => s.ThoiGianBatDau <= now && s.ThoiGianKetThuc >= now);
            var sapDienRa = await _context.SuKiens
                .CountAsync(s => s.ThoiGianBatDau > now);
            var tongNguoiDung = await _context.NguoiDungs.CountAsync();
            var tongCongViec = await _context.CongViecs.CountAsync();
            var congViecHoanThanh = await _context.CongViecs
                .CountAsync(c => c.TrangThai == "Hoàn thành");
            var tongDangKy = await _context.DangKySuKiens.CountAsync();

            var suKienGanDay = await _context.SuKiens
                .Include(s => s.DangKySuKiens)
                .OrderByDescending(s => s.ThoiGianTao)
                .Take(5)
                .Select(s => new SuKienGanDayDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    TrangThai = s.TrangThai,
                    SoNguoiDangKy = s.DangKySuKiens.Count
                })
                .ToListAsync();

            return new DashboardDto
            {
                TongSuKien = tongSuKien,
                SuKienDangDienRa = dangDienRa,
                SuKienSapDienRa = sapDienRa,
                TongNguoiDung = tongNguoiDung,
                TongCongViec = tongCongViec,
                CongViecHoanThanh = congViecHoanThanh,
                TongDangKy = tongDangKy,
                SuKienGanDay = suKienGanDay
            };
        }
    }
}