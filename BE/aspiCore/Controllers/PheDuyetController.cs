using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Model;
using aspiCore.Dtos.PheDuyet;
using aspiCore.Dtos.Common;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PheDuyetController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public PheDuyetController(ApplicationDBContext context)
        {
            _context = context;
        }

        private class ApprovalJsonData
        {
            public string TieuDe { get; set; } = string.Empty;
            public string Loai { get; set; } = "event";
            public string TrangThai { get; set; } = "pending";
            public string NguoiGui { get; set; } = "Trưởng Ban Tổ chức";
            public string NgayGui { get; set; } = string.Empty;
            public string NguoiDuyet { get; set; } = "Ban Giám hiệu";
            public string MoTa { get; set; } = string.Empty;
        }

        [HttpGet("su-kien/{idSuKien}")]
        public async Task<ActionResult<IEnumerable<PheDuyetDto>>> GetBySuKien(int idSuKien)
        {
            var dossiers = await _context.HoSoSuKiens
                .Include(h => h.SuKien)
                .Where(h => h.IdSuKien == idSuKien)
                .ToListAsync();

            var eventObj = await _context.SuKiens.FindAsync(idSuKien);
            if (eventObj == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy sự kiện" });
            }

            // Tự động khởi tạo 2 yêu cầu mẫu trong DB nếu sự kiện này chưa có hồ sơ nào
            if (!dossiers.Any())
            {
                var sample1 = new HoSoSuKien
                {
                    IdSuKien = idSuKien,
                    TrangThaiDuyet = "Chờ duyệt",
                    ThoiGianGui = DateTime.Now,
                    DuTruNganSach = "15,000,000 VNĐ",
                    NoiDungKeHoach = JsonSerializer.Serialize(new ApprovalJsonData
                    {
                        TieuDe = $"Phê duyệt kế hoạch tổ chức {eventObj.TenSuKien}",
                        Loai = "event",
                        TrangThai = "pending",
                        NguoiGui = "Trưởng Ban Tổ chức",
                        NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                        NguoiDuyet = "Ban Giám hiệu",
                        MoTa = $"Kế hoạch chi tiết tổ chức {eventObj.TenSuKien} với đầy đủ các nội dung về chương trình, nhân sự, dự trù kinh phí. Kính trình cấp trên xem duyệt phê duyệt để triển khai."
                    })
                };

                var sample2 = new HoSoSuKien
                {
                    IdSuKien = idSuKien,
                    TrangThaiDuyet = "Đã duyệt cấp 2",
                    ThoiGianGui = DateTime.Now.AddDays(-1),
                    DuTruNganSach = "8,000,000 VNĐ",
                    NoiDungKeHoach = JsonSerializer.Serialize(new ApprovalJsonData
                    {
                        TieuDe = $"Phê duyệt ngân sách dự phòng {eventObj.TenSuKien}",
                        Loai = "budget",
                        TrangThai = "approved",
                        NguoiGui = "Trưởng Ban Tổ chức",
                        NgayGui = DateTime.Now.AddDays(-1).ToString("dd/MM/yyyy"),
                        NguoiDuyet = "Đoàn Trường",
                        MoTa = $"Kế hoạch kinh phí chi tiết cho hạng mục trang thiết bị, văn phòng phẩm, và chi phí dự trù phát sinh."
                    })
                };

                _context.HoSoSuKiens.AddRange(sample1, sample2);
                await _context.SaveChangesAsync();

                dossiers = await _context.HoSoSuKiens
                    .Include(h => h.SuKien)
                    .Where(h => h.IdSuKien == idSuKien)
                    .ToListAsync();
            }

            var result = new List<PheDuyetDto>();
            foreach (var h in dossiers)
            {
                var lastHistory = await _context.LichSuPheDuyets
                    .Where(l => l.IdHoSo == h.IdHoSo)
                    .OrderByDescending(l => l.ThoiGianPheDuyet)
                    .FirstOrDefaultAsync();

                var dto = new PheDuyetDto
                {
                    Id = h.IdHoSo,
                    EventId = h.IdSuKien,
                    TenSuKien = h.SuKien?.TenSuKien,
                    NgayGui = h.ThoiGianGui.ToString("dd/MM/yyyy"),
                    TrangThai = MapDbStatusToFrontend(h.TrangThaiDuyet),
                    GhiChu = lastHistory?.GhiChu
                };

                if (!string.IsNullOrEmpty(h.NoiDungKeHoach))
                {
                    try
                    {
                        var json = JsonSerializer.Deserialize<ApprovalJsonData>(h.NoiDungKeHoach);
                        if (json != null)
                        {
                            dto.TieuDe = json.TieuDe;
                            dto.Loai = json.Loai;
                            dto.NguoiGui = json.NguoiGui;
                            dto.NguoiDuyet = json.NguoiDuyet;
                            dto.MoTa = json.MoTa;
                            // Nếu trong JSON có lưu trạng thái cụ thể (ví dụ 'draft' hoặc 'pending')
                            if (json.TrangThai == "draft" && h.TrangThaiDuyet == "Chờ duyệt")
                            {
                                dto.TrangThai = "draft";
                            }
                        }
                    }
                    catch {}
                }

                result.Add(dto);
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> CreateOrUpdate([FromBody] CreateUpdatePheDuyetDto dto)
        {
            HoSoSuKien? h = null;
            
            // Tìm nếu có ID đang chỉnh sửa (giả sử FE gửi qua một cơ chế khác hoặc ta cho phép sửa nháp)
            // Trong btc-approval.js, khi edit nó có lưu currentApprovalId
            // Ở đây nếu là sửa thì FE sẽ gửi PUT/POST, để đơn giản ta hỗ trợ tìm theo tiêu đề/loại hoặc tạo mới
            
            var json = new ApprovalJsonData
            {
                TieuDe = dto.TieuDe,
                Loai = dto.Loai,
                TrangThai = dto.TrangThai,
                NguoiGui = dto.NguoiGui,
                NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                NguoiDuyet = dto.NguoiDuyet,
                MoTa = dto.MoTa
            };

            var dbStatus = MapFrontendStatusToDb(dto.TrangThai);

            h = new HoSoSuKien
            {
                IdSuKien = dto.EventId,
                TrangThaiDuyet = dbStatus,
                ThoiGianGui = DateTime.Now,
                NoiDungKeHoach = JsonSerializer.Serialize(json),
                DuTruNganSach = dto.Loai == "budget" ? "Yêu cầu ngân sách" : ""
            };

            _context.HoSoSuKiens.Add(h);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Gửi yêu cầu phê duyệt thành công" });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] CreateUpdatePheDuyetDto dto)
        {
            var h = await _context.HoSoSuKiens.FindAsync(id);
            if (h == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy hồ sơ" });
            }

            var json = new ApprovalJsonData
            {
                TieuDe = dto.TieuDe,
                Loai = dto.Loai,
                TrangThai = dto.TrangThai,
                NguoiGui = dto.NguoiGui,
                NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                NguoiDuyet = dto.NguoiDuyet,
                MoTa = dto.MoTa
            };

            h.TrangThaiDuyet = MapFrontendStatusToDb(dto.TrangThai);
            h.NoiDungKeHoach = JsonSerializer.Serialize(json);

            _context.HoSoSuKiens.Update(h);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Cập nhật thành công" });
        }

        [HttpPut("cancel/{id}")]
        public async Task<ActionResult<ApiResponse>> Cancel(int id)
        {
            var h = await _context.HoSoSuKiens.FindAsync(id);
            if (h == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy hồ sơ" });
            }

            h.TrangThaiDuyet = "Chờ duyệt"; // Bắt buộc thoả CHECK constraint
            if (!string.IsNullOrEmpty(h.NoiDungKeHoach))
            {
                try
                {
                    var json = JsonSerializer.Deserialize<ApprovalJsonData>(h.NoiDungKeHoach);
                    if (json != null)
                    {
                        json.TrangThai = "draft"; // Chuyển trạng thái nội bộ thành draft
                        h.NoiDungKeHoach = JsonSerializer.Serialize(json);
                    }
                }
                catch {}
            }

            _context.HoSoSuKiens.Update(h);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Hủy yêu cầu thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(int id)
        {
            var h = await _context.HoSoSuKiens.FindAsync(id);
            if (h == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy hồ sơ" });
            }

            // Xóa lịch sử phê duyệt liên quan trước
            var histories = await _context.LichSuPheDuyets.Where(l => l.IdHoSo == id).ToListAsync();
            _context.LichSuPheDuyets.RemoveRange(histories);

            _context.HoSoSuKiens.Remove(h);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Xóa bản nháp thành công" });
        }

        private static string MapDbStatusToFrontend(string dbStatus)
        {
            return dbStatus switch
            {
                "Đã duyệt cấp 2" => "approved",
                "Đã duyệt cấp 1" => "approved",
                "Từ chối" => "rejected",
                "Chờ duyệt" => "pending",
                _ => "pending"
            };
        }

        private static string MapFrontendStatusToDb(string feStatus)
        {
            return feStatus switch
            {
                "approved" => "Đã duyệt cấp 2",
                "rejected" => "Từ chối",
                "draft" => "Chờ duyệt", // Lưu Chờ duyệt để pass CHECK constraint, phân biệt bằng JSON
                "pending" => "Chờ duyệt",
                _ => "Chờ duyệt"
            };
        }
    }
}
