using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public interface IDiaDiemService
{
    Task<List<DiaDiemDTO>> GetAllDiaDiemsAsync();
    Task<DiaDiemDTO?> GetDiaDiemByIdAsync(int id);
}
