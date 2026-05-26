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
        public async Task<ActionResult<ApiResponse>> DangKy([FromBody] DangKyDto dto)
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

        [HttpPost("check-out")]
        public async Task<ActionResult<ApiResponse>> CheckOut([FromBody] CheckInDto dto)
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
    }
}
