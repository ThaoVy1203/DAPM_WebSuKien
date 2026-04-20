using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Data;
using EventManagementAPI.DTOs;
using EventManagementAPI.Models;

namespace EventManagementAPI.Services;

public class SuKienService : ISuKienService
{
    private readonly AppDbContext _context;

    public SuKienService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SuKienDTO>> GetAllSuKiensAsync()
    {
        return await _context.SuKiens
            .Include(s => s.DiaDiem)
            .Include(s => s.NguoiTao)
            .Include(s => s.DangKySuKiens)
            .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
            .Select(s => new SuKienDTO
            {
                IdSuKien = s.IdSuKien,
                TenSuKien = s.TenSuKien,
                MoTa = s.MoTa,
                ThoiGianBatDau = s.ThoiGianBatDau,
                ThoiGianKetThuc = s.ThoiGianKetThuc,
                TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                ViTri = s.DiaDiem != null ? s.DiaDiem.ViTri : null,
                SoLuongToiDa = s.SoLuongToiDa,
                SoDaDangKy = s.DangKySuKiens.Count(d => d.TrangThai != "Đã hủy"),
                TrangThai = s.TrangThai,
                TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : "",
                DanhMucs = s.SuKien_DanhMucs.Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
            })
            .ToListAsync();
    }

    public async Task<SuKienDTO?> GetSuKienByIdAsync(int id)
    {
        return await _context.SuKiens
            .Include(s => s.DiaDiem)
            .Include(s => s.NguoiTao)
            .Include(s => s.DangKySuKiens)
            .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
            .Where(s => s.IdSuKien == id)
            .Select(s => new SuKienDTO
            {
                IdSuKien = s.IdSuKien,
                TenSuKien = s.TenSuKien,
                MoTa = s.MoTa,
                ThoiGianBatDau = s.ThoiGianBatDau,
                ThoiGianKetThuc = s.ThoiGianKetThuc,
                TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                ViTri = s.DiaDiem != null ? s.DiaDiem.ViTri : null,
                SoLuongToiDa = s.SoLuongToiDa,
                SoDaDangKy = s.DangKySuKiens.Count(d => d.TrangThai != "Đã hủy"),
                TrangThai = s.TrangThai,
                TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : "",
                DanhMucs = s.SuKien_DanhMucs.Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<SuKienDTO> CreateSuKienAsync(CreateSuKienDTO dto, string idNguoiTao)
    {
        var suKien = new SuKien
        {
            TenSuKien = dto.TenSuKien,
            MoTa = dto.MoTa,
            ThoiGianBatDau = dto.ThoiGianBatDau,
            ThoiGianKetThuc = dto.ThoiGianKetThuc,
            IdDiaDiem = dto.IdDiaDiem,
            IdNguoiTao = idNguoiTao,
            SoLuongToiDa = dto.SoLuongToiDa,
            TrangThai = "Nháp",
            ThoiGianTao = DateTime.Now
        };

        _context.SuKiens.Add(suKien);
        await _context.SaveChangesAsync();

        if (dto.IdDanhMucs != null && dto.IdDanhMucs.Any())
        {
            foreach (var idDanhMuc in dto.IdDanhMucs)
            {
                _context.SuKien_DanhMucs.Add(new SuKien_DanhMuc
                {
                    IdSuKien = suKien.IdSuKien,
                    IdDanhMuc = idDanhMuc
                });
            }
            await _context.SaveChangesAsync();
        }

        return await GetSuKienByIdAsync(suKien.IdSuKien) ?? new SuKienDTO();
    }

    public async Task<bool> UpdateSuKienAsync(int id, UpdateSuKienDTO dto)
    {
        var suKien = await _context.SuKiens.FindAsync(id);
        if (suKien == null) return false;

        if (dto.TenSuKien != null) suKien.TenSuKien = dto.TenSuKien;
        if (dto.MoTa != null) suKien.MoTa = dto.MoTa;
        if (dto.ThoiGianBatDau.HasValue) suKien.ThoiGianBatDau = dto.ThoiGianBatDau.Value;
        if (dto.ThoiGianKetThuc.HasValue) suKien.ThoiGianKetThuc = dto.ThoiGianKetThuc.Value;
        if (dto.IdDiaDiem.HasValue) suKien.IdDiaDiem = dto.IdDiaDiem;
        if (dto.SoLuongToiDa.HasValue) suKien.SoLuongToiDa = dto.SoLuongToiDa;
        if (dto.TrangThai != null) suKien.TrangThai = dto.TrangThai;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSuKienAsync(int id)
    {
        var suKien = await _context.SuKiens.FindAsync(id);
        if (suKien == null) return false;

        _context.SuKiens.Remove(suKien);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<SuKienDTO>> GetSuKiensByTrangThaiAsync(string trangThai)
    {
        return await _context.SuKiens
            .Include(s => s.DiaDiem)
            .Include(s => s.NguoiTao)
            .Include(s => s.DangKySuKiens)
            .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
            .Where(s => s.TrangThai == trangThai)
            .Select(s => new SuKienDTO
            {
                IdSuKien = s.IdSuKien,
                TenSuKien = s.TenSuKien,
                MoTa = s.MoTa,
                ThoiGianBatDau = s.ThoiGianBatDau,
                ThoiGianKetThuc = s.ThoiGianKetThuc,
                TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                ViTri = s.DiaDiem != null ? s.DiaDiem.ViTri : null,
                SoLuongToiDa = s.SoLuongToiDa,
                SoDaDangKy = s.DangKySuKiens.Count(d => d.TrangThai != "Đã hủy"),
                TrangThai = s.TrangThai,
                TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : "",
                DanhMucs = s.SuKien_DanhMucs.Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
            })
            .ToListAsync();
    }
}
