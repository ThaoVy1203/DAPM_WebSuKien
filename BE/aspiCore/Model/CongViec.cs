using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("CongViec")]
    public class CongViec
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCongViec { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenCongViec { get; set; } = string.Empty;

        [Required]
        public int IdSuKien { get; set; }

        [MaxLength(100)]
        public string? TieuDe { get; set; }

        [MaxLength(100)]
        public string? MoTa { get; set; }

        public DateTime? HanChot { get; set; }

        [Required]
        [MaxLength(50)]
        public string TrangThai { get; set; } = "Chưa bắt đầu";

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }

        public ICollection<PhanCong> PhanCongs { get; set; } = new List<PhanCong>();
    }
}
