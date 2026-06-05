using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("DangKySuKien")]
    public class DangKySuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDangKy { get; set; }

        [Required]
        public int IdSuKien { get; set; }

        [Required]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string TrangThai { get; set; } = "Chờ xác nhận";

        [Required]
        public DateTime ThoiGianDangKy { get; set; } = DateTime.Now;

        public DateTime? ThoiGianHuy { get; set; }

        public DateTime? ThoiGianCheckin { get; set; }

        public DateTime? ThoiGianCheckout { get; set; }
        public bool CheckoutTuDong { get; set; } = false;

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }

        [ForeignKey("IdNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }

        public DangKyDanhGia? DanhGia { get; set; }
    }
}
