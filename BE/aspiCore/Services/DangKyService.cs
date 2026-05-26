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

        public async Task<DangKyResponseDto> DangKySuKienAsync(DangKyDto dto)
        {
            var suKien = await _context.SuKiens.FindAsync(dto.IdSuKien);
            if (suKien == null || suKien.TrangThai != "Đã duyệt")
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = "Sự kiện không tồn tại hoặc chưa được phê duyệt."
                };
            }

            // ── Kiểm tra thời gian: không cho đăng ký khi sự kiện đã bắt đầu hoặc kết thúc ──
            var now = DateTime.Now;
            if (now >= suKien.ThoiGianBatDau)
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = now > suKien.ThoiGianKetThuc
                        ? "Sự kiện đã kết thúc. Không thể đăng ký."
                        : "Sự kiện đã bắt đầu. Không thể đăng ký mới."
                };
            }
            var existingDangKy = await _context.DangKySuKiens
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien 
                    && dk.IdNguoiDung == dto.IdNguoiDung 
                    && dk.TrangThai != "Đã hủy");

            if (existingDangKy != null)
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = "Bạn đã đăng ký sự kiện này rồi.",
                    IdDangKy = existingDangKy.IdDangKy
                };
            }

            if (suKien.SoLuongToiDa.HasValue)
            {
                var soDaDangKy = await _context.DangKySuKiens
                    .CountAsync(dk => dk.IdSuKien == dto.IdSuKien && dk.TrangThai != "Đã hủy");

                if (soDaDangKy >= suKien.SoLuongToiDa.Value)
                {
                    return new DangKyResponseDto
                    {
                        Success = false,
                        Message = "Sự kiện đã đủ số lượng đăng ký."
                    };
                }
            }

            // Trạng thái ban đầu: nếu sự kiện yêu cầu duyệt thủ công → "Chờ xác nhận"
            // ngược lại → "Đã xác nhận" (tự động)
            var trangThaiDangKy = suKien.YeuCauXacNhan ? "Chờ xác nhận" : "Đã xác nhận";

            var dangKy = new DangKySuKien
            {
                IdSuKien = dto.IdSuKien,
                IdNguoiDung = dto.IdNguoiDung,
                TrangThai = trangThaiDangKy,
                ThoiGianDangKy = DateTime.Now
            };

            _context.DangKySuKiens.Add(dangKy);

            // Tạo thông báo phù hợp với trạng thái
            var noiDungThongBao = trangThaiDangKy == "Chờ xác nhận"
                ? $"Bạn đã đăng ký tham gia \"{suKien.TenSuKien}\". Đăng ký đang chờ ban tổ chức xác nhận."
                : $"Bạn đã đăng ký tham gia \"{suKien.TenSuKien}\" thành công. Vui lòng check-in đúng giờ.";

            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dto.IdNguoiDung,
                IdSuKien = dto.IdSuKien,
                TieuDe = trangThaiDangKy == "Chờ xác nhận"
                    ? "Đăng ký đang chờ xác nhận"
                    : "Đăng ký sự kiện thành công",
                NoiDung = noiDungThongBao,
                DaDoc = false,
                ThoiGianGui = DateTime.Now
            });

            await _context.SaveChangesAsync();

            return new DangKyResponseDto
            {
                Success = true,
                Message = trangThaiDangKy == "Chờ xác nhận"
                    ? "Đăng ký thành công. Vui lòng chờ ban tổ chức xác nhận."
                    : "Đăng ký thành công.",
                IdDangKy = dangKy.IdDangKy
            };
        }

        public async Task<ApiResponse> HuyDangKyAsync(DangKyDto dto)
        {
            var dangKy = await _context.DangKySuKiens
                .Include(dk => dk.SuKien)
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

            if (dangKy.ThoiGianCheckin.HasValue)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Đã check-in. Không thể hủy đăng ký."
                };
            }

            if (dangKy.SuKien != null && DateTime.Now > dangKy.SuKien.ThoiGianKetThuc)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Sự kiện đã kết thúc. Không thể hủy đăng ký."
                };
            }

            if (!new[] { "Đã xác nhận", "Chờ xác nhận" }.Contains(dangKy.TrangThai))
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
                .Include(dk => dk.SuKien)
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

            // Kiểm tra cửa sổ thời gian check-in
            // Cho phép check-in từ 30 phút trước khi bắt đầu đến khi kết thúc
            if (dangKy.SuKien != null)
            {
                var now = DateTime.Now;
                var checkInOpen  = dangKy.SuKien.ThoiGianBatDau.AddMinutes(-30);
                var checkInClose = dangKy.SuKien.ThoiGianKetThuc;

                if (now < checkInOpen)
                {
                    var minutesLeft = (int)Math.Ceiling((checkInOpen - now).TotalMinutes);
                    return new ApiResponse
                    {
                        Success = false,
                        Message = $"Chưa đến giờ check-in. Check-in mở sau {minutesLeft} phút nữa (30 phút trước khi sự kiện bắt đầu)."
                    };
                }

                if (now > checkInClose)
                {
                    return new ApiResponse
                    {
                        Success = false,
                        Message = "Sự kiện đã kết thúc. Không thể check-in."
                    };
                }
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

        public async Task<ApiResponse> CheckInByQrAsync(QrCheckInDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.QrToken))
                return new ApiResponse { Success = false, Message = "Mã QR không hợp lệ." };

            if (!TryParseQrToken(dto.QrToken.Trim(), out var idDangKy, out var timestampMs))
                return new ApiResponse { Success = false, Message = "Định dạng mã QR không đúng." };

            if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - timestampMs) > 45_000)
                return new ApiResponse { Success = false, Message = "Mã QR đã hết hạn. Vui lòng làm mới mã trên điện thoại." };

            var dangKy = await _context.DangKySuKiens
                .Include(dk => dk.SuKien)
                .FirstOrDefaultAsync(dk => dk.IdDangKy == idDangKy && dk.TrangThai == "Đã xác nhận");

            if (dangKy == null)
                return new ApiResponse { Success = false, Message = "Vé không hợp lệ hoặc chưa được xác nhận." };

            if (dangKy.SuKien != null)
            {
                var now = DateTime.Now;
                var checkInOpen = dangKy.SuKien.ThoiGianBatDau.AddMinutes(-30);
                if (now < checkInOpen)
                {
                    var minutesLeft = (int)Math.Ceiling((checkInOpen - now).TotalMinutes);
                    return new ApiResponse
                    {
                        Success = false,
                        Message = $"Chưa đến giờ check-in. Mở sau {minutesLeft} phút nữa."
                    };
                }
                if (now > dangKy.SuKien.ThoiGianKetThuc)
                    return new ApiResponse { Success = false, Message = "Sự kiện đã kết thúc. Không thể check-in." };
            }

            dangKy.TrangThai = "Đã tham gia";
            dangKy.ThoiGianCheckin = DateTime.Now;
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Check-in thành công qua QR."
            };
        }

        public async Task<ApiResponse> CheckOutAsync(CheckInDto dto)
        {
            var dangKy = await _context.DangKySuKiens
                .Include(dk => dk.SuKien)
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien
                    && dk.IdNguoiDung == dto.IdNguoiDung
                    && dk.TrangThai == "Đã tham gia");

            if (dangKy == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Không tìm thấy đăng ký hợp lệ hoặc chưa check-in."
                };
            }

            if (dangKy.SuKien != null && DateTime.Now < dangKy.SuKien.ThoiGianBatDau)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Sự kiện chưa bắt đầu. Chưa thể check-out."
                };
            }

            if (dangKy.ThoiGianCheckout.HasValue)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Bạn đã check-out rồi."
                };
            }

            dangKy.ThoiGianCheckout = DateTime.Now;
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Check-out thành công. Cảm ơn bạn đã tham gia sự kiện!"
            };
        }

        /// <summary>GetByIdAsync — dùng cho endpoint public/{idDangKy}</summary>
        public async Task<DangKySuKienDto?> GetByIdAsync(int idDangKy)
        {
            return await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Include(dk => dk.SuKien)
                    .ThenInclude(sk => sk!.DiaDiem)
                .Where(dk => dk.IdDangKy == idDangKy)
                .Select(dk => new DangKySuKienDto
                {
                    IdDangKy          = dk.IdDangKy,
                    IdSuKien          = dk.IdSuKien,
                    TenSuKien         = dk.SuKien != null ? dk.SuKien.TenSuKien : "",
                    IdNguoiDung       = dk.IdNguoiDung,
                    HoTenNguoiDung    = dk.NguoiDung != null ? dk.NguoiDung.HoTen : "",
                    TrangThai         = dk.TrangThai,
                    ThoiGianDangKy    = dk.ThoiGianDangKy,
                    ThoiGianHuy       = dk.ThoiGianHuy,
                    ThoiGianCheckin   = dk.ThoiGianCheckin,
                    ThoiGianCheckout  = dk.ThoiGianCheckout,
                    ThoiGianBatDau    = dk.SuKien != null ? dk.SuKien.ThoiGianBatDau : (DateTime?)null,
                    ThoiGianKetThuc   = dk.SuKien != null ? dk.SuKien.ThoiGianKetThuc : (DateTime?)null,
                    TenDiaDiem        = dk.SuKien != null && dk.SuKien.DiaDiem != null
                                        ? dk.SuKien.DiaDiem.TenDiaDiem : ""
                })
                .FirstOrDefaultAsync();
        }

        /// <summary>XacNhanDangKyAsync — BTC duyệt: Chờ xác nhận → Đã xác nhận</summary>
        public async Task<ApiResponse> XacNhanDangKyAsync(DangKyDto dto)
        {
            var dk = await _context.DangKySuKiens
                .Include(d => d.SuKien)
                .FirstOrDefaultAsync(d => d.IdSuKien == dto.IdSuKien
                    && d.IdNguoiDung == dto.IdNguoiDung
                    && d.TrangThai == "Chờ xác nhận");
            if (dk == null)
                return new ApiResponse { Success = false, Message = "Không tìm thấy đăng ký chờ xác nhận." };

            dk.TrangThai = "Đã xác nhận";
            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dk.IdNguoiDung,
                IdSuKien    = dk.IdSuKien,
                TieuDe      = "Đăng ký đã được xác nhận",
                NoiDung     = $"Đăng ký của bạn tại \"{dk.SuKien?.TenSuKien}\" đã được BTC xác nhận. Vui lòng check-in đúng giờ.",
                DaDoc       = false,
                ThoiGianGui = DateTime.Now
            });
            await _context.SaveChangesAsync();
            return new ApiResponse { Success = true, Message = "Đã xác nhận đăng ký." };
        }

        /// <summary>TuChoiDangKyAsync — BTC từ chối: Chờ xác nhận → Đã hủy</summary>
        public async Task<ApiResponse> TuChoiDangKyAsync(DangKyDto dto)
        {
            var dk = await _context.DangKySuKiens
                .Include(d => d.SuKien)
                .FirstOrDefaultAsync(d => d.IdSuKien == dto.IdSuKien
                    && d.IdNguoiDung == dto.IdNguoiDung
                    && d.TrangThai == "Chờ xác nhận");
            if (dk == null)
                return new ApiResponse { Success = false, Message = "Không tìm thấy đăng ký chờ xác nhận." };

            dk.TrangThai   = "Đã hủy";
            dk.ThoiGianHuy = DateTime.Now;
            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dk.IdNguoiDung,
                IdSuKien    = dk.IdSuKien,
                TieuDe      = "Đăng ký bị từ chối",
                NoiDung     = $"Đăng ký của bạn tại \"{dk.SuKien?.TenSuKien}\" đã bị BTC từ chối.",
                DaDoc       = false,
                ThoiGianGui = DateTime.Now
            });
            await _context.SaveChangesAsync();
            return new ApiResponse { Success = true, Message = "Đã từ chối đăng ký." };
        }

        public async Task<IEnumerable<DangKySuKienDto>> GetBySuKienAsync(int idSuKien)        {
            return await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Include(dk => dk.SuKien)
                    .ThenInclude(sk => sk!.DiaDiem)
                .Where(dk => dk.IdSuKien == idSuKien)
                .Select(dk => new DangKySuKienDto
                {
                    IdDangKy          = dk.IdDangKy,
                    IdSuKien          = dk.IdSuKien,
                    TenSuKien         = dk.SuKien != null ? dk.SuKien.TenSuKien : "",
                    IdNguoiDung       = dk.IdNguoiDung,
                    HoTenNguoiDung    = dk.NguoiDung != null ? dk.NguoiDung.HoTen : "",
                    TrangThai         = dk.TrangThai,
                    ThoiGianDangKy    = dk.ThoiGianDangKy,
                    ThoiGianHuy       = dk.ThoiGianHuy,
                    ThoiGianCheckin   = dk.ThoiGianCheckin,
                    ThoiGianCheckout  = dk.ThoiGianCheckout,
                    ThoiGianBatDau    = dk.SuKien != null ? dk.SuKien.ThoiGianBatDau : (DateTime?)null,
                    ThoiGianKetThuc   = dk.SuKien != null ? dk.SuKien.ThoiGianKetThuc : (DateTime?)null,
                    TenDiaDiem        = dk.SuKien != null && dk.SuKien.DiaDiem != null ? dk.SuKien.DiaDiem.TenDiaDiem : ""
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<DangKySuKienDto>> GetByNguoiDungAsync(string idNguoiDung)
        {
            return await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Include(dk => dk.SuKien)
                    .ThenInclude(sk => sk!.DiaDiem)
                .Where(dk => dk.IdNguoiDung == idNguoiDung)
                .OrderByDescending(dk => dk.ThoiGianDangKy)
                .Select(dk => new DangKySuKienDto
                {
                    IdDangKy          = dk.IdDangKy,
                    IdSuKien          = dk.IdSuKien,
                    TenSuKien         = dk.SuKien != null ? dk.SuKien.TenSuKien : "",
                    IdNguoiDung       = dk.IdNguoiDung,
                    HoTenNguoiDung    = dk.NguoiDung != null ? dk.NguoiDung.HoTen : "",
                    TrangThai         = dk.TrangThai,
                    ThoiGianDangKy    = dk.ThoiGianDangKy,
                    ThoiGianHuy       = dk.ThoiGianHuy,
                    ThoiGianCheckin   = dk.ThoiGianCheckin,
                    ThoiGianCheckout  = dk.ThoiGianCheckout,
                    ThoiGianBatDau    = dk.SuKien != null ? dk.SuKien.ThoiGianBatDau : (DateTime?)null,
                    ThoiGianKetThuc   = dk.SuKien != null ? dk.SuKien.ThoiGianKetThuc : (DateTime?)null,
                    TenDiaDiem        = dk.SuKien != null && dk.SuKien.DiaDiem != null ? dk.SuKien.DiaDiem.TenDiaDiem : ""
                })
                .ToListAsync();
        }

        /// <summary>UTE-CHECKIN-{idDangKy}-{timestamp} hoặc legacy UTE|CHECKIN|...</summary>
        private static bool TryParseQrToken(string raw, out int idDangKy, out long timestampMs)
        {
            idDangKy = 0;
            timestampMs = 0;

            var dash = System.Text.RegularExpressions.Regex.Match(
                raw, @"^UTE-CHECKIN-(\d+)-(\d+)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (dash.Success)
            {
                idDangKy = int.Parse(dash.Groups[1].Value);
                timestampMs = long.Parse(dash.Groups[2].Value);
                return true;
            }

            var parts = raw.Split('|');
            if (parts.Length >= 5 && parts[0] == "UTE" && parts[1] == "CHECKIN"
                && int.TryParse(parts[2], out idDangKy) && long.TryParse(parts[4], out timestampMs))
                return true;

            return false;
        }
    }
}
