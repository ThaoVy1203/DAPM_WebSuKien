using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaoCaoController : ControllerBase
    {
        private readonly IBaoCaoService _baoCaoService;
        private readonly IWebHostEnvironment _env;

        public BaoCaoController(IBaoCaoService baoCaoService, IWebHostEnvironment env)
        {
            _baoCaoService = baoCaoService;
            _env = env;
        }

        /// <summary>
        /// Xuất Excel báo cáo sự kiện.
        /// File được lưu vào thư mục Reports/ trong dự án và trả về cho trình duyệt tải xuống.
        /// </summary>
        [HttpGet("xuat-excel/{idSuKien}")]
        public async Task<IActionResult> XuatExcel(int idSuKien)
        {
            try
            {
                // Đường dẫn thư mục Reports nằm cùng cấp với BE/
                string reportsDir = Path.Combine(_env.ContentRootPath, "..", "..", "Reports");
                reportsDir = Path.GetFullPath(reportsDir);

                var fileResult = await _baoCaoService.XuatExcelAsync(idSuKien, reportsDir);
                return fileResult;
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}