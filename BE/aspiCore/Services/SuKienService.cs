using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.SuKien;
using aspiCore.Model;

namespace aspiCore.Services
{
    public class SuKienService : ISuKienService
    {
        private readonly ApplicationDBContext _context;

        public SuKienService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SuKienDto>> GetAllAsync()
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .ToListAsync();
        }

        public async Task<SuKienDto?> GetByIdAsync(int id)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .FirstOrDefaultAsync(s => s.IdSuKien == id);

            if (suKien == null) return null;

            return new SuKienDto
            {
                IdSuKien = suKien.IdSuKien,
                TenSuKien = suKien.TenSuKien,
                MoTa = suKien.MoTa,
                ThoiGianBatDau = suKien.ThoiGianBatDau,
                ThoiGianKetThuc = suKien.ThoiGianKetThuc,
                IdDiaDiem = suKien.IdDiaDiem,
                TenDiaDiem = suKien.DiaDiem?.TenDiaDiem,
                IdNguoiTao = suKien.IdNguoiTao,
                TenNguoiTao = suKien.NguoiTao?.HoTen,
                SoLuongToiDa = suKien.SoLuongToiDa,
                HinhAnh = suKien.HinhAnh,
                TrangThai = suKien.TrangThai,
                ThoiGianTao = suKien.ThoiGianTao,
                SoDaDangKy = suKien.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                DanhMucs = suKien.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
            };
        }

        public async Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Where(s => s.TrangThai == trangThai)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SuKienDto>> GetByNguoiTaoAsync(string idNguoiTao)
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Where(s => s.IdNguoiTao == idNguoiTao)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .OrderByDescending(s => s.ThoiGianTao)
                .ToListAsync();
        }

        public async Task<SuKienDto> CreateAsync(CreateSuKienDto dto)
        {
            if (dto.ThoiGianKetThuc <= dto.ThoiGianBatDau)
            {
                throw new InvalidOperationException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
            }

            var suKien = new SuKien
            {
                TenSuKien = dto.TenSuKien,
                MoTa = dto.MoTa,
                ThoiGianBatDau = dto.ThoiGianBatDau,
                ThoiGianKetThuc = dto.ThoiGianKetThuc,
                IdDiaDiem = dto.IdDiaDiem,
                IdNguoiTao = dto.IdNguoiTao,
                SoLuongToiDa = dto.SoLuongToiDa,
                HinhAnh = dto.HinhAnh,
                TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? "Nháp" : dto.TrangThai,
                ThoiGianTao = DateTime.Now
            };

            _context.SuKiens.Add(suKien);
            await _context.SaveChangesAsync();

            if (dto.DanhMucIds != null && dto.DanhMucIds.Any())
            {
                foreach (var danhMucId in dto.DanhMucIds)
                {
                    _context.SuKien_DanhMucs.Add(new SuKien_DanhMuc
                    {
                        IdSuKien = suKien.IdSuKien,
                        IdDanhMuc = danhMucId
                    });
                }
                await _context.SaveChangesAsync();
            }

            return (await GetByIdAsync(suKien.IdSuKien))!;
        }

        public async Task<SuKienDto?> UpdateAsync(int id, UpdateSuKienDto dto)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.SuKien_DanhMucs)
                .FirstOrDefaultAsync(s => s.IdSuKien == id);
                
            if (suKien == null) return null;

            if (!string.IsNullOrEmpty(dto.TenSuKien))
                suKien.TenSuKien = dto.TenSuKien;
            if (dto.MoTa != null)
                suKien.MoTa = dto.MoTa;
            if (dto.ThoiGianBatDau.HasValue)
                suKien.ThoiGianBatDau = dto.ThoiGianBatDau.Value;
            if (dto.ThoiGianKetThuc.HasValue)
                suKien.ThoiGianKetThuc = dto.ThoiGianKetThuc.Value;
            if (dto.IdDiaDiem.HasValue)
                suKien.IdDiaDiem = dto.IdDiaDiem;
            if (dto.SoLuongToiDa.HasValue)
                suKien.SoLuongToiDa = dto.SoLuongToiDa;
            if (dto.HinhAnh != null)
                suKien.HinhAnh = dto.HinhAnh;
            if (!string.IsNullOrEmpty(dto.TrangThai))
                suKien.TrangThai = dto.TrangThai;

            if (dto.ThoiGianKetThuc.HasValue || dto.ThoiGianBatDau.HasValue)
            {
                var start = dto.ThoiGianBatDau ?? suKien.ThoiGianBatDau;
                var end = dto.ThoiGianKetThuc ?? suKien.ThoiGianKetThuc;
                if (end <= start)
                {
                    throw new InvalidOperationException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
                }
            }

            if (dto.DanhMucIds != null)
            {
                _context.SuKien_DanhMucs.RemoveRange(suKien.SuKien_DanhMucs);
                foreach (var danhMucId in dto.DanhMucIds)
                {
                    _context.SuKien_DanhMucs.Add(new SuKien_DanhMuc
                    {
                        IdSuKien = suKien.IdSuKien,
                        IdDanhMuc = danhMucId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<SuKienDto?> CancelAsync(int id, string? lyDoHuy)
        {
            var suKien = await _context.SuKiens.FindAsync(id);
            if (suKien == null) return null;

            if (suKien.TrangThai == "Hủy" || suKien.TrangThai == "Kết thúc" || suKien.TrangThai == "Từ chối")
            {
                throw new InvalidOperationException("Không thể hủy sự kiện ở trạng thái này.");
            }

            suKien.TrangThai = "Hủy";
            
            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var suKien = await _context.SuKiens.FindAsync(id);
            if (suKien == null) return false;

            _context.SuKiens.Remove(suKien);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
