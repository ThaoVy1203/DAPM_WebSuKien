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
        private readonly ILogger<DangKyService> _logger;

        private const string STATUS_DELETED = "Đã hủy";
        private const string STATUS_WAITLIST = "Chờ chỗ";
        private const string STATUS_WAITLIST_CONFIRM = "Chờ người dùng xác nhận";
        private const string STATUS_CHECKED_IN = "Đã tham gia";
        private const string STATUS_COMPLETED = "Hoàn thành";
        private const string STATUS_ABSENT = "Vắng mặt";

        // Nếu được mời xác nhận chỗ mà không phản hồi trong 24h → hủy & đẩy người tiếp theo
        private static readonly TimeSpan USER_CONFIRM_WINDOW = TimeSpan.FromHours(24);

        public DangKyService(ApplicationDBContext context, ILogger<DangKyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task ExpireWaitlistConfirmationsAsync(int idSuKien)
        {
            var now = DateTime.Now;

            var expireThreshold = now - USER_CONFIRM_WINDOW;
            var expired = await _context.DangKySuKiens
                .Where(dk => dk.IdSuKien == idSuKien
                    && dk.TrangThai == STATUS_WAITLIST_CONFIRM
                    && dk.ThoiGianDangKy < expireThreshold)
                .ToListAsync();

            if (!expired.Any()) return;

            foreach (var dk in expired)
            {
                dk.TrangThai = STATUS_DELETED;
                dk.ThoiGianHuy = now;

                _context.ThongBaos.Add(new ThongBao
                {
                    IdNguoiDung = dk.IdNguoiDung,
                    IdSuKien = dk.IdSuKien,
                    TieuDe = "Hết hạn xác nhận chỗ",
                    NoiDung = $"Bạn không phản hồi xác nhận chỗ trong {USER_CONFIRM_WINDOW.TotalHours:0} giờ cho sự kiện. Đăng ký của bạn đã bị hủy.",
                    DaDoc = false,
                    ThoiGianGui = now
                });
            }

            await _context.SaveChangesAsync();
        }

        private async Task TryPromoteWaitlistAsync(int idSuKien)
        {
            var suKien = await _context.SuKiens.FindAsync(idSuKien);
            if (suKien == null) return;
            if (!suKien.SoLuongToiDa.HasValue) return;

            // Không đẩy Waitlist khi sự kiện đã kết thúc
            if (DateTime.Now > suKien.ThoiGianKetThuc) return;

            // 1) Hủy những người đã hết hạn xác nhận 24h (nếu có)
            await ExpireWaitlistConfirmationsAsync(idSuKien);

            var now = DateTime.Now;
            var reservedSeatCount = await _context.DangKySuKiens
                .CountAsync(dk => dk.IdSuKien == idSuKien
                    && dk.TrangThai != STATUS_DELETED
                    && dk.TrangThai != STATUS_WAITLIST);

            while (reservedSeatCount < suKien.SoLuongToiDa.Value)
            {
                // 2) Lấy người đầu tiên trong Waitlist
                var next = await _context.DangKySuKiens
                    .Include(dk => dk.SuKien)
                    .Where(dk => dk.IdSuKien == idSuKien && dk.TrangThai == STATUS_WAITLIST)
                    .OrderBy(dk => dk.ThoiGianDangKy)
                    .FirstOrDefaultAsync();

                if (next == null) break;

                // 3) Mời người dùng xác nhận chỗ (trong 24h)
                next.TrangThai = STATUS_WAITLIST_CONFIRM;
                next.ThoiGianDangKy = now;
                next.ThoiGianHuy = null;
                next.ThoiGianCheckin = null;
                next.ThoiGianCheckout = null;

                _context.ThongBaos.Add(new ThongBao
                {
                    IdNguoiDung = next.IdNguoiDung,
                    IdSuKien = next.IdSuKien,
                    TieuDe = "Bạn có chỗ từ danh sách chờ",
                    NoiDung = $"Bạn vừa được mời xác nhận chỗ cho sự kiện \"{suKien.TenSuKien}\". Vui lòng xác nhận trong 24h.\n[ACTION_VIEW_TICKET {next.IdDangKy}]\n[ACTION_CONFIRM_WAITLIST]",
                    DaDoc = false,
                    ThoiGianGui = now
                });

                reservedSeatCount++;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<DangKyResponseDto> DangKySuKienAsync(DangKyDto dto)
        {
            var suKien = await _context.SuKiens.FindAsync(dto.IdSuKien);
            // Cho phép đăng ký khi sự kiện đã duyệt hoặc đang diễn ra
            if (suKien == null || !new[] { "Đã duyệt", "Đang diễn ra" }.Contains(suKien.TrangThai))
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = "Sự kiện không tồn tại hoặc chưa được phê duyệt."
                };
            }

            // ── Kiểm tra thời gian: chỉ chặn khi sự kiện đã KẾT THÚC ──
            // Sự kiện đang diễn ra vẫn cho đăng ký (người đến muộn)
            // Sự kiện đã kết thúc → không cho đăng ký
            var now = DateTime.Now;
            if (now > suKien.ThoiGianKetThuc)
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = "Sự kiện đã kết thúc. Không thể đăng ký."
                };
            }

            var nguoiDung = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.IdNguoiDung == dto.IdNguoiDung);
            if (nguoiDung?.KhoaDangKyDen.HasValue == true && nguoiDung.KhoaDangKyDen.Value > now)
            {
                var remainDays = Math.Max(1, (int)Math.Ceiling((nguoiDung.KhoaDangKyDen.Value - now).TotalDays));
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = $"Tài khoản đang bị tạm khóa đăng ký do vắng mặt liên tiếp. Vui lòng thử lại sau {remainDays} ngày."
                };
            }
            // Lấy bản ghi đăng ký hiện tại (kể cả trạng thái "Đã hủy" để hỗ trợ đăng ký lại)
            var existingDangKy = await _context.DangKySuKiens
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien
                    && dk.IdNguoiDung == dto.IdNguoiDung);

            if (existingDangKy != null && existingDangKy.TrangThai != "Đã hủy")
            {
                return new DangKyResponseDto
                {
                    Success = false,
                    Message = "Bạn đã đăng ký sự kiện này rồi.",
                    IdDangKy = existingDangKy.IdDangKy,
                    TrangThai = existingDangKy.TrangThai
                };
            }

            // Kiểm tra giới hạn chỗ: chỉ tính các trạng thái "đang chiếm chỗ", không tính Waitlist ("Chờ chỗ")
            var reservedSeatCount = 0;
            if (suKien.SoLuongToiDa.HasValue)
            {
                reservedSeatCount = await _context.DangKySuKiens
                    .CountAsync(dk => dk.IdSuKien == dto.IdSuKien
                        && dk.TrangThai != "Đã hủy"
                        && dk.TrangThai != "Chờ chỗ");
            }

            var isFull = suKien.SoLuongToiDa.HasValue && reservedSeatCount >= suKien.SoLuongToiDa.Value;

            // Nếu full → vào danh sách chờ
            // Không full → trạng thái ban đầu theo yêu cầu duyệt thủ công
            var trangThaiDangKy = isFull
                ? "Chờ chỗ"
                : (suKien.YeuCauXacNhan ? "Chờ xác nhận" : "Đã xác nhận");

            DangKySuKien dangKy;
            if (existingDangKy != null)
            {
                // Đăng ký lại sau khi đã hủy: cập nhật record thay vì insert (tránh unique constraint)
                dangKy = existingDangKy;
                dangKy.TrangThai = trangThaiDangKy;
                dangKy.ThoiGianDangKy = DateTime.Now;
                dangKy.ThoiGianHuy = null;
                dangKy.ThoiGianCheckin = null;
                dangKy.ThoiGianCheckout = null;
            }
            else
            {
                dangKy = new DangKySuKien
                {
                    IdSuKien = dto.IdSuKien,
                    IdNguoiDung = dto.IdNguoiDung,
                    TrangThai = trangThaiDangKy,
                    ThoiGianDangKy = DateTime.Now
                };
                _context.DangKySuKiens.Add(dangKy);
            }

            // Tạo thông báo phù hợp với trạng thái
            string noiDungThongBao;
            string tieuDeThongBao;

            if (trangThaiDangKy == "Chờ chỗ")
            {
                tieuDeThongBao = "Bạn đã vào danh sách chờ";
                noiDungThongBao =
                    $"Sự kiện \"{suKien.TenSuKien}\" đã hết chỗ. Bạn đã được xếp vào danh sách chờ. Khi có chỗ, hệ thống sẽ mời bạn xác nhận trong 24h.";
            }
            else if (trangThaiDangKy == "Chờ xác nhận")
            {
                tieuDeThongBao = "Đăng ký đang chờ xác nhận";
                noiDungThongBao =
                    $"Bạn đã đăng ký tham gia \"{suKien.TenSuKien}\". Đăng ký đang chờ ban tổ chức xác nhận.";
            }
            else
            {
                tieuDeThongBao = "Đăng ký sự kiện thành công";
                noiDungThongBao =
                    $"Bạn đã đăng ký tham gia \"{suKien.TenSuKien}\" thành công. Vui lòng check-in đúng giờ.";
            }

            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dto.IdNguoiDung,
                IdSuKien = dto.IdSuKien,
                TieuDe = tieuDeThongBao,
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
                    : trangThaiDangKy == "Chờ chỗ"
                        ? "Đăng ký thành công. Bạn đã được xếp vào danh sách chờ."
                    : "Đăng ký thành công.",
                IdDangKy = dangKy.IdDangKy,
                TrangThai = trangThaiDangKy
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

            if (dangKy.SuKien != null)
            {
                // GioHuyTruocBatDauPhut là [NotMapped] nên luôn = 0 khi đọc từ DB.
                // Dùng giá trị mặc định 120 phút nếu bằng 0 để tránh cutoff = giờ bắt đầu.
                var gioHuy = dangKy.SuKien.GioHuyTruocBatDauPhut > 0
                    ? dangKy.SuKien.GioHuyTruocBatDauPhut
                    : 120;
                var cutoff = dangKy.SuKien.ThoiGianBatDau.AddMinutes(-gioHuy);
                if (DateTime.Now > cutoff)
                {
                    return new ApiResponse
                    {
                        Success = false,
                        Message = $"Đã quá hạn hủy vé. Bạn chỉ có thể hủy trước giờ bắt đầu {gioHuy} phút."
                    };
                }
            }

            if (!new[] { "Đã xác nhận", "Chờ xác nhận", "Chờ chỗ", "Chờ người dùng xác nhận" }.Contains(dangKy.TrangThai))
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Không thể hủy đăng ký ở trạng thái hiện tại."
                };
            }

            dangKy.TrangThai = STATUS_DELETED;
            dangKy.ThoiGianHuy = DateTime.Now;
            await _context.SaveChangesAsync();

            // Mở thêm chỗ cho Waitlist — lỗi ở bước này không ảnh hưởng kết quả hủy
            try { await TryPromoteWaitlistAsync(dangKy.IdSuKien); }
            catch (Exception ex) { _logger.LogError(ex, "TryPromoteWaitlistAsync failed for SuKien {Id}", dangKy.IdSuKien); }

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

            dangKy.TrangThai = STATUS_CHECKED_IN;
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

            // Offline fallback: dùng ScanTimeMs nếu có (kiosk ghi nhận lúc quét, sync sau).
            // Với QR tĩnh (UTE-CHECKIN-S-{id}) thì timestampMs = 0 => bỏ qua kiểm tra hết hạn 45s.
            var scanMs = dto.ScanTimeMs ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var scanLocal = DateTimeOffset.FromUnixTimeMilliseconds(scanMs).LocalDateTime;

            if (timestampMs > 0 && Math.Abs(scanMs - timestampMs) > 45_000)
                return new ApiResponse { Success = false, Message = "Mã QR đã hết hạn. Vui lòng làm mới mã trên điện thoại." };

            var dangKy = await _context.DangKySuKiens
                .Include(dk => dk.SuKien)
                .FirstOrDefaultAsync(dk => dk.IdDangKy == idDangKy && dk.TrangThai == "Đã xác nhận");

            if (dangKy == null)
                return new ApiResponse { Success = false, Message = "Vé không hợp lệ hoặc chưa được xác nhận." };

            if (dangKy.SuKien != null)
            {
                var checkInOpen = dangKy.SuKien.ThoiGianBatDau.AddMinutes(-30);
                if (scanLocal < checkInOpen)
                {
                    var minutesLeft = (int)Math.Ceiling((checkInOpen - scanLocal).TotalMinutes);
                    return new ApiResponse
                    {
                        Success = false,
                        Message = $"Chưa đến giờ check-in. Mở sau {minutesLeft} phút nữa."
                    };
                }
                if (scanLocal > dangKy.SuKien.ThoiGianKetThuc)
                    return new ApiResponse { Success = false, Message = "Sự kiện đã kết thúc. Không thể check-in." };
            }

            dangKy.TrangThai = STATUS_CHECKED_IN;
            dangKy.ThoiGianCheckin = scanLocal;
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Check-in thành công qua QR."
            };
        }

        public async Task<ApiResponse> CheckOutAsync(CheckOutWithFeedbackDto dto)
        {
            var dangKy = await _context.DangKySuKiens
                .Include(dk => dk.SuKien)
                .FirstOrDefaultAsync(dk => dk.IdSuKien == dto.IdSuKien
                    && dk.IdNguoiDung == dto.IdNguoiDung
                    && dk.TrangThai == STATUS_CHECKED_IN);

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

            var needSurvey = dangKy.SuKien?.YeuCauKhaoSatCheckout ?? true;
            if (needSurvey)
            {
                if (!dto.Diem.HasValue || dto.Diem < 1 || dto.Diem > 5)
                {
                    return new ApiResponse
                    {
                        Success = false,
                        Message = "Vui lòng hoàn thành đánh giá 1-5 sao để check-out."
                    };
                }

                var oldFeedback = await _context.DangKyDanhGias.FirstOrDefaultAsync(x => x.IdDangKy == dangKy.IdDangKy);
                if (oldFeedback == null)
                {
                    _context.DangKyDanhGias.Add(new DangKyDanhGia
                    {
                        IdDangKy = dangKy.IdDangKy,
                        Diem = dto.Diem.Value,
                        NhanXet = string.IsNullOrWhiteSpace(dto.NhanXet) ? null : dto.NhanXet.Trim(),
                        ThoiGianDanhGia = DateTime.Now
                    });
                }
                else
                {
                    oldFeedback.Diem = dto.Diem.Value;
                    oldFeedback.NhanXet = string.IsNullOrWhiteSpace(dto.NhanXet) ? null : dto.NhanXet.Trim();
                    oldFeedback.ThoiGianDanhGia = DateTime.Now;
                }
            }

            dangKy.ThoiGianCheckout = DateTime.Now;
            dangKy.CheckoutTuDong = false;
            dangKy.TrangThai = STATUS_COMPLETED;
            await RecalculateTrustForUserAsync(dangKy.IdNguoiDung, DateTime.Now);
            await _context.SaveChangesAsync();

            return new ApiResponse
            {
                Success = true,
                Message = "Check-out thành công. Cảm ơn bạn đã tham gia sự kiện!"
            };
        }

        public async Task<int> ProcessLifecycleAsync()
        {
            var now = DateTime.Now;
            var events = await _context.SuKiens
                .Where(sk => sk.ThoiGianKetThuc <= now && !sk.DaXuLyKetThuc)
                .ToListAsync();
            if (!events.Any()) return 0;

            var touchedUsers = new HashSet<string>();

            foreach (var sk in events)
            {
                var regs = await _context.DangKySuKiens
                    .Where(dk => dk.IdSuKien == sk.IdSuKien)
                    .ToListAsync();

                foreach (var dk in regs)
                {
                    if (dk.TrangThai == "Đã xác nhận" && !dk.ThoiGianCheckin.HasValue)
                    {
                        dk.TrangThai = STATUS_ABSENT;
                        touchedUsers.Add(dk.IdNguoiDung);
                    }

                    if (dk.TrangThai == STATUS_CHECKED_IN && dk.ThoiGianCheckin.HasValue && !dk.ThoiGianCheckout.HasValue)
                    {
                        var autoCheckoutTime = sk.ThoiGianBatDau.AddMinutes((sk.ThoiGianKetThuc - sk.ThoiGianBatDau).TotalMinutes * 0.75);
                        if (autoCheckoutTime < dk.ThoiGianCheckin.Value) autoCheckoutTime = dk.ThoiGianCheckin.Value;
                        if (autoCheckoutTime > sk.ThoiGianKetThuc) autoCheckoutTime = sk.ThoiGianKetThuc;

                        dk.ThoiGianCheckout = autoCheckoutTime;
                        dk.CheckoutTuDong = true;
                        dk.TrangThai = STATUS_COMPLETED;
                        touchedUsers.Add(dk.IdNguoiDung);
                    }
                }

                sk.DaXuLyKetThuc = true;
            }

            foreach (var userId in touchedUsers)
            {
                await RecalculateTrustForUserAsync(userId, now);
            }

            await _context.SaveChangesAsync();
            return events.Count;
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
                    GioHuyTruocBatDauPhut = dk.SuKien != null ? dk.SuKien.GioHuyTruocBatDauPhut : 120,
                    YeuCauKhaoSatCheckout = dk.SuKien == null || dk.SuKien.YeuCauKhaoSatCheckout,
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

        /// <summary>
        /// Người dùng xác nhận chỗ từ Waitlist:
        ///   Chờ người dùng xác nhận → Đã xác nhận
        /// Hiệu lực 24h.
        /// </summary>
        public async Task<ApiResponse> XacNhanChoNgoiAsync(DangKyDto dto)
        {
            var dk = await _context.DangKySuKiens
                .Include(d => d.SuKien)
                .FirstOrDefaultAsync(d => d.IdSuKien == dto.IdSuKien
                    && d.IdNguoiDung == dto.IdNguoiDung
                    && d.TrangThai == STATUS_WAITLIST_CONFIRM);

            if (dk == null)
                return new ApiResponse { Success = false, Message = "Không tìm thấy yêu cầu xác nhận chỗ." };

            var now = DateTime.Now;
            if (dk.ThoiGianDangKy.Add(USER_CONFIRM_WINDOW) < now)
            {
                dk.TrangThai = STATUS_DELETED;
                dk.ThoiGianHuy = now;

                _context.ThongBaos.Add(new ThongBao
                {
                    IdNguoiDung = dk.IdNguoiDung,
                    IdSuKien = dk.IdSuKien,
                    TieuDe = "Hết hạn xác nhận chỗ",
                    NoiDung = $"Bạn không phản hồi xác nhận chỗ trong 24h cho sự kiện \"{dk.SuKien?.TenSuKien}\".",
                    DaDoc = false,
                    ThoiGianGui = now
                });

                await _context.SaveChangesAsync();
                await TryPromoteWaitlistAsync(dk.IdSuKien);

                return new ApiResponse { Success = false, Message = "Lời mời xác nhận đã hết hạn (24h)." };
            }

            dk.TrangThai = "Đã xác nhận";
            dk.ThoiGianHuy = null;
            dk.ThoiGianCheckin = null;
            dk.ThoiGianCheckout = null;

            _context.ThongBaos.Add(new ThongBao
            {
                IdNguoiDung = dk.IdNguoiDung,
                IdSuKien = dk.IdSuKien,
                TieuDe = "Xác nhận chỗ thành công",
                NoiDung = $"Bạn đã xác nhận chỗ cho sự kiện \"{dk.SuKien?.TenSuKien}\". Vui lòng check-in đúng giờ.",
                DaDoc = false,
                ThoiGianGui = now
            });

            await _context.SaveChangesAsync();
            return new ApiResponse { Success = true, Message = "Đã xác nhận chỗ từ danh sách chờ." };
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
                    GioHuyTruocBatDauPhut = dk.SuKien != null ? dk.SuKien.GioHuyTruocBatDauPhut : 120,
                    YeuCauKhaoSatCheckout = dk.SuKien == null || dk.SuKien.YeuCauKhaoSatCheckout,
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
                    GioHuyTruocBatDauPhut = dk.SuKien != null ? dk.SuKien.GioHuyTruocBatDauPhut : 120,
                    YeuCauKhaoSatCheckout = dk.SuKien == null || dk.SuKien.YeuCauKhaoSatCheckout,
                    TenDiaDiem        = dk.SuKien != null && dk.SuKien.DiaDiem != null ? dk.SuKien.DiaDiem.TenDiaDiem : ""
                })
                .ToListAsync();
        }

        private async Task RecalculateTrustForUserAsync(string idNguoiDung, DateTime now)
        {
            var user = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.IdNguoiDung == idNguoiDung);
            if (user == null) return;

            var statuses = await _context.DangKySuKiens
                .Where(dk => dk.IdNguoiDung == idNguoiDung)
                .Include(dk => dk.SuKien)
                .Where(dk => dk.SuKien != null && dk.SuKien.ThoiGianKetThuc <= now)
                .OrderByDescending(dk => dk.SuKien!.ThoiGianKetThuc)
                .Select(dk => dk.TrangThai)
                .Take(10)
                .ToListAsync();

            var consecutiveAbsent = 0;
            foreach (var s in statuses)
            {
                if (s == STATUS_ABSENT) consecutiveAbsent++;
                else break;
            }

            user.SoVangMatLienTiep = consecutiveAbsent;
            if (consecutiveAbsent >= 3)
            {
                user.KhoaDangKyDen = now.AddMonths(1);
            }
            else if (user.KhoaDangKyDen.HasValue && user.KhoaDangKyDen.Value <= now)
            {
                user.KhoaDangKyDen = null;
            }
        }

        /// <summary>UTE-CHECKIN-{idDangKy}-{timestamp} hoặc legacy UTE|CHECKIN|...</summary>
        private static bool TryParseQrToken(string raw, out int idDangKy, out long timestampMs)
        {
            idDangKy = 0;
            timestampMs = 0;

            // QR tĩnh (offline): UTE-CHECKIN-S-{idDangKy}
            var staticMatch = System.Text.RegularExpressions.Regex.Match(
                raw, @"^UTE-CHECKIN-S-(\d+)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (staticMatch.Success)
            {
                idDangKy = int.Parse(staticMatch.Groups[1].Value);
                timestampMs = 0;
                return true;
            }

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
