using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("VaiTro_NguoiDung")]
public class VaiTro_NguoiDung
{
    public int IdVaiTro { get; set; }
    public string IdNguoiDung { get; set; } = string.Empty;
    public bool TrangThai { get; set; } = true;
    public DateTime ThoiGianCapQuan { get; set; } = DateTime.Now;

    [ForeignKey("IdVaiTro")]
    public virtual VaiTro? VaiTro { get; set; }

    [ForeignKey("IdNguoiDung")]
    public virtual NguoiDung? NguoiDung { get; set; }
}
