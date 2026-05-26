using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.Report;

namespace aspiCore.Controllers
{
    [Route("api/reports")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // GET /api/reports/dashboard
        // FE gọi: API.ReportAPI.getDashboard()
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var result = await _reportService.GetDashboardAsync();
            return Ok(result);
        }

        // GET /api/reports/export
        // FE gọi: API.ReportAPI.exportExcel()
        [HttpGet("export")]
        public async Task<ActionResult> ExportExcel()
        {
            // TODO: Implement Excel export nếu cần
            // Tạm thời trả về dashboard data dạng JSON
            var result = await _reportService.GetDashboardAsync();
            return Ok(result);
        }
    }
}