using aspiCore.Dtos.DiaDiem;

namespace aspiCore.Services
{
    public interface IDiaDiemService
    {
        Task<IEnumerable<DiaDiemDto>> GetAllAsync();
        Task<DiaDiemDto?> GetByIdAsync(int id);
        Task<DiaDiemDto> CreateAsync(CreateDiaDiemDto dto);
        Task<DiaDiemDto?> UpdateAsync(int id, UpdateDiaDiemDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
