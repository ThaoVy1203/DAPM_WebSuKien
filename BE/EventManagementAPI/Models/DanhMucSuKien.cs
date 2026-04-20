using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("DanhMucSuKien")]
public class DanhMucSuKien
{
    [Key]
    public int IdDanhMuc { get; set; }

    [Required]
    [MaxLength(50)]
    public string TenDanhMuc { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? MoTa { get; set; }

    public virtual ICollection<SuKien_DanhMuc> SuKien_DanhMucs { get; set; } = new List<SuKien_DanhMuc>();
}
