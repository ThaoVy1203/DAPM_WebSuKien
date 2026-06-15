using aspiCore.Dtos.ThongBao;

namespace aspiCore.Services
{
    public interface IThongBaoService
    {
        Task<IEnumerable<ThongBaoDto>> GetByNguoiDungAsync(string idNguoiDung);
        Task<bool> DanhDauDaDocAsync(int idThongBao);
        Task<bool> MarkAllAsReadAsync(string idNguoiDung);
    }
}