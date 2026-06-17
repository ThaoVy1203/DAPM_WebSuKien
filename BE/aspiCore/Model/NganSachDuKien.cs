using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("NganSachDuKien")]
    public class NganSachDuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("idNganSach")]
        public int IdNganSach { get; set; }

        [Required]
        [Column("idSuKien")]
        public int IdSuKien { get; set; }

        [Column("tongChiPhiDuKien", TypeName = "decimal(18,2)")]
        public decimal? TongChiPhiDuKien { get; set; }

        [Column("ghiChu", TypeName = "decimal(18,2)")]
        public decimal? ChiTietNganSach { get; set; }

        [Column("chiTietNganSach", TypeName = "nvarchar(max)")]
        public string? GhiChu { get; set; }

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }
    }
}
