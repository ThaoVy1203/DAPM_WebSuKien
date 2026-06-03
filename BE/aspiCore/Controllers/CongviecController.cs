using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.CongViec;

namespace aspiCore.Controllers
{
    [Route("api/tasks")]
    [ApiController]
    public class CongViecController : ControllerBase
    {
        private readonly ICongViecService _congViecService;

        public CongViecController(ICongViecService congViecService)
        {
            _congViecService = congViecService;
        }

        // GET /api/tasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CongViecDto>>> GetAll()
        {
            var result = await _congViecService.GetAllAsync();
            return Ok(result);
        }

        // GET /api/tasks/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CongViecDto>> GetById(int id)
        {
            var result = await _congViecService.GetByIdAsync(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy công việc" });
            return Ok(result);
        }

        // GET /api/tasks/su-kien/{idSuKien}
        [HttpGet("su-kien/{idSuKien}")]
        public async Task<ActionResult<IEnumerable<CongViecDto>>> GetBySuKien(int idSuKien)
        {
            var result = await _congViecService.GetBySuKienAsync(idSuKien);
            return Ok(result);
        }

        // POST /api/tasks
        [HttpPost]
        public async Task<ActionResult<CongViecDto>> Create([FromBody] CreateCongViecDto dto)
        {
            try
            {
                var result = await _congViecService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.IdCongViec }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT /api/tasks/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<CongViecDto>> Update(int id, [FromBody] UpdateCongViecDto dto)
        {
            var result = await _congViecService.UpdateAsync(id, dto);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy công việc" });
            return Ok(result);
        }

        // DELETE /api/tasks/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _congViecService.DeleteAsync(id);
            if (!result)
                return NotFound(new { message = "Không tìm thấy công việc" });
            return NoContent();
        }
    }
}