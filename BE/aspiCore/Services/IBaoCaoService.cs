using Microsoft.AspNetCore.Mvc;

namespace aspiCore.Services
{
    public interface IBaoCaoService
    {
        Task<FileResult> XuatExcelAsync(int idSuKien, string outputDir);
<<<<<<< HEAD
=======
        Task<FileResult> XuatExcelCtsvAsync(string outputDir);
        Task<FileResult> XuatExcelBghAsync(string outputDir);
>>>>>>> origin/VanHuy
    }
}