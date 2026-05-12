using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("ThongBao")]
    public class ThongBao
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdThongBao { get; set; }

        [Required]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        public int? IdSuKien { get; set; }

        [Required]
        [MaxLength(100)]
        public string TieuDe { get; set; } = string.Empty;

        public string? NoiDung { get; set; }

        [Required]
        public bool DaDoc { get; set; } = false;

        [Required]
        public DateTime ThoiGianGui { get; set; } = DateTime.Now;

        [ForeignKey("IdNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }
    }
}
