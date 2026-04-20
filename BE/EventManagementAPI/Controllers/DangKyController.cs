using Microsoft.AspNetCore.Mvc;
using EventManagementAPI.DTOs;
using EventManagementAPI.Services;

namespace EventManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DangKyController : ControllerBase
{
    private readonly IDangKyService _dangKyService;

    public DangKyController(IDangKyService dangKyService)
    {
        _dangKyService = dangKyService;
    }

    [HttpPost("dang-ky")]
    public async Task<ActionResult<DangKyResponseDTO>> DangKy([FromBody] DangKyRequestDTO request)
    {
        var idNguoiDung = request.IdNguoiDung ?? "ND001";
        
        var result = await _dangKyService.DangKySuKienAsync(request.IdSuKien, idNguoiDung);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("huy-dang-ky")]
    public async Task<ActionResult<DangKyResponseDTO>> HuyDangKy([FromBody] DangKyRequestDTO request)
    {
        var idNguoiDung = request.IdNguoiDung ?? "ND001";
        
        var result = await _dangKyService.HuyDangKyAsync(request.IdSuKien, idNguoiDung);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("check-in")]
    public async Task<ActionResult<DangKyResponseDTO>> CheckIn([FromBody] DangKyRequestDTO request)
    {
        var idNguoiDung = request.IdNguoiDung ?? "ND001";
        
        var result = await _dangKyService.CheckInAsync(request.IdSuKien, idNguoiDung);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("su-kien/{idSuKien}")]
    public async Task<ActionResult<List<DangKySuKienDTO>>> GetBySuKien(int idSuKien)
    {
        var dangKys = await _dangKyService.GetDangKyBySuKienAsync(idSuKien);
        return Ok(dangKys);
    }

    [HttpGet("nguoi-dung/{idNguoiDung}")]
    public async Task<ActionResult<List<DangKySuKienDTO>>> GetByNguoiDung(string idNguoiDung)
    {
        var dangKys = await _dangKyService.GetDangKyByNguoiDungAsync(idNguoiDung);
        return Ok(dangKys);
    }
}
