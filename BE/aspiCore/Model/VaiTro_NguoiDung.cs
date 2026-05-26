using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("VaiTro_NguoiDung")]
    public class VaiTro_NguoiDung
    {
        [Required]
        public int IdVaiTro { get; set; }

        [Required]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        [Required]
        public bool TrangThai { get; set; } = true;

        [Required]
        public DateTime ThoiGianCapQuan { get; set; } = DateTime.Now;

        [ForeignKey("IdVaiTro")]
        public VaiTro? VaiTro { get; set; }

        [ForeignKey("IdNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }
    }
}
