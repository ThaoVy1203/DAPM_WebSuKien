using Microsoft.AspNetCore.Mvc;

namespace aspiCore.Services
{
    public interface IBaoCaoService
    {
        Task<FileResult> XuatExcelAsync(int idSuKien, string outputDir);
        Task<FileResult> XuatExcelCtsvAsync(string outputDir);
        Task<FileResult> XuatExcelBghAsync(string outputDir);
    }
}