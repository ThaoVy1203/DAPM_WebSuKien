using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("HoSoSuKien")]
    public class HoSoSuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("idHoSo")]
        public int IdHoSo { get; set; }

        [Required]
        [Column("idSuKien")]
        public int IdSuKien { get; set; }

        [Column("noiDungKeHoach")]
        public string? NoiDungKeHoach { get; set; }

        [MaxLength(50)]
        [Column("duTruNganSach")]
        public string? DuTruNganSach { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("trangThaiDuyet")]
        public string TrangThaiDuyet { get; set; } = "Chờ duyệt";

        [Required]
        [Column("thoiGianGui")]
        public DateTime ThoiGianGui { get; set; } = DateTime.Now;

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }

        public ICollection<LichSuPheDuyet> LichSuPheDuyets { get; set; } = new List<LichSuPheDuyet>();
    }
}
