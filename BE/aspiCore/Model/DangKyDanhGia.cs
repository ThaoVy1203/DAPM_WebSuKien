using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("DangKyDanhGia")]
    public class DangKyDanhGia
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDanhGia { get; set; }

        [Required]
        public int IdDangKy { get; set; }

        [Required]
        [Range(1, 5)]
        public byte Diem { get; set; }

        [MaxLength(500)]
        public string? NhanXet { get; set; }

        [Required]
        public DateTime ThoiGianDanhGia { get; set; } = DateTime.Now;

        [ForeignKey("IdDangKy")]
        public DangKySuKien? DangKy { get; set; }
    }
}
