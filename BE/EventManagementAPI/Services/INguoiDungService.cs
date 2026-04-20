using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public interface INguoiDungService
{
    Task<NguoiDungDTO?> GetByIdAsync(string id);
    Task<LoginResponseDTO> LoginAsync(LoginDTO dto);
    Task<List<NguoiDungDTO>> GetAllNguoiDungsAsync();
}
