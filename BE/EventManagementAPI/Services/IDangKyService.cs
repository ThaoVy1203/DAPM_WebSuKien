using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services;

public interface IDangKyService
{
    Task<DangKyResponseDTO> DangKySuKienAsync(int idSuKien, string idNguoiDung);
    Task<DangKyResponseDTO> HuyDangKyAsync(int idSuKien, string idNguoiDung);
    Task<DangKyResponseDTO> CheckInAsync(int idSuKien, string idNguoiDung);
    Task<List<DangKySuKienDTO>> GetDangKyBySuKienAsync(int idSuKien);
    Task<List<DangKySuKienDTO>> GetDangKyByNguoiDungAsync(string idNguoiDung);
}
