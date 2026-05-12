using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("DiaDiem")]
    public class DiaDiem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDiaDiem { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenDiaDiem { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ViTri { get; set; }

        public int? SucChua { get; set; }

        [Required]
        [MaxLength(50)]
        public string TrangThaiSuDung { get; set; } = "Hoạt động";

        public ICollection<SuKien> SuKiens { get; set; } = new List<SuKien>();
    }
}
