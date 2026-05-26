using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("DanhMucSuKien")]
    public class DanhMucSuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDanhMuc { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenDanhMuc { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        public ICollection<SuKien_DanhMuc> SuKien_DanhMucs { get; set; } = new List<SuKien_DanhMuc>();
    }
}
