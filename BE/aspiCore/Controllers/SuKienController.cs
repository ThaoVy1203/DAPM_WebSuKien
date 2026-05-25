using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.SuKien;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuKienController : ControllerBase
    {
        private readonly ISuKienService _suKienService;

        public SuKienController(ISuKienService suKienService)
        {
            _suKienService = suKienService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetAll()
        {
            var result = await _suKienService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SuKienDto>> GetById(int id)
        {
            var result = await _suKienService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return Ok(result);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetByTrangThai(string trangThai)
        {
            var result = await _suKienService.GetByTrangThaiAsync(trangThai);
            return Ok(result);
        }

        [HttpGet("nguoi-tao/{idNguoiTao}")]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetByNguoiTao(string idNguoiTao)
        {
            var result = await _suKienService.GetByNguoiTaoAsync(idNguoiTao);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<SuKienDto>> Create([FromBody] CreateSuKienDto dto)
        {
            try
            {
                var result = await _suKienService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.IdSuKien }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SuKienDto>> Update(int id, [FromBody] UpdateSuKienDto dto)
        {
            var result = await _suKienService.UpdateAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return Ok(result);
        }

        [HttpPut("{id}/huy")]
        public async Task<ActionResult<SuKienDto>> Cancel(int id, [FromBody] CancelSuKienDto dto)
        {
            try
            {
                var result = await _suKienService.CancelAsync(id, dto.LyDoHuy);
                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy sự kiện" });
                }
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _suKienService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return NoContent();
        }
    }
}
