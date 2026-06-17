using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Model;
using aspiCore.Dtos.NganSach;
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
    public class NganSachController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public NganSachController(ApplicationDBContext context)
        {
            _context = context;
        }

        [HttpGet("su-kien/{idSuKien}")]
        public async Task<ActionResult<NganSachDto>> GetBySuKien(int idSuKien)
        {
            var ns = await _context.NganSachDuKiens
                .Include(n => n.SuKien)
                .FirstOrDefaultAsync(n => n.IdSuKien == idSuKien);

            if (ns == null)
            {
                // Tự động khởi tạo dữ liệu mẫu nếu chưa có ngân sách cho sự kiện này
                var eventObj = await _context.SuKiens.FindAsync(idSuKien);
                if (eventObj == null)
                {
                    return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy sự kiện" });
                }

                var defaultItems = new List<NganSachItemDto>
                {
                    new NganSachItemDto { TenHangMuc = "Thuê địa điểm tổ chức", Loai = "venue", SoLuong = 1, DonGia = 40000000, ThanhTien = 40000000 },
                    new NganSachItemDto { TenHangMuc = "Tiệc trà nhẹ (teabreak)", Loai = "food", SoLuong = 100, DonGia = 150000, ThanhTien = 15000000 },
                    new NganSachItemDto { TenHangMuc = "In ấn banner, hashtag", Loai = "marketing", SoLuong = 10, DonGia = 500000, ThanhTien = 5000000 },
                    new NganSachItemDto { TenHangMuc = "Quà tặng cho đại biểu", Loai = "other", SoLuong = 10, DonGia = 500000, ThanhTien = 5000000 }
                };

                ns = new NganSachDuKien
                {
                    IdSuKien = idSuKien,
                    TongChiPhiDuKien = 65000000, // Tổng 4 hạng mục trên
                    ChiTietNganSach = 45000000,   // Chi phí giả định thực tế đã chi
                    GhiChu = JsonSerializer.Serialize(defaultItems)
                };

                _context.NganSachDuKiens.Add(ns);
                await _context.SaveChangesAsync();
            }

            List<NganSachItemDto> itemsList = new List<NganSachItemDto>();
            if (!string.IsNullOrEmpty(ns.GhiChu))
            {
                try
                {
                    itemsList = JsonSerializer.Deserialize<List<NganSachItemDto>>(ns.GhiChu, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<NganSachItemDto>();
                }
                catch
                {
                    // Trường hợp ghi chú chứa text thường không phải JSON
                }
            }

            var dto = new NganSachDto
            {
                IdNganSach = ns.IdNganSach,
                IdSuKien = ns.IdSuKien,
                TenSuKien = ns.SuKien?.TenSuKien,
                TongNganSach = ns.TongChiPhiDuKien ?? 0,
                DaChi = ns.ChiTietNganSach ?? 0,
                ConLai = (ns.TongChiPhiDuKien ?? 0) - (ns.ChiTietNganSach ?? 0),
                // Sử dụng cột GhiChu làm nguồn lưu trữ items, trạng thái có thể lưu giả lập hoặc dựa trên các phê duyệt của nó
                TrangThai = ns.SuKien?.TrangThai ?? "Nháp", 
                GhiChu = string.IsNullOrEmpty(ns.GhiChu) || ns.GhiChu.StartsWith("[") ? "" : ns.GhiChu,
                Items = itemsList
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> CreateOrUpdate([FromBody] CreateUpdateNganSachDto dto)
        {
            var ns = await _context.NganSachDuKiens.FirstOrDefaultAsync(n => n.IdSuKien == dto.IdSuKien);

            var itemsJson = JsonSerializer.Serialize(dto.Items);

            if (ns != null)
            {
                ns.TongChiPhiDuKien = dto.TongNganSach;
                ns.ChiTietNganSach = dto.DaChi;
                ns.GhiChu = itemsJson;
                _context.NganSachDuKiens.Update(ns);
            }
            else
            {
                ns = new NganSachDuKien
                {
                    IdSuKien = dto.IdSuKien,
                    TongChiPhiDuKien = dto.TongNganSach,
                    ChiTietNganSach = dto.DaChi,
                    GhiChu = itemsJson
                };
                _context.NganSachDuKiens.Add(ns);
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Lưu kế hoạch ngân sách thành công" });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NganSachDto>> GetById(int id)
        {
            var ns = await _context.NganSachDuKiens.Include(n => n.SuKien).FirstOrDefaultAsync(n => n.IdNganSach == id);
            if (ns == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy" });
            }

            List<NganSachItemDto> itemsList = new List<NganSachItemDto>();
            if (!string.IsNullOrEmpty(ns.GhiChu))
            {
                try
                {
                    itemsList = JsonSerializer.Deserialize<List<NganSachItemDto>>(ns.GhiChu, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<NganSachItemDto>();
                }
                catch {}
            }

            var dto = new NganSachDto
            {
                IdNganSach = ns.IdNganSach,
                IdSuKien = ns.IdSuKien,
                TenSuKien = ns.SuKien?.TenSuKien,
                TongNganSach = ns.TongChiPhiDuKien ?? 0,
                DaChi = ns.ChiTietNganSach ?? 0,
                ConLai = (ns.TongChiPhiDuKien ?? 0) - (ns.ChiTietNganSach ?? 0),
                TrangThai = ns.SuKien?.TrangThai ?? "Nháp",
                Items = itemsList
            };

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(int id)
        {
            var ns = await _context.NganSachDuKiens.FindAsync(id);
            if (ns == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy" });
            }

            _context.NganSachDuKiens.Remove(ns);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Xóa thành công" });
        }
    }
}
