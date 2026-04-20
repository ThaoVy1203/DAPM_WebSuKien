using Microsoft.AspNetCore.Mvc;
using EventManagementAPI.DTOs;
using EventManagementAPI.Services;

namespace EventManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiaDiemController : ControllerBase
{
    private readonly IDiaDiemService _diaDiemService;

    public DiaDiemController(IDiaDiemService diaDiemService)
    {
        _diaDiemService = diaDiemService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DiaDiemDTO>>> GetAll()
    {
        var diaDiems = await _diaDiemService.GetAllDiaDiemsAsync();
        return Ok(diaDiems);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiaDiemDTO>> GetById(int id)
    {
        var diaDiem = await _diaDiemService.GetDiaDiemByIdAsync(id);
        if (diaDiem == null)
            return NotFound(new { message = "Không tìm thấy địa điểm" });

        return Ok(diaDiem);
    }
}
