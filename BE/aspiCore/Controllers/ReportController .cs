using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.Report;
using aspiCore.Data;
using aspiCore.Dtos.Common;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace aspiCore.Controllers
{
    [Route("api/reports")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly ApplicationDBContext _context;

        public ReportController(IReportService reportService, ApplicationDBContext context)
        {
            _reportService = reportService;
            _context = context;
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
            var result = await _reportService.GetDashboardAsync();
            return Ok(result);
        }

        [HttpGet("su-kien/{eventId}")]
        public async Task<ActionResult<IEnumerable<ReportDetailDto>>> GetReportsByEvent(int eventId)
        {
            var ev = await _context.SuKiens.FindAsync(eventId);
            if (ev == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy sự kiện" });
            }

            var eventName = ev.TenSuKien;

            var tasks = await _context.CongViecs.Where(c => c.IdSuKien == eventId).ToListAsync();
            var totalTasks = tasks.Count;
            var completedTasks = tasks.Count(c => c.TrangThai == "Hoàn thành");

            var registrations = await _context.DangKySuKiens.Where(d => d.IdSuKien == eventId).ToListAsync();
            var totalRegistrations = registrations.Count;
            var checkedIn = registrations.Count(d => d.ThoiGianCheckin != null);

            var budget = await _context.NganSachDuKiens.FirstOrDefaultAsync(n => n.IdSuKien == eventId);
            decimal totalBudget = budget?.TongChiPhiDuKien ?? 0;
            decimal spentBudget = budget?.ChiTietNganSach ?? 0;
            decimal remainingBudget = totalBudget - spentBudget;

            var eventReportContent = $@"
                <p><strong>I. Tổng quan sự kiện</strong></p>
                <p>Sự kiện <strong>{eventName}</strong> đã được lên kế hoạch và triển khai.</p>
                <p><strong>II. Tiến độ công việc</strong></p>
                <ul>
                    <li>Tổng số nhiệm vụ: {totalTasks}</li>
                    <li>Đã hoàn thành: {completedTasks} / {totalTasks} ({ (totalTasks > 0 ? (completedTasks * 100.0 / totalTasks).ToString("F1") : "0") }%)</li>
                </ul>
                <p><strong>III. Tình hình tham gia</strong></p>
                <ul>
                    <li>Tổng số sinh viên đăng ký: {totalRegistrations}</li>
                    <li>Số người đã có mặt điểm danh: {checkedIn} ({ (totalRegistrations > 0 ? (checkedIn * 100.0 / totalRegistrations).ToString("F1") : "0") }%)</li>
                </ul>";

            var budgetReportContent = $@"
                <p><strong>I. Tổng quan ngân sách</strong></p>
                <ul>
                    <li>Tổng dự toán ngân sách: {totalBudget:N0} đ</li>
                    <li>Tổng thực chi hiện tại: {spentBudget:N0} đ</li>
                    <li>Ngân sách còn lại: {remainingBudget:N0} đ</li>
                </ul>
                <p><strong>II. Chi tiết sử dụng ngân sách</strong></p>
                <p>Dữ liệu được cập nhật tự động từ mô-đun Quản lý Ngân sách.</p>";

            var reports = new List<ReportDetailDto>
            {
                new ReportDetailDto
                {
                    Id = 1,
                    Type = "event",
                    TypeLabel = "Báo cáo sự kiện",
                    TypeIcon = "fas fa-calendar-check",
                    Title = $"Báo cáo tổng kết {eventName}",
                    Status = "completed",
                    StatusLabel = "Hoàn thành",
                    Date = DateTime.Now.ToString("dd/MM/yyyy"),
                    Creator = "Trưởng Ban Tổ chức",
                    Event = eventName,
                    Updated = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                    Description = $"Báo cáo tổng kết sự kiện {eventName} với đầy đủ thông tin số liệu người tham gia, tiến độ hoàn thành các công việc và khảo sát mức độ hài lòng.",
                    Content = eventReportContent
                },
                new ReportDetailDto
                {
                    Id = 2,
                    Type = "budget",
                    TypeLabel = "Báo cáo tài chính",
                    TypeIcon = "fas fa-money-bill-wave",
                    Title = $"Báo cáo quyết toán ngân sách {eventName}",
                    Status = "completed",
                    StatusLabel = "Hoàn thành",
                    Date = DateTime.Now.ToString("dd/MM/yyyy"),
                    Creator = "Trưởng Ban Tổ chức",
                    Event = eventName,
                    Updated = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                    Description = $"Báo cáo chi tiết về tổng kinh phí dự chi so với thực chi của {eventName}.",
                    Content = budgetReportContent
                }
            };

            return Ok(reports);
        }
    }
}