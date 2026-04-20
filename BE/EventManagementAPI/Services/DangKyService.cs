using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Data;
using EventManagementAPI.DTOs;
using EventManagementAPI.Models;

namespace EventManagementAPI.Services;

public class DangKyService : IDangKyService
{
    private readonly AppDbContext _context;

    public DangKyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DangKyResponseDTO> DangKySuKienAsync(int idSuKien, string idNguoiDung)
    {
        var suKien = await _context.SuKiens.FindAsync(idSuKien);
        if (suKien == null || suKien.TrangThai != "Đã duyệt")
        {
            return new DangKyResponseDTO
            {
                Success = false,
                Message = "Sự kiện không tồn tại hoặc chưa được phê duyệt."
            };
        }

        var existingDangKy = await _context.DangKySuKiens
            .FirstOrDefaultAsync(d => d.IdSuKien == idSuKien && d.IdNguoiDung == idNguoiDung && d.TrangThai != "Đã hủy");

        if (existingDangKy != null)
        {
            return new DangKyResponseDTO
            {
                Success = false,
                Message = "Bạn đã đăng ký sự kiện này rồi."
            };
        }

        if (suKien.SoLuongToiDa.HasValue)
        {
            var soDaDangKy = await _context.DangKySuKiens
                .CountAsync(d => d.IdSuKien == idSuKien && d.TrangThai != "Đã hủy");

            if (soDaDangKy >= suKien.SoLuongToiDa.Value)
            {
                return new DangKyResponseDTO
                {
                    Success = false,
                    Message = "Sự kiện đã đủ số lượng đăng ký."
                };
            }
        }

        var dangKy = new DangKySuKien
        {
            IdSuKien = idSuKien,
            IdNguoiDung = idNguoiDung,
            TrangThai = "Đã xác nhận",
            ThoiGianDangKy = DateTime.Now
        };

        _context.DangKySuKiens.Add(dangKy);
        await _context.SaveChangesAsync();

        return new DangKyResponseDTO
        {
            Success = true,
            Message = "Đăng ký thành công."
        };
    }

    public async Task<DangKyResponseDTO> HuyDangKyAsync(int idSuKien, string idNguoiDung)
    {
        var dangKy = await _context.DangKySuKiens
            .FirstOrDefaultAsync(d => d.IdSuKien == idSuKien && d.IdNguoiDung == idNguoiDung);

        if (dangKy == null)
        {
            return new DangKyResponseDTO
            {
                Success = false,
                Message = "Không tìm thấy đăng ký."
            };
        }

        if (dangKy.TrangThai == "Đã tham gia" || dangKy.TrangThai == "Đã hủy")
        {
            return new DangKyResponseDTO
            {
                Success = false,
                Message = "Không thể hủy đăng ký ở trạng thái hiện tại."
            };
        }

        dangKy.TrangThai = "Đã hủy";
        dangKy.ThoiGianHuy = DateTime.Now;
        await _context.SaveChangesAsync();

        return new DangKyResponseDTO
        {
            Success = true,
            Message = "Hủy đăng ký thành công."
        };
    }

    public async Task<DangKyResponseDTO> CheckInAsync(int idSuKien, string idNguoiDung)
    {
        var dangKy = await _context.DangKySuKiens
            .FirstOrDefaultAsync(d => d.IdSuKien == idSuKien && d.IdNguoiDung == idNguoiDung && d.TrangThai == "Đã xác nhận");

        if (dangKy == null)
        {
            return new DangKyResponseDTO
            {
                Success = false,
                Message = "Không tìm thấy đăng ký hợp lệ hoặc đã check-in rồi."
            };
        }

        dangKy.TrangThai = "Đã tham gia";
        dangKy.ThoiGianCheckin = DateTime.Now;
        await _context.SaveChangesAsync();

        return new DangKyResponseDTO
        {
            Success = true,
            Message = "Check-in thành công."
        };
    }

    public async Task<List<DangKySuKienDTO>> GetDangKyBySuKienAsync(int idSuKien)
    {
        return await _context.DangKySuKiens
            .Include(d => d.NguoiDung)
            .Include(d => d.SuKien)
            .Where(d => d.IdSuKien == idSuKien)
            .Select(d => new DangKySuKienDTO
            {
                IdDangKy = d.IdDangKy,
                IdSuKien = d.IdSuKien,
                TenSuKien = d.SuKien!.TenSuKien,
                IdNguoiDung = d.IdNguoiDung,
                HoTenNguoiDung = d.NguoiDung!.HoTen,
                TrangThai = d.TrangThai,
                ThoiGianDangKy = d.ThoiGianDangKy,
                ThoiGianCheckin = d.ThoiGianCheckin
            })
            .ToListAsync();
    }

    public async Task<List<DangKySuKienDTO>> GetDangKyByNguoiDungAsync(string idNguoiDung)
    {
        return await _context.DangKySuKiens
            .Include(d => d.NguoiDung)
            .Include(d => d.SuKien)
            .Where(d => d.IdNguoiDung == idNguoiDung)
            .Select(d => new DangKySuKienDTO
            {
                IdDangKy = d.IdDangKy,
                IdSuKien = d.IdSuKien,
                TenSuKien = d.SuKien!.TenSuKien,
                IdNguoiDung = d.IdNguoiDung,
                HoTenNguoiDung = d.NguoiDung!.HoTen,
                TrangThai = d.TrangThai,
                ThoiGianDangKy = d.ThoiGianDangKy,
                ThoiGianCheckin = d.ThoiGianCheckin
            })
            .ToListAsync();
    }
}
