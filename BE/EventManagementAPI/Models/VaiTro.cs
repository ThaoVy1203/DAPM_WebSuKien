using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("VaiTro")]
public class VaiTro
{
    [Key]
    public int IdVaiTro { get; set; }

    [Required]
    [MaxLength(50)]
    public string TenVaiTro { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? MoTa { get; set; }

    public virtual ICollection<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; } = new List<VaiTro_NguoiDung>();
}
