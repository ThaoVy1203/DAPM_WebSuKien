using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("NguoiDung_SuKien")]
    public class NguoiDung_SuKien
    {
        [Required]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        [Required]
        public int IdSuKien { get; set; }

        [Required]
        [MaxLength(50)]
        public string VaiTroTrongSuKien { get; set; } = "Thành viên";

        [ForeignKey("IdNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }
    }
}
