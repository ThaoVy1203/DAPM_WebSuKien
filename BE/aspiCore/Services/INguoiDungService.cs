using aspiCore.Dtos.NguoiDung;

namespace aspiCore.Services
{
    public interface INguoiDungService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto dto);
        Task<IEnumerable<NguoiDungDto>> GetAllAsync();
        Task<NguoiDungDto?> GetByIdAsync(string id);
    }
}
