using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("VaiTro")]
    public class VaiTro
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdVaiTro { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenVaiTro { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        public ICollection<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; } = new List<VaiTro_NguoiDung>();
    }
}
