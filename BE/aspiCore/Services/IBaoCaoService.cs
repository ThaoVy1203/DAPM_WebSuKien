using Microsoft.AspNetCore.Mvc;

namespace aspiCore.Services
{
    public interface IBaoCaoService
    {
        Task<FileResult> XuatExcelAsync(int idSuKien, string outputDir);
    }
}