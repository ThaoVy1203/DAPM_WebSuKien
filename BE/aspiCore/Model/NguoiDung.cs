using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("NguoiDung")]
    public class NguoiDung
    {
        [Key]
        [MaxLength(5)]
        public string IdNguoiDung { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        public string MaSoSSO { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string HoTen { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(11)]
        public string? SDT { get; set; }

        public string? AnhDaiDien { get; set; }

        [Required]
        [MaxLength(30)]
        public string MatKhauSSO { get; set; } = string.Empty;

<<<<<<< HEAD
        [NotMapped]
        public int SoVangMatLienTiep { get; set; } = 0;
        [NotMapped]
        public DateTime? KhoaDangKyDen { get; set; }
=======
        /// <summary>Trạng thái tài khoản: true = Hoạt động, false = Tạm khóa</summary>
        public bool TrangThai { get; set; } = true;
>>>>>>> origin/Nguyen

        public ICollection<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; } = new List<VaiTro_NguoiDung>();
        public ICollection<SuKien> SuKiensTao { get; set; } = new List<SuKien>();
        public ICollection<DangKySuKien> DangKySuKiens { get; set; } = new List<DangKySuKien>();
        public ICollection<NguoiDung_SuKien> NguoiDung_SuKiens { get; set; } = new List<NguoiDung_SuKien>();
        public ICollection<ThongBao> ThongBaos { get; set; } = new List<ThongBao>();
    }
}
