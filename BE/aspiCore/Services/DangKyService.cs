using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.Common;
using aspiCore.Dtos.DangKy;
using aspiCore.Model;

namespace aspiCore.Services
{
    public class DangKyService : IDangKyService
    {
        private readonly ApplicationDBContext _context;

        public DangKyService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse> DangKySuKienAsync(DangKyDto dto)
        {
            var suKien = await _context.SuKiens.FindAsync(dto.IdSuKien);
            if (suKien == null || suKien.TrangThai != "Đã duyệt")
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Sự kiện không tồn tại hoặc chưa được phê duyệt."
                };
            }

            var existingDangKy = await _context.DangKySuKiens
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien 
                    && dk.IdNguoiDung == dto.IdNguoiDung 
                    && dk.TrangThai != "Đã hủy");

            if (existingDangKy != null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Bạn đã đăng ký sự kiện này rồi."
                };
            }

            if (suKien.SoLuongToiDa.HasValue)
            {
                var soDaDangKy = await _context.DangKySuKiens
                    .CountAsync(dk => dk.IdSuKien == dto.IdSuKien && dk.TrangThai != "Đã hủy");

                if (soDaDangKy >= suKien.SoLuongToiDa.Value)
                {
                    return new ApiResponse
                    {
                        Success = false,
                        Message = "Sự kiện đã đủ số lượng đăng ký."
                    };
                }
            }

            var dangKy = new DangKySuKien
            {
                IdSuKien = dto.IdSuKien,
                IdNguoiDung = dto.IdNguoiDung,
                TrangThai = "Đã xác nhận",
                ThoiGianDangKy = DateTime.Now
            };

            _context.DangKySuKiens.Add(dangKy);

            // Create notification
            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dto.IdNguoiDung,
                IdSuKien = dto.IdSuKien,
                TieuDe = "Đăng ký sự kiện thành công",
                NoiDung = $"Bạn đã đăng ký tham gia \"{suKien.TenSuKien}\" thành công. Vui lòng check-in đúng giờ.",
                DaDoc = false,
                ThoiGianGui = DateTime.Now
            });

            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Đăng ký thành công."
            };
        }

        public async Task<ApiResponse> HuyDangKyAsync(DangKyDto dto)
        {
            var dangKy = await _context.DangKySuKiens
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien && dk.IdNguoiDung == dto.IdNguoiDung);

            if (dangKy == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Không tìm thấy đăng ký."
                };
            }

            if (dangKy.TrangThai == "Đã tham gia" || dangKy.TrangThai == "Đã hủy")
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Không thể hủy đăng ký ở trạng thái hiện tại."
                };
            }

            dangKy.TrangThai = "Đã hủy";
            dangKy.ThoiGianHuy = DateTime.Now;
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Hủy đăng ký thành công."
            };
        }

        public async Task<ApiResponse> CheckInAsync(CheckInDto dto)
        {
            var dangKy = await _context.DangKySuKiens
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien 
                    && dk.IdNguoiDung == dto.IdNguoiDung 
                    && dk.TrangThai == "Đã xác nhận");

            if (dangKy == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Không tìm thấy đăng ký hợp lệ hoặc đã check-in rồi."
                };
            }

            dangKy.TrangThai = "Đã tham gia";
            dangKy.ThoiGianCheckin = DateTime.Now;
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Check-in thành công. Chào mừng bạn đến sự kiện!"
            };
        }

        public async Task<IEnumerable<DangKySuKienDto>> GetBySuKienAsync(int idSuKien)
        {
            return await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Include(dk => dk.SuKien)
                .Where(dk => dk.IdSuKien == idSuKien)
                .Select(dk => new DangKySuKienDto
                {
                    IdDangKy = dk.IdDangKy,
                    IdSuKien = dk.IdSuKien,
                    TenSuKien = dk.SuKien != null ? dk.SuKien.TenSuKien : "",
                    IdNguoiDung = dk.IdNguoiDung,
                    HoTenNguoiDung = dk.NguoiDung != null ? dk.NguoiDung.HoTen : "",
                    TrangThai = dk.TrangThai,
                    ThoiGianDangKy = dk.ThoiGianDangKy,
                    ThoiGianCheckin = dk.ThoiGianCheckin,
                    ThoiGianCheckout = dk.ThoiGianCheckout
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<DangKySuKienDto>> GetByNguoiDungAsync(string idNguoiDung)
        {
            return await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Include(dk => dk.SuKien)
                .Where(dk => dk.IdNguoiDung == idNguoiDung)
                .Select(dk => new DangKySuKienDto
                {
                    IdDangKy = dk.IdDangKy,
                    IdSuKien = dk.IdSuKien,
                    TenSuKien = dk.SuKien != null ? dk.SuKien.TenSuKien : "",
                    IdNguoiDung = dk.IdNguoiDung,
                    HoTenNguoiDung = dk.NguoiDung != null ? dk.NguoiDung.HoTen : "",
                    TrangThai = dk.TrangThai,
                    ThoiGianDangKy = dk.ThoiGianDangKy,
                    ThoiGianCheckin = dk.ThoiGianCheckin,
                    ThoiGianCheckout = dk.ThoiGianCheckout
                })
                .ToListAsync();
        }
    }
}
