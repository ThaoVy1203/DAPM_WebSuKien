using System.Collections.Generic;

namespace aspiCore.Dtos.NganSach
{
    public class NganSachDto
    {
        public int IdNganSach { get; set; }
        public int IdSuKien { get; set; }
        public string? TenSuKien { get; set; }
        public decimal TongNganSach { get; set; }
        public decimal DaChi { get; set; }
        public decimal ConLai { get; set; }
        public string TrangThai { get; set; } = "Nháp";
        public string? GhiChu { get; set; }
        public List<NganSachItemDto> Items { get; set; } = new List<NganSachItemDto>();
    }

    public class NganSachItemDto
    {
        public string TenHangMuc { get; set; } = string.Empty;
        public string Loai { get; set; } = "other";
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public decimal ThanhTien { get; set; }
    }

    public class CreateUpdateNganSachDto
    {
        public int IdSuKien { get; set; }
        public decimal TongNganSach { get; set; }
        public decimal DaChi { get; set; }
        public string TrangThai { get; set; } = "Nháp";
        public string? GhiChu { get; set; }
        public List<NganSachItemDto> Items { get; set; } = new List<NganSachItemDto>();
    }
}
