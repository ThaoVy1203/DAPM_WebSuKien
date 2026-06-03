using System;

namespace aspiCore.Dtos.PheDuyet
{
    public class PheDuyetDto
    {
        public int Id { get; set; } // Map to idHoSo
        public int EventId { get; set; }
        public string? TenSuKien { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string Loai { get; set; } = "event"; // event, budget, venue, other
        public string TrangThai { get; set; } = "pending"; // pending, approved, rejected, draft
        public string NguoiGui { get; set; } = "Trưởng Ban Tổ chức";
        public string NgayGui { get; set; } = string.Empty;
        public string NguoiDuyet { get; set; } = "Ban Giám hiệu";
        public string MoTa { get; set; } = string.Empty;
    }

    public class CreateUpdatePheDuyetDto
    {
        public int EventId { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string Loai { get; set; } = "event";
        public string TrangThai { get; set; } = "pending";
        public string NguoiGui { get; set; } = "Trưởng Ban Tổ chức";
        public string NguoiDuyet { get; set; } = "Ban Giám hiệu";
        public string MoTa { get; set; } = string.Empty;
    }

    public class ApproveEventRequestDto
    {
        public string CapDuyet { get; set; } = "Cấp 2 - P.CTSV";
        public string KetQua { get; set; } = "Đồng ý"; // Đồng ý, Từ chối, Yêu cầu bổ sung
        public string? GhiChu { get; set; }
        public bool GuiThongBao { get; set; }
    }
}
