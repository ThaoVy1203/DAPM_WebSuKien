using Microsoft.AspNetCore.Mvc;
using aspiCore.Services;
using aspiCore.Dtos.SuKien;
using aspiCore.Data;
using aspiCore.Dtos.Common;
using aspiCore.Model;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Collections.Generic;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuKienController : ControllerBase
    {
        private readonly ISuKienService _suKienService;
        private readonly ApplicationDBContext _context;

        public SuKienController(ISuKienService suKienService, ApplicationDBContext context)
        {
            _suKienService = suKienService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetAll()
        {
            var result = await _suKienService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SuKienDto>> GetById(int id)
        {
            var result = await _suKienService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return Ok(result);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetByTrangThai(string trangThai)
        {
            var result = await _suKienService.GetByTrangThaiAsync(trangThai);
            return Ok(result);
        }

<<<<<<< HEAD
        [HttpGet("nguoi-tao/{idNguoiTao}")]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> GetByNguoiTao(string idNguoiTao)
        {
            var result = await _suKienService.GetByNguoiTaoAsync(idNguoiTao);
=======
        /// <summary>
        /// Tìm kiếm và lọc sự kiện theo nhiều tiêu chí.
        /// GET /api/SuKien/search?keyword=...&idDanhMuc=...&idDiaDiem=...&trangThai=...&tuNgay=...&denNgay=...
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<SuKienDto>>> Search([FromQuery] SuKienQueryDto query)
        {
            var result = await _suKienService.SearchAsync(query);
>>>>>>> origin/Nguyen
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<SuKienDto>> Create([FromBody] CreateSuKienDto dto)
        {
            try
            {
                var result = await _suKienService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.IdSuKien }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SuKienDto>> Update(int id, [FromBody] UpdateSuKienDto dto)
        {
            var result = await _suKienService.UpdateAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return Ok(result);
        }

        [HttpPut("{id}/huy")]
        public async Task<ActionResult<SuKienDto>> Cancel(int id, [FromBody] CancelSuKienDto dto)
        {
            try
            {
                var result = await _suKienService.CancelAsync(id, dto.LyDoHuy);
                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy sự kiện" });
                }
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/duyet")]
        public async Task<ActionResult<ApiResponse>> ApproveEvent(int id, [FromBody] aspiCore.Dtos.PheDuyet.ApproveEventRequestDto dto)
        {
            var ev = await _context.SuKiens.FindAsync(id);
            if (ev == null)
            {
                return NotFound(new ApiResponse { Success = false, Message = "Không tìm thấy sự kiện" });
            }

            var hoSo = await _context.HoSoSuKiens
                .Where(h => h.IdSuKien == id)
                .OrderByDescending(h => h.ThoiGianGui)
                .FirstOrDefaultAsync();

            if (hoSo == null)
            {
                hoSo = new HoSoSuKien
                {
                    IdSuKien = id,
                    TrangThaiDuyet = "Chờ duyệt",
                    ThoiGianGui = DateTime.Now,
                    NoiDungKeHoach = JsonSerializer.Serialize(new {
                        TieuDe = $"Phê duyệt kế hoạch tổ chức {ev.TenSuKien}",
                        Loai = "event",
                        TrangThai = "pending",
                        NguoiGui = "Trưởng Ban Tổ chức",
                        NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                        NguoiDuyet = dto.CapDuyet,
                        MoTa = ev.MoTa ?? ""
                    })
                };
                _context.HoSoSuKiens.Add(hoSo);
                await _context.SaveChangesAsync();
            }

            string newStatusDuyet = "Chờ duyệt";
            string newEventStatus = ev.TrangThai;

            if (dto.KetQua == "Đồng ý")
            {
                newStatusDuyet = dto.CapDuyet.Contains("Cấp 2") || dto.CapDuyet.Contains("CTSV") || dto.CapDuyet.Contains("BGH") 
                    ? "Đã duyệt cấp 2" 
                    : "Đã duyệt cấp 1";
                newEventStatus = "Đã duyệt";
            }
            else if (dto.KetQua == "Từ chối")
            {
                newStatusDuyet = "Từ chối";
                newEventStatus = "Từ chối";
            }

            hoSo.TrangThaiDuyet = newStatusDuyet;

            if (!string.IsNullOrEmpty(hoSo.NoiDungKeHoach))
            {
                try
                {
                    var doc = JsonDocument.Parse(hoSo.NoiDungKeHoach);
                    var dict = doc.RootElement.Deserialize<Dictionary<string, object>>() ?? new Dictionary<string, object>();
                    dict["TrangThai"] = dto.KetQua == "Đồng ý" ? "approved" : "rejected";
                    dict["NguoiDuyet"] = dto.CapDuyet;
                    hoSo.NoiDungKeHoach = JsonSerializer.Serialize(dict);
                }
                catch {}
            }

            ev.TrangThai = newEventStatus;

            var history = new LichSuPheDuyet
            {
                IdHoSo = hoSo.IdHoSo,
                IdNguoiDuyet = "ND004", // CTSV/BGH mock user
                CapDuyet = dto.CapDuyet,
                KetQua = dto.KetQua,
                GhiChu = dto.GhiChu,
                ThoiGianPheDuyet = DateTime.Now
            };

            _context.LichSuPheDuyets.Add(history);
            _context.SuKiens.Update(ev);
            _context.HoSoSuKiens.Update(hoSo);
            
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse { Success = true, Message = "Phê duyệt sự kiện thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _suKienService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy sự kiện" });
            }
            return NoContent();
        }
    }
}
