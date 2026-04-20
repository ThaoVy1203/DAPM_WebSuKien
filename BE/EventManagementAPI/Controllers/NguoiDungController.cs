using Microsoft.AspNetCore.Mvc;
using EventManagementAPI.DTOs;
using EventManagementAPI.Services;

namespace EventManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NguoiDungController : ControllerBase
{
    private readonly INguoiDungService _nguoiDungService;

    public NguoiDungController(INguoiDungService nguoiDungService)
    {
        _nguoiDungService = nguoiDungService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginDTO dto)
    {
        var result = await _nguoiDungService.LoginAsync(dto);
        
        if (!result.Success)
            return Unauthorized(result);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NguoiDungDTO>> GetById(string id)
    {
        var nguoiDung = await _nguoiDungService.GetByIdAsync(id);
        if (nguoiDung == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        return Ok(nguoiDung);
    }

    [HttpGet]
    public async Task<ActionResult<List<NguoiDungDTO>>> GetAll()
    {
        var nguoiDungs = await _nguoiDungService.GetAllNguoiDungsAsync();
        return Ok(nguoiDungs);
    }
}
