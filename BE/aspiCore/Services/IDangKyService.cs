using aspiCore.Dtos.Common;
using aspiCore.Dtos.DangKy;

namespace aspiCore.Services
{
    public interface IDangKyService
    {
        Task<IEnumerable<DangKySuKienDto>> GetAllAsync();
        Task<ApiResponse> DangKySuKienAsync(DangKyDto dto);
        Task<ApiResponse> HuyDangKyAsync(DangKyDto dto);
        Task<ApiResponse> CheckInAsync(CheckInDto dto);
        Task<IEnumerable<DangKySuKienDto>> GetBySuKienAsync(int idSuKien);
        Task<IEnumerable<DangKySuKienDto>> GetByNguoiDungAsync(string idNguoiDung);
    }
}
