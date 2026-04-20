using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public interface ISuKienService
{
    Task<List<SuKienDTO>> GetAllSuKiensAsync();
    Task<SuKienDTO?> GetSuKienByIdAsync(int id);
    Task<List<SuKienDTO>> GetSuKiensByTrangThaiAsync(string trangThai);
    Task<SuKienDTO> CreateSuKienAsync(CreateSuKienDTO dto, string idNguoiTao);
    Task<bool> UpdateSuKienAsync(int id, UpdateSuKienDTO dto);
    Task<bool> DeleteSuKienAsync(int id);
}
