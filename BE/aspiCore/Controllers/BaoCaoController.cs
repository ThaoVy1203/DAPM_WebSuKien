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
        /// Xuất Excel báo cáo sự kiện (cho BTC).
        /// File được lưu vào thư mục Reports/ trong dự án và trả về cho trình duyệt tải xuống.
        /// </summary>
        [HttpGet("xuat-excel/{idSuKien}")]
        public async Task<IActionResult> XuatExcel(int idSuKien)
        {
            try
            {
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

        /// <summary>
        /// Xuất Excel báo cáo tổng hợp toàn trường (cho CTSV).
        /// Sheet 1: Danh sách tất cả sự kiện theo trạng thái.
        /// Sheet 2: Thống kê tổng hợp.
        /// </summary>
        [HttpGet("xuat-excel-ctsv")]
        public async Task<IActionResult> XuatExcelCtsv()
        {
            try
            {
                string reportsDir = Path.Combine(_env.ContentRootPath, "..", "..", "Reports");
                reportsDir = Path.GetFullPath(reportsDir);

                var fileResult = await _baoCaoService.XuatExcelCtsvAsync(reportsDir);
                return fileResult;
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Xuất Excel báo cáo tổng thể (cho BGH - cấp 2).
        /// Sheet 1: Danh sách tất cả sự kiện.
        /// Sheet 2: Thống kê tổng hợp + Top 5 sự kiện quy mô lớn nhất.
        /// </summary>
        [HttpGet("xuat-excel-bgh")]
        public async Task<IActionResult> XuatExcelBgh()
        {
            try
            {
                string reportsDir = Path.Combine(_env.ContentRootPath, "..", "..", "Reports");
                reportsDir = Path.GetFullPath(reportsDir);

                var fileResult = await _baoCaoService.XuatExcelBghAsync(reportsDir);
                return fileResult;
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}