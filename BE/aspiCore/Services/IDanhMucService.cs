using aspiCore.Dtos.DanhMuc;

namespace aspiCore.Services
{
    public interface IDanhMucService
    {
        Task<IEnumerable<DanhMucDto>> GetAllAsync();
        Task<DanhMucDto?> GetByIdAsync(int id);
        Task<DanhMucDto> CreateAsync(CreateDanhMucDto dto);
        Task<DanhMucDto?> UpdateAsync(int id, UpdateDanhMucDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
