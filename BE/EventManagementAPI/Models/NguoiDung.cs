using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("NguoiDung")]
public class NguoiDung
{
    [Key]
    [MaxLength(5)]
    public string IdNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string MaSoSSO { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string HoTen { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(11)]
    public string? SDT { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? AnhDaiDien { get; set; }

    [Required]
    [MaxLength(30)]
    public string MatKhauSSO { get; set; } = string.Empty;

    public virtual ICollection<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; } = new List<VaiTro_NguoiDung>();
    public virtual ICollection<SuKien> SuKiens { get; set; } = new List<SuKien>();
    public virtual ICollection<DangKySuKien> DangKySuKiens { get; set; } = new List<DangKySuKien>();
}
