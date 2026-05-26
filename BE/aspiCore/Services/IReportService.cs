using aspiCore.Dtos.Report;

namespace aspiCore.Services
{
    public interface IReportService
    {
        Task<DashboardDto> GetDashboardAsync();
    }
}