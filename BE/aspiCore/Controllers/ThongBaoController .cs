using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.ThongBao;

namespace aspiCore.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    public class ThongBaoController : ControllerBase
    {
        private readonly IThongBaoService _thongBaoService;

        public ThongBaoController(IThongBaoService thongBaoService)
        {
            _thongBaoService = thongBaoService;
        }

        // GET /api/notifications?idNguoiDung=ND001
        // FE gọi: API.UserAPI.getNotifications()
        // Lưu ý: FE cần truyền idNguoiDung qua query string hoặc lấy từ token
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThongBaoDto>>> GetByNguoiDung([FromQuery] string idNguoiDung)
        {
            if (string.IsNullOrEmpty(idNguoiDung))
                return BadRequest(new { message = "Thiếu idNguoiDung" });

            var result = await _thongBaoService.GetByNguoiDungAsync(idNguoiDung);
            return Ok(result);
        }

        // PUT /api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<ActionResult> DanhDauDaDoc(int id)
        {
            var result = await _thongBaoService.DanhDauDaDocAsync(id);
            if (!result)
                return NotFound(new { message = "Không tìm thấy thông báo" });
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }
    }
}