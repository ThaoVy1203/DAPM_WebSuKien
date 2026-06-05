using aspiCore.Dtos.SuKien;

namespace aspiCore.Services
{
    public interface ISuKienService
    {
        Task<IEnumerable<SuKienDto>> GetAllAsync();
        Task<SuKienDto?> GetByIdAsync(int id);
        Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai);
        Task<IEnumerable<SuKienDto>> GetByNguoiTaoAsync(string idNguoiTao);
        Task<IEnumerable<SuKienDto>> SearchAsync(SuKienQueryDto query);
        Task<SuKienDto> CreateAsync(CreateSuKienDto dto);
        Task<SuKienDto?> UpdateAsync(int id, UpdateSuKienDto dto);
        Task<SuKienDto?> CancelAsync(int id, string? lyDoHuy);
        Task<bool> DeleteAsync(int id);
    }
}