using Microsoft.AspNetCore.Mvc;
using EventManagementAPI.DTOs;
using EventManagementAPI.Services;

namespace EventManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuKienController : ControllerBase
{
    private readonly ISuKienService _suKienService;

    public SuKienController(ISuKienService suKienService)
    {
        _suKienService = suKienService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SuKienDTO>>> GetAll()
    {
        var suKiens = await _suKienService.GetAllSuKiensAsync();
        return Ok(suKiens);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SuKienDTO>> GetById(int id)
    {
        var suKien = await _suKienService.GetSuKienByIdAsync(id);
        if (suKien == null)
            return NotFound(new { message = "Không tìm thấy sự kiện" });

        return Ok(suKien);
    }

    [HttpGet("trang-thai/{trangThai}")]
    public async Task<ActionResult<List<SuKienDTO>>> GetByTrangThai(string trangThai)
    {
        var suKiens = await _suKienService.GetSuKiensByTrangThaiAsync(trangThai);
        return Ok(suKiens);
    }

    [HttpPost]
    public async Task<ActionResult<SuKienDTO>> Create([FromBody] CreateSuKienDTO dto)
    {
        var idNguoiTao = "ND002"; // TODO: Get from authentication
        var suKien = await _suKienService.CreateSuKienAsync(dto, idNguoiTao);
        return CreatedAtAction(nameof(GetById), new { id = suKien.IdSuKien }, suKien);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSuKienDTO dto)
    {
        var success = await _suKienService.UpdateSuKienAsync(id, dto);
        if (!success)
            return NotFound(new { message = "Không tìm thấy sự kiện" });

        return Ok(new { message = "Cập nhật sự kiện thành công" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _suKienService.DeleteSuKienAsync(id);
        if (!success)
            return NotFound(new { message = "Không tìm thấy sự kiện" });

        return Ok(new { message = "Xóa sự kiện thành công" });
    }
}
