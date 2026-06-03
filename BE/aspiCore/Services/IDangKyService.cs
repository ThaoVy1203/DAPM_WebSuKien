using aspiCore.Dtos.Common;
using aspiCore.Dtos.DangKy;

namespace aspiCore.Services
{
    public interface IDangKyService
    {
<<<<<<< HEAD
        Task<IEnumerable<DangKySuKienDto>> GetAllAsync();
        Task<ApiResponse> DangKySuKienAsync(DangKyDto dto);
=======
        Task<DangKyResponseDto> DangKySuKienAsync(DangKyDto dto);
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
        Task<ApiResponse> HuyDangKyAsync(DangKyDto dto);
        Task<ApiResponse> XacNhanDangKyAsync(DangKyDto dto);
        Task<ApiResponse> TuChoiDangKyAsync(DangKyDto dto);
        Task<ApiResponse> XacNhanChoNgoiAsync(DangKyDto dto);
        Task<ApiResponse> CheckInAsync(CheckInDto dto);
        Task<ApiResponse> CheckInByQrAsync(QrCheckInDto dto);
        Task<ApiResponse> CheckOutAsync(CheckOutWithFeedbackDto dto);
        Task<int> ProcessLifecycleAsync();
        Task<DangKySuKienDto?> GetByIdAsync(int idDangKy);
        Task<IEnumerable<DangKySuKienDto>> GetBySuKienAsync(int idSuKien);
        Task<IEnumerable<DangKySuKienDto>> GetByNguoiDungAsync(string idNguoiDung);
    }
}
