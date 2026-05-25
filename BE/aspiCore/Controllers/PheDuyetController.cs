using Microsoft.AspNetCore.Mvc;
using aspiCore.Dtos.Common;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PheDuyetController : ControllerBase
    {
        [HttpGet]
        public ActionResult<IEnumerable<object>> GetAll()
        {
            // Dummy endpoint to prevent 404 for frontend
            return Ok(new List<object>());
        }

        [HttpGet("{id}")]
        public ActionResult<object> GetById(int id)
        {
            return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy" });
        }

        [HttpPost]
        public ActionResult<object> Create([FromBody] object dto)
        {
            return Ok(new ApiResponse { Success = true, Message = "Tạo thành công" });
        }

        [HttpPut("{id}")]
        public ActionResult<object> Update(int id, [FromBody] object dto)
        {
            return Ok(new ApiResponse { Success = true, Message = "Cập nhật thành công" });
        }
        
        [HttpPut("cancel/{id}")]
        public ActionResult<object> Cancel(int id)
        {
            return Ok(new ApiResponse { Success = true, Message = "Hủy thành công" });
        }

        [HttpDelete("{id}")]
        public ActionResult<object> Delete(int id)
        {
            return Ok(new ApiResponse { Success = true, Message = "Xóa thành công" });
        }
    }
}
