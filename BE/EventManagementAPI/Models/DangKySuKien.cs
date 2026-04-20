using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventManagementAPI.Models;

[Table("DangKySuKien")]
public class DangKySuKien
{
    [Key]
    public int IdDangKy { get; set; }

    [Required]
    public int IdSuKien { get; set; }

    [Required]
    [MaxLength(5)]
    public string IdNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string TrangThai { get; set; } = "Chờ xác nhận";

    public DateTime ThoiGianDangKy { get; set; } = DateTime.Now;
    public DateTime? ThoiGianHuy { get; set; }
    public DateTime? ThoiGianCheckin { get; set; }
    public DateTime? ThoiGianCheckout { get; set; }

    [ForeignKey("IdSuKien")]
    public virtual SuKien? SuKien { get; set; }

    [ForeignKey("IdNguoiDung")]
    public virtual NguoiDung? NguoiDung { get; set; }
}
