using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.DiaDiem;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiaDiemController : ControllerBase
    {
        private readonly IDiaDiemService _diaDiemService;

        public DiaDiemController(IDiaDiemService diaDiemService)
        {
            _diaDiemService = diaDiemService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiaDiemDto>>> GetAll()
        {
            var result = await _diaDiemService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DiaDiemDto>> GetById(int id)
        {
            var result = await _diaDiemService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy địa điểm" });
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<DiaDiemDto>> Create([FromBody] CreateDiaDiemDto dto)
        {
            try
            {
                var result = await _diaDiemService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.IdDiaDiem }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DiaDiemDto>> Update(int id, [FromBody] UpdateDiaDiemDto dto)
        {
            try
            {
                var result = await _diaDiemService.UpdateAsync(id, dto);
                if (result == null) return NotFound(new { message = "Không tìm thấy địa điểm" });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var result = await _diaDiemService.DeleteAsync(id);
                if (!result) return NotFound(new { message = "Không tìm thấy địa điểm" });
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
