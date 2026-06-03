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

        /// <summary>
        /// Lấy tất cả danh mục
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhMucDto>>> GetAll()
        {
            var result = await _danhMucService.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh mục theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<DanhMucDto>> GetById(int id)
        {
            var result = await _danhMucService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }
            return Ok(result);
        }

        /// <summary>
        /// Tạo danh mục mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<DanhMucDto>> Create([FromBody] CreateDanhMucDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _danhMucService.CreateAsync(dto);
            if (result == null)
            {
                return BadRequest(new { message = "Không thể tạo danh mục" });
            }

            return CreatedAtAction(nameof(GetById), new { id = result.IdDanhMuc }, result);
        }

        /// <summary>
        /// Cập nhật danh mục
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<DanhMucDto>> Update(int id, [FromBody] UpdateDanhMucDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != dto.IdDanhMuc)
            {
                return BadRequest(new { message = "ID trong URL và body không khớp" });
            }

            var result = await _danhMucService.UpdateAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }
            return Ok(result);
        }

        /// <summary>
        /// Xóa danh mục
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _danhMucService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }
            return Ok(new { message = "Xóa danh mục thành công" });
        }
    }
}