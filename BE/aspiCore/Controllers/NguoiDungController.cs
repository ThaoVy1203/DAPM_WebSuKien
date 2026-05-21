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

        [HttpPost]
        public async Task<ActionResult<NguoiDungDto>> Create([FromBody] CreateNguoiDungDto dto)
        {
            var result = await _nguoiDungService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.IdNguoiDung }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<NguoiDungDto>> Update(string id, [FromBody] UpdateNguoiDungDto dto)
        {
            var result = await _nguoiDungService.UpdateAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng" });
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var result = await _nguoiDungService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy người dùng" });
            }
            return Ok(new { message = "Xóa người dùng thành công" });
        }
    }
}
