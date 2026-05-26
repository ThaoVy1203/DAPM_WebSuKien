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
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
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
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucIds = s.SuKien_DanhMucs.Select(sd => sd.IdDanhMuc).ToList(),
                    TenDanhMucs = s.SuKien_DanhMucs
                        .Where(sd => sd.DanhMuc != null)
                        .Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
                })
                .ToListAsync();
        }

        public async Task<SuKienDto?> GetByIdAsync(int id)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
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
                TrangThai = suKien.TrangThai,
                ThoiGianTao = suKien.ThoiGianTao,
                SoDaDangKy = suKien.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                DanhMucIds = suKien.SuKien_DanhMucs.Select(sd => sd.IdDanhMuc).ToList(),
                TenDanhMucs = suKien.SuKien_DanhMucs
                    .Where(sd => sd.DanhMuc != null)
                    .Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
            };
        }

        public async Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
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
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucIds = s.SuKien_DanhMucs.Select(sd => sd.IdDanhMuc).ToList(),
                    TenDanhMucs = s.SuKien_DanhMucs
                        .Where(sd => sd.DanhMuc != null)
                        .Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SuKienDto>> SearchAsync(SuKienQueryDto query)
        {
            var q = _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .AsQueryable();

            // Lọc theo từ khóa (tên, mô tả, địa điểm)
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                var kw = query.Keyword.Trim().ToLower();
                q = q.Where(s =>
                    s.TenSuKien.ToLower().Contains(kw) ||
                    (s.MoTa != null && s.MoTa.ToLower().Contains(kw)) ||
                    (s.DiaDiem != null && s.DiaDiem.TenDiaDiem.ToLower().Contains(kw))
                );
            }

            // Lọc theo danh mục
            if (query.IdDanhMuc.HasValue)
            {
                q = q.Where(s => s.SuKien_DanhMucs.Any(sd => sd.IdDanhMuc == query.IdDanhMuc.Value));
            }

            // Lọc theo địa điểm
            if (query.IdDiaDiem.HasValue)
            {
                q = q.Where(s => s.IdDiaDiem == query.IdDiaDiem.Value);
            }

            // Lọc theo trạng thái
            if (!string.IsNullOrWhiteSpace(query.TrangThai))
            {
                q = q.Where(s => s.TrangThai == query.TrangThai);
            }

            // Lọc theo khoảng thời gian bắt đầu
            if (query.TuNgay.HasValue)
            {
                q = q.Where(s => s.ThoiGianBatDau >= query.TuNgay.Value);
            }
            if (query.DenNgay.HasValue)
            {
                var denNgayCuoi = query.DenNgay.Value.Date.AddDays(1).AddTicks(-1);
                q = q.Where(s => s.ThoiGianBatDau <= denNgayCuoi);
            }

            return await q
                .OrderBy(s => s.ThoiGianBatDau)
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
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucIds = s.SuKien_DanhMucs.Select(sd => sd.IdDanhMuc).ToList(),
                    TenDanhMucs = s.SuKien_DanhMucs
                        .Where(sd => sd.DanhMuc != null)
                        .Select(sd => sd.DanhMuc!.TenDanhMuc).ToList()
                })
                .ToListAsync();
        }

        public async Task<SuKienDto> CreateAsync(CreateSuKienDto dto)
        {
            var suKien = new SuKien
            {
                TenSuKien = dto.TenSuKien,
                MoTa = dto.MoTa,
                ThoiGianBatDau = dto.ThoiGianBatDau,
                ThoiGianKetThuc = dto.ThoiGianKetThuc,
                IdDiaDiem = dto.IdDiaDiem,
                IdNguoiTao = dto.IdNguoiTao,
                SoLuongToiDa = dto.SoLuongToiDa,
                TrangThai = "Nháp",
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
            var suKien = await _context.SuKiens.FindAsync(id);
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
            if (!string.IsNullOrEmpty(dto.TrangThai))
                suKien.TrangThai = dto.TrangThai;

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
