using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("DiaDiem")]
public class DiaDiem
{
    [Key]
    public int IdDiaDiem { get; set; }

    [Required]
    [MaxLength(50)]
    public string TenDiaDiem { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ViTri { get; set; }

    public int? SucChua { get; set; }

    [Required]
    [MaxLength(50)]
    public string TrangThaiSuDung { get; set; } = "Hoạt động";

    public virtual ICollection<SuKien> SuKiens { get; set; } = new List<SuKien>();
}
