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

        /// <summary>Lý do hủy sự kiện</summary>
        [MaxLength(500)]
        public string? CancelReason { get; set; }

        /// <summary>Deadline hủy vé: số phút trước giờ bắt đầu sự kiện.</summary>
        public int GioHuyTruocBatDauPhut { get; set; } = 120;

        /// <summary>Yêu cầu gửi khảo sát khi check-out.</summary>
        public bool YeuCauKhaoSatCheckout { get; set; } = true;

        /// <summary>Đã được batch lifecycle xử lý sau khi sự kiện kết thúc.</summary>
        public bool DaXuLyKetThuc { get; set; } = false;

        /// <summary>
        /// true = BTC phải duyệt thủ công từng đăng ký (Chờ xác nhận → Đã xác nhận)
        /// false (mặc định) = tự động xác nhận ngay khi đăng ký
        /// Cần chạy DAPM_AlterTable.sql để thêm cột này vào DB trước khi bỏ [NotMapped]
        /// </summary>
        public bool YeuCauXacNhan { get; set; } = false;

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
        public ICollection<DangKyDanhGia> DangKyDanhGias { get; set; } = new List<DangKyDanhGia>();
        public ICollection<NguoiDung_SuKien> NguoiDung_SuKiens { get; set; } = new List<NguoiDung_SuKien>();
        public ICollection<ThongBao> ThongBaos { get; set; } = new List<ThongBao>();
        public ICollection<CongViec> CongViecs { get; set; } = new List<CongViec>();
        public ICollection<NganSachDuKien> NganSachDuKiens { get; set; } = new List<NganSachDuKien>();
        public ICollection<HoSoSuKien> HoSoSuKiens { get; set; } = new List<HoSoSuKien>();
    }
}