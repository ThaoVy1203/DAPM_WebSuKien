using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("PhanCong")]
    public class PhanCong
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdPhanCong { get; set; }

        [Required]
        public int IdCongViec { get; set; }

        [Required]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? VaiTroTrongBTC { get; set; }

        [Required]
        public DateTime ThoiGianPhanCong { get; set; } = DateTime.Now;

        [ForeignKey("IdCongViec")]
        public CongViec? CongViec { get; set; }

        [ForeignKey("IdNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }
    }
}
