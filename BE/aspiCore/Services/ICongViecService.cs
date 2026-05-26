using aspiCore.Dtos.CongViec;

namespace aspiCore.Services
{
    public interface ICongViecService
    {
        Task<IEnumerable<CongViecDto>> GetAllAsync();
        Task<CongViecDto?> GetByIdAsync(int id);
        Task<IEnumerable<CongViecDto>> GetBySuKienAsync(int idSuKien);
        Task<CongViecDto> CreateAsync(CreateCongViecDto dto);
        Task<CongViecDto?> UpdateAsync(int id, UpdateCongViecDto dto);
        Task<bool> DeleteAsync(int id);
    }
}