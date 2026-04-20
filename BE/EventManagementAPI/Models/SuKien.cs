using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("SuKien")]
public class SuKien
{
    [Key]
    public int IdSuKien { get; set; }

    [Required]
    [MaxLength(50)]
    public string TenSuKien { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
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

    [Required]
    [MaxLength(20)]
    public string TrangThai { get; set; } = "Nháp";

    [MaxLength(5)]
    public string? CapPheDuyet { get; set; }

    public DateTime ThoiGianTao { get; set; } = DateTime.Now;

    [ForeignKey("IdDiaDiem")]
    public virtual DiaDiem? DiaDiem { get; set; }

    [ForeignKey("IdNguoiTao")]
    public virtual NguoiDung? NguoiTao { get; set; }

    public virtual ICollection<SuKien_DanhMuc> SuKien_DanhMucs { get; set; } = new List<SuKien_DanhMuc>();
    public virtual ICollection<DangKySuKien> DangKySuKiens { get; set; } = new List<DangKySuKien>();
}
