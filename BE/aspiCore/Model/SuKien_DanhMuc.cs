using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspiCore.Model
{
    [Table("SuKien_DanhMuc")]
    public class SuKien_DanhMuc
    {
        [Required]
        public int IdSuKien { get; set; }

        [Required]
        public int IdDanhMuc { get; set; }

        [ForeignKey("IdSuKien")]
        public SuKien? SuKien { get; set; }

        [ForeignKey("IdDanhMuc")]
        public DanhMucSuKien? DanhMuc { get; set; }
    }
}
