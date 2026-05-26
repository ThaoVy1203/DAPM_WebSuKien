using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.DangKy;
using aspiCore.Dtos.Common;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DangKyController : ControllerBase
    {
        private readonly IDangKyService _dangKyService;

        public DangKyController(IDangKyService dangKyService)
        {
            _dangKyService = dangKyService;
        }

        [HttpPost("dang-ky")]
        public async Task<ActionResult<DangKyResponseDto>> DangKy([FromBody] DangKyDto dto)
        {
            var result = await _dangKyService.DangKySuKienAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("huy-dang-ky")]
        public async Task<ActionResult<ApiResponse>> HuyDangKy([FromBody] DangKyDto dto)
        {
            var result = await _dangKyService.HuyDangKyAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("check-in")]
        public async Task<ActionResult<ApiResponse>> CheckIn([FromBody] CheckInDto dto)
        {
            var result = await _dangKyService.CheckInAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>BTC quét QR: UTE-CHECKIN-{idDangKy}-{timestamp} (hết hạn sau 45 giây)</summary>
        [HttpPost("check-in-qr")]
        public async Task<ActionResult<ApiResponse>> CheckInByQr([FromBody] QrCheckInDto dto)
        {
            var result = await _dangKyService.CheckInByQrAsync(dto);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("check-out")]
        public async Task<ActionResult<ApiResponse>> CheckOut([FromBody] CheckOutWithFeedbackDto dto)
        {
            var result = await _dangKyService.CheckOutAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("su-kien/{idSuKien}")]
        public async Task<ActionResult<IEnumerable<DangKySuKienDto>>> GetBySuKien(int idSuKien)
        {
            var result = await _dangKyService.GetBySuKienAsync(idSuKien);
            return Ok(result);
        }

        [HttpGet("nguoi-dung/{idNguoiDung}")]
        public async Task<ActionResult<IEnumerable<DangKySuKienDto>>> GetByNguoiDung(string idNguoiDung)
        {
            var result = await _dangKyService.GetByNguoiDungAsync(idNguoiDung);
            return Ok(result);
        }

        /// <summary>
        /// Endpoint PUBLIC (không cần auth) — dùng cho QR quét bằng điện thoại
        /// GET /api/DangKy/public/{idDangKy}
        /// </summary>
        [HttpGet("public/{idDangKy}")]
        public async Task<ActionResult<DangKySuKienDto>> GetPublic(int idDangKy)
        {
            var result = await _dangKyService.GetByIdAsync(idDangKy);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy vé." });
            return Ok(result);
        }

        /// <summary>
        /// BTC xác nhận đăng ký: Chờ xác nhận → Đã xác nhận
        /// POST /api/DangKy/xac-nhan  body: { IdSuKien, IdNguoiDung }
        /// </summary>
        [HttpPost("xac-nhan")]
        public async Task<ActionResult<ApiResponse>> XacNhan([FromBody] DangKyDto dto)
        {
            var result = await _dangKyService.XacNhanDangKyAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// BTC từ chối đăng ký: Chờ xác nhận → Đã hủy
        /// POST /api/DangKy/tu-choi  body: { IdSuKien, IdNguoiDung }
        /// </summary>
        [HttpPost("tu-choi")]
        public async Task<ActionResult<ApiResponse>> TuChoi([FromBody] DangKyDto dto)
        {
            var result = await _dangKyService.TuChoiDangKyAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Người dùng xác nhận chỗ trong danh sách chờ (Waitlist).
        /// POST /api/DangKy/xac-nhan-cho-nguoi  body: { IdSuKien, IdNguoiDung }
        /// </summary>
        [HttpPost("xac-nhan-cho-nguoi")]
        public async Task<ActionResult<ApiResponse>> XacNhanChoNgoi([FromBody] DangKyDto dto)
        {
            var result = await _dangKyService.XacNhanChoNgoiAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
