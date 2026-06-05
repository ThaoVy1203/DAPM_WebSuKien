using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.DanhMuc;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhMucController : ControllerBase
    {
        private readonly IDanhMucService _danhMucService;

        public DanhMucController(IDanhMucService danhMucService)
        {
            _danhMucService = danhMucService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhMucDto>>> GetAll()
        {
            var result = await _danhMucService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DanhMucDto>> GetById(int id)
        {
            var result = await _danhMucService.GetByIdAsync(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<DanhMucDto>> Create([FromBody] CreateDanhMucDto dto)
        {
            try
            {
                var result = await _danhMucService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.IdDanhMuc }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DanhMucDto>> Update(int id, [FromBody] UpdateDanhMucDto dto)
        {
            var result = await _danhMucService.UpdateAsync(id, dto);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _danhMucService.DeleteAsync(id);
            if (!result)
                return NotFound(new { message = "Không tìm thấy danh mục" });
            return NoContent();
        }
    }
}
