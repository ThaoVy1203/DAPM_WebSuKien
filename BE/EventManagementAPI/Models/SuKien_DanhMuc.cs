using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("SuKien_DanhMuc")]
public class SuKien_DanhMuc
{
    public int IdSuKien { get; set; }
    public int IdDanhMuc { get; set; }

    [ForeignKey("IdSuKien")]
    public virtual SuKien? SuKien { get; set; }

    [ForeignKey("IdDanhMuc")]
    public virtual DanhMucSuKien? DanhMuc { get; set; }
}
