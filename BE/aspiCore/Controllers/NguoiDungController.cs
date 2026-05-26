using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.NguoiDung;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NguoiDungController : ControllerBase
    {
        private readonly INguoiDungService _nguoiDungService;

        public NguoiDungController(INguoiDungService nguoiDungService)
        {
            _nguoiDungService = nguoiDungService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _nguoiDungService.LoginAsync(dto);
            if (!result.Success)
            {
                return Unauthorized(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NguoiDungDto>>> GetAll()
        {
            var result = await _nguoiDungService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NguoiDungDto>> GetById(string id)
        {
            var result = await _nguoiDungService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng" });
            }
            return Ok(result);
        }
    }
}
