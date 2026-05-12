using aspiCore.Dtos.SuKien;

namespace aspiCore.Services
{
    public interface ISuKienService
    {
        Task<IEnumerable<SuKienDto>> GetAllAsync();
        Task<SuKienDto?> GetByIdAsync(int id);
        Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai);
        Task<SuKienDto> CreateAsync(CreateSuKienDto dto);
        Task<SuKienDto?> UpdateAsync(int id, UpdateSuKienDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
