using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using aspiCore.Services;
using aspiCore.Dtos.ThongBao;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [Route("api/notifications")]
    [ApiController]
    public class ThongBaoController : ControllerBase
    {
        private readonly IThongBaoService _thongBaoService;

        public ThongBaoController(IThongBaoService thongBaoService)
        {
            _thongBaoService = thongBaoService;
        }

        // GET /api/ThongBao (hoặc /api/notifications)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThongBaoDto>>> GetByNguoiDung([FromQuery] string? idNguoiDung)
        {
            var userId = idNguoiDung ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "Thiếu idNguoiDung" });

            var result = await _thongBaoService.GetByNguoiDungAsync(userId);
            return Ok(result);
        }

        // GET /api/ThongBao/unread-count (hoặc /api/notifications/unread-count)
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount([FromQuery] string? idNguoiDung)
        {
            var userId = idNguoiDung ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "Thiếu idNguoiDung" });

            var result = await _thongBaoService.GetByNguoiDungAsync(userId);
            var count = result.Count(t => !t.DaDoc);
            return Ok(count);
        }

        // PUT /api/ThongBao/{id}/read (hoặc /api/notifications/{id}/read)
        [HttpPut("{id}/read")]
        public async Task<ActionResult> DanhDauDaDoc(int id)
        {
            var result = await _thongBaoService.DanhDauDaDocAsync(id);
            if (!result)
                return NotFound(new { message = "Không tìm thấy thông báo" });
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }

        // PUT /api/ThongBao/read-all (hoặc /api/notifications/read-all)
        [HttpPut("read-all")]
        public async Task<ActionResult> MarkAllAsRead([FromQuery] string? idNguoiDung)
        {
            var userId = idNguoiDung ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "Thiếu idNguoiDung" });

            await _thongBaoService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu tất cả đã đọc" });
        }
    }
}