using aspiCore.Dtos.NguoiDung;

namespace aspiCore.Services
{
    public interface INguoiDungService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto dto);
        Task<IEnumerable<NguoiDungDto>> GetAllAsync();
        Task<NguoiDungDto?> GetByIdAsync(string id);
        Task<NguoiDungDto> CreateAsync(CreateNguoiDungDto dto);
        Task<NguoiDungDto?> UpdateAsync(string id, UpdateNguoiDungDto dto);
        Task<bool> DeleteAsync(string id);
    }
}
