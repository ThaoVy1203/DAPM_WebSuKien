using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.SuKien;

namespace aspiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhMucController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public DanhMucController(ApplicationDBContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhMucInfo>>> GetAll()
        {
            var danhMucs = await _context.DanhMucSuKiens
                .Select(d => new DanhMucInfo
                {
                    IdDanhMuc = d.IdDanhMuc,
                    TenDanhMuc = d.TenDanhMuc
                })
                .ToListAsync();

            return Ok(danhMucs);
        }
    }
}
