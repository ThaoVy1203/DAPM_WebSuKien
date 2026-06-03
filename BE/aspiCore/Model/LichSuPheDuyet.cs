using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("LichSuPheDuyet")]
    public class LichSuPheDuyet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("idPheDuyet")]
        public int IdPheDuyet { get; set; }

        [Required]
        [Column("idHoSo")]
        public int IdHoSo { get; set; }

        [Required]
        [MaxLength(5)]
        [Column("idNguoiDuyet")]
        public string IdNguoiDuyet { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("capDuyet")]
        public string? CapDuyet { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("ketQua")]
        public string KetQua { get; set; } = "Đồng ý";

        [MaxLength(100)]
        [Column("ghiChu")]
        public string? GhiChu { get; set; }

        [Required]
        [Column("thoiGianPheDuyet")]
        public DateTime ThoiGianPheDuyet { get; set; } = DateTime.Now;

        [ForeignKey("IdHoSo")]
        public HoSoSuKien? HoSo { get; set; }

        [ForeignKey("IdNguoiDuyet")]
        public NguoiDung? NguoiDuyet { get; set; }
    }
}
