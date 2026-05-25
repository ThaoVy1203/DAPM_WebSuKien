using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("SuKien")]
    public class SuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdSuKien { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenSuKien { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        [Required]
        public DateTime ThoiGianBatDau { get; set; }

        [Required]
        public DateTime ThoiGianKetThuc { get; set; }

        public int? IdDiaDiem { get; set; }

        [Required]
        [MaxLength(5)]
        public string IdNguoiTao { get; set; } = string.Empty;

        public int? SoLuongToiDa { get; set; }

        public string? HinhAnh { get; set; }

        [Required]
        [MaxLength(20)]
        public string TrangThai { get; set; } = "Nháp";

        [MaxLength(5)]
        public string? CapPheDuyet { get; set; }

        [Required]
        public DateTime ThoiGianTao { get; set; } = DateTime.Now;

        [ForeignKey("IdDiaDiem")]
        public DiaDiem? DiaDiem { get; set; }

        [ForeignKey("IdNguoiTao")]
        public NguoiDung? NguoiTao { get; set; }

        public ICollection<SuKien_DanhMuc> SuKien_DanhMucs { get; set; } = new List<SuKien_DanhMuc>();
        public ICollection<DangKySuKien> DangKySuKiens { get; set; } = new List<DangKySuKien>();
        public ICollection<NguoiDung_SuKien> NguoiDung_SuKiens { get; set; } = new List<NguoiDung_SuKien>();
        public ICollection<ThongBao> ThongBaos { get; set; } = new List<ThongBao>();
        public ICollection<CongViec> CongViecs { get; set; } = new List<CongViec>();
    }
}
