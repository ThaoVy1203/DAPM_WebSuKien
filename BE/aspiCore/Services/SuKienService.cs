using Microsoft.EntityFrameworkCore;
using aspiCore.Data;
using aspiCore.Dtos.SuKien;
using aspiCore.Model;
using System.Text.Json;

namespace aspiCore.Services
{
    public class SuKienService : ISuKienService
    {
        private readonly ApplicationDBContext _context;

        public SuKienService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SuKienDto>> GetAllAsync()
        {
            var suKiens = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .ToListAsync();
            return suKiens.Select(MapToDto);
        }

        public async Task<SuKienDto?> GetByIdAsync(int id)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .FirstOrDefaultAsync(s => s.IdSuKien == id);

            if (suKien == null) return null;

            return MapToDto(suKien);
        }

        public async Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai)
        {
            var suKiens = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .Where(s => s.TrangThai == trangThai)
                .ToListAsync();
            return suKiens.Select(MapToDto);
        }

        public async Task<IEnumerable<SuKienDto>> GetByNguoiTaoAsync(string idNguoiTao)
        {
            var suKiens = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .Where(s => s.IdNguoiTao == idNguoiTao)
                .OrderByDescending(s => s.ThoiGianTao)
                .ToListAsync();
            return suKiens.Select(MapToDto);
        }

        public async Task<IEnumerable<SuKienDto>> GetAssignedEventsAsync(string idNguoiDung)
        {
            var suKiens = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .Where(s => s.NguoiDung_SuKiens.Any(ns => ns.IdNguoiDung == idNguoiDung) || 
                            _context.CongViecs.Any(cv => cv.IdSuKien == s.IdSuKien && cv.PhanCongs.Any(pc => pc.IdNguoiDung == idNguoiDung)))
                .OrderByDescending(s => s.ThoiGianTao)
                .ToListAsync();
            return suKiens.Select(MapToDto);
        }

        public async Task<IEnumerable<SuKienDto>> SearchAsync(SuKienQueryDto query)
        {
            var q = _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs).ThenInclude(sd => sd.DanhMuc)
                .Include(s => s.NguoiDung_SuKiens).ThenInclude(ns => ns.NguoiDung)
                .Include(s => s.NganSachDuKiens)
                .AsQueryable();

            // Lọc theo từ khóa (tên, mô tả, địa điểm)
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                var kw = query.Keyword.Trim().ToLower();
                q = q.Where(s =>
                    s.TenSuKien.ToLower().Contains(kw) ||
                    (s.MoTa != null && s.MoTa.ToLower().Contains(kw)) ||
                    (s.DiaDiem != null && s.DiaDiem.TenDiaDiem.ToLower().Contains(kw))
                );
            }

            // Lọc theo danh mục
            if (query.IdDanhMuc.HasValue)
            {
                q = q.Where(s => s.SuKien_DanhMucs.Any(sd => sd.IdDanhMuc == query.IdDanhMuc.Value));
            }

            // Lọc theo địa điểm
            if (query.IdDiaDiem.HasValue)
            {
                q = q.Where(s => s.IdDiaDiem == query.IdDiaDiem.Value);
            }

            // Lọc theo trạng thái
            if (!string.IsNullOrWhiteSpace(query.TrangThai))
            {
                q = q.Where(s => s.TrangThai == query.TrangThai);
            }

            // Lọc theo khoảng thời gian bắt đầu
            if (query.TuNgay.HasValue)
            {
                q = q.Where(s => s.ThoiGianBatDau >= query.TuNgay.Value);
            }
            if (query.DenNgay.HasValue)
            {
                var denNgayCuoi = query.DenNgay.Value.Date.AddDays(1).AddTicks(-1);
                q = q.Where(s => s.ThoiGianBatDau <= denNgayCuoi);
            }

            var result = await q
                .OrderBy(s => s.ThoiGianBatDau)
                .ToListAsync();

            return result.Select(MapToDto);
        }

        private SuKienDto MapToDto(SuKien s)
        {
            return new SuKienDto
            {
                IdSuKien = s.IdSuKien,
                TenSuKien = s.TenSuKien,
                MoTa = s.MoTa,
                ThoiGianBatDau = s.ThoiGianBatDau,
                ThoiGianKetThuc = s.ThoiGianKetThuc,
                IdDiaDiem = s.IdDiaDiem,
                TenDiaDiem = s.DiaDiem?.TenDiaDiem,
                IdNguoiTao = s.IdNguoiTao,
                TenNguoiTao = s.NguoiTao?.HoTen,
                SoLuongToiDa = s.SoLuongToiDa,
                HinhAnh = s.HinhAnh,
                TrangThai = s.TrangThai,
                GioHuyTruocBatDauPhut = s.GioHuyTruocBatDauPhut,
                YeuCauKhaoSatCheckout = s.YeuCauKhaoSatCheckout,
                ThoiGianTao = s.ThoiGianTao,
                // Không tính "Chờ chỗ" vào giới hạn số lượng.
                SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy" && dk.TrangThai != "Chờ chỗ"),
                DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList(),
                DanhMucIds = s.SuKien_DanhMucs.Select(sd => sd.IdDanhMuc).ToList(),
                TenDanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => sd.DanhMuc!.TenDanhMuc).ToList(),
                ThanhVienBTCs = s.NguoiDung_SuKiens.Select(ns => new ThanhVienBtcDto
                {
                    IdNguoiDung = ns.IdNguoiDung,
                    HoTen = ns.NguoiDung?.HoTen,
                    VaiTro = ns.VaiTroTrongSuKien
                }).ToList(),
                NganSachs = ParseNganSachJson(s.NganSachDuKiens.FirstOrDefault()?.GhiChu)
            };
        }

        private List<NganSachDto> ParseNganSachJson(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<NganSachDto>();
            try
            {
                return JsonSerializer.Deserialize<List<NganSachDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<NganSachDto>();
            }
            catch { return new List<NganSachDto>(); }
        }

        public async Task<SuKienDto> CreateAsync(CreateSuKienDto dto)
        {
            if (dto.ThoiGianKetThuc <= dto.ThoiGianBatDau)
            {
                throw new InvalidOperationException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
            }

            var suKien = new SuKien
            {
                TenSuKien = dto.TenSuKien,
                MoTa = dto.MoTa,
                ThoiGianBatDau = dto.ThoiGianBatDau,
                ThoiGianKetThuc = dto.ThoiGianKetThuc,
                IdDiaDiem = dto.IdDiaDiem,
                IdNguoiTao = dto.IdNguoiTao,
                SoLuongToiDa = dto.SoLuongToiDa,
                GioHuyTruocBatDauPhut = dto.GioHuyTruocBatDauPhut,
                YeuCauKhaoSatCheckout = dto.YeuCauKhaoSatCheckout,
                HinhAnh = dto.HinhAnh,
                TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? "Nháp" : dto.TrangThai,
                ThoiGianTao = DateTime.Now
            };

            _context.SuKiens.Add(suKien);
            await _context.SaveChangesAsync();

            if (dto.DanhMucIds != null && dto.DanhMucIds.Any())
            {
                foreach (var danhMucId in dto.DanhMucIds)
                {
                    _context.SuKien_DanhMucs.Add(new SuKien_DanhMuc
                    {
                        IdSuKien = suKien.IdSuKien,
                        IdDanhMuc = danhMucId
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Lưu dữ liệu Ban Tổ Chức, Công việc, Ngân sách
            await SaveOrganizersAndTasksAsync(suKien.IdSuKien, dto.IdNguoiTao, suKien.ThoiGianKetThuc, dto.ThanhVienBTCs);
            await SaveBudgetAsync(suKien.IdSuKien, dto.NganSachs);
            await InitializeEventApprovalAsync(suKien.IdSuKien, suKien.TenSuKien, suKien.MoTa, dto.NganSachs);

            return (await GetByIdAsync(suKien.IdSuKien))!;
        }

        public async Task<SuKienDto?> UpdateAsync(int id, UpdateSuKienDto dto)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.SuKien_DanhMucs)
                .FirstOrDefaultAsync(s => s.IdSuKien == id);

            if (suKien == null) return null;

            if (!string.IsNullOrEmpty(dto.TenSuKien))
                suKien.TenSuKien = dto.TenSuKien;
            if (dto.MoTa != null)
                suKien.MoTa = dto.MoTa;
            if (dto.ThoiGianBatDau.HasValue)
                suKien.ThoiGianBatDau = dto.ThoiGianBatDau.Value;
            if (dto.ThoiGianKetThuc.HasValue)
                suKien.ThoiGianKetThuc = dto.ThoiGianKetThuc.Value;
            if (dto.IdDiaDiem.HasValue)
                suKien.IdDiaDiem = dto.IdDiaDiem;
            if (dto.SoLuongToiDa.HasValue)
                suKien.SoLuongToiDa = dto.SoLuongToiDa;
            if (dto.GioHuyTruocBatDauPhut.HasValue)
                suKien.GioHuyTruocBatDauPhut = Math.Max(0, dto.GioHuyTruocBatDauPhut.Value);
            if (dto.YeuCauKhaoSatCheckout.HasValue)
                suKien.YeuCauKhaoSatCheckout = dto.YeuCauKhaoSatCheckout.Value;
            if (dto.HinhAnh != null)
                suKien.HinhAnh = dto.HinhAnh;
            if (!string.IsNullOrEmpty(dto.TrangThai))
                suKien.TrangThai = dto.TrangThai;

            if (dto.ThoiGianKetThuc.HasValue || dto.ThoiGianBatDau.HasValue)
            {
                var start = dto.ThoiGianBatDau ?? suKien.ThoiGianBatDau;
                var end = dto.ThoiGianKetThuc ?? suKien.ThoiGianKetThuc;
                if (end <= start)
                {
                    throw new InvalidOperationException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
                }
            }

            if (dto.DanhMucIds != null)
            {
                _context.SuKien_DanhMucs.RemoveRange(suKien.SuKien_DanhMucs);
                foreach (var danhMucId in dto.DanhMucIds)
                {
                    _context.SuKien_DanhMucs.Add(new SuKien_DanhMuc
                    {
                        IdSuKien = suKien.IdSuKien,
                        IdDanhMuc = danhMucId
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Cập nhật dữ liệu liên quan (nếu có truyền lên)
            if (dto.ThanhVienBTCs != null)
            {
                await SaveOrganizersAndTasksAsync(suKien.IdSuKien, suKien.IdNguoiTao, suKien.ThoiGianKetThuc, dto.ThanhVienBTCs);
            }
            if (dto.NganSachs != null)
            {
                await SaveBudgetAsync(suKien.IdSuKien, dto.NganSachs);
            }

            return await GetByIdAsync(id);
        }

        private async Task SaveOrganizersAndTasksAsync(int idSuKien, string idNguoiTao, DateTime hanChot, List<ThanhVienBtcDto>? thanhVienBTCs)
        {
            var oldBTC = await _context.NguoiDung_SuKiens.Where(x => x.IdSuKien == idSuKien).ToListAsync();
            _context.NguoiDung_SuKiens.RemoveRange(oldBTC);

            var oldCongViecs = await _context.CongViecs.Where(x => x.IdSuKien == idSuKien).ToListAsync();
            foreach (var cv in oldCongViecs)
            {
                var oldPhanCongs = await _context.PhanCongs.Where(x => x.IdCongViec == cv.IdCongViec).ToListAsync();
                _context.PhanCongs.RemoveRange(oldPhanCongs);
            }
            _context.CongViecs.RemoveRange(oldCongViecs);
            await _context.SaveChangesAsync();

            if (thanhVienBTCs != null && thanhVienBTCs.Any())
            {
                foreach (var tv in thanhVienBTCs)
                {
                    _context.NguoiDung_SuKiens.Add(new NguoiDung_SuKien
                    {
                        IdSuKien = idSuKien,
                        IdNguoiDung = tv.IdNguoiDung,
                        VaiTroTrongSuKien = "Thành viên BTC"
                    });

                    if (!string.IsNullOrEmpty(tv.VaiTro))
                    {
                        var cv = new CongViec
                        {
                            IdSuKien = idSuKien,
                            TenCongViec = tv.VaiTro,
                            TieuDe = tv.VaiTro,
                            MoTa = $"Nhiệm vụ phân công: {tv.VaiTro}",
                            HanChot = hanChot,
                            TrangThai = "Chưa bắt đầu"
                        };
                        _context.CongViecs.Add(cv);
                        await _context.SaveChangesAsync();

                        _context.PhanCongs.Add(new PhanCong
                        {
                            IdCongViec = cv.IdCongViec,
                            IdNguoiDung = tv.IdNguoiDung,
                            VaiTroTrongBTC = "Thành viên BTC",
                            ThoiGianPhanCong = DateTime.Now
                        });
                    }
                }
            }
            else
            {
                // Fallback: chỉ thêm người tạo
                _context.NguoiDung_SuKiens.Add(new NguoiDung_SuKien
                {
                    IdNguoiDung = idNguoiTao,
                    IdSuKien = idSuKien,
                    VaiTroTrongSuKien = "Trưởng Ban Tổ chức"
                });
            }
            await _context.SaveChangesAsync();
        }

        private async Task SaveBudgetAsync(int idSuKien, List<NganSachDto>? nganSachs)
        {
            var oldNganSachs = await _context.NganSachDuKiens.Where(x => x.IdSuKien == idSuKien).ToListAsync();
            _context.NganSachDuKiens.RemoveRange(oldNganSachs);
            await _context.SaveChangesAsync();

            if (nganSachs != null && nganSachs.Any())
            {
                var itemsJson = JsonSerializer.Serialize(nganSachs.Select(b => new
                {
                    tenHangMuc = b.TenHangMuc,
                    loai = b.Loai,
                    soLuong = b.SoLuong,
                    donGia = b.DonGia,
                    thanhTien = b.ThanhTien
                }));
                var tong = nganSachs.Sum(x => x.ThanhTien);

                _context.NganSachDuKiens.Add(new NganSachDuKien
                {
                    IdSuKien = idSuKien,
                    TongChiPhiDuKien = tong,
                    ChiTietNganSach = 0,
                    GhiChu = itemsJson
                });
            }
            await _context.SaveChangesAsync();
        }

        private async Task InitializeEventApprovalAsync(int idSuKien, string tenSuKien, string? moTa, List<NganSachDto>? nganSachs)
        {
            // Tạo 1 hồ sơ phê duyệt với ngân sách từ form
            bool hasApprovals = await _context.HoSoSuKiens.AnyAsync(h => h.IdSuKien == idSuKien);

            if (!hasApprovals)
            {
                decimal tongNganSach = nganSachs?.Sum(x => x.ThanhTien) ?? 0;
                string duTruNganSachStr = $"{tongNganSach:N0} VNĐ";

                var noiDungJson = JsonSerializer.Serialize(new
                {
                    TieuDe = $"Phê duyệt kế hoạch tổ chức {tenSuKien}",
                    Loai = "event",
                    TrangThai = "pending",
                    NguoiGui = "Trưởng Ban Tổ chức",
                    NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                    NguoiDuyet = "Ban Giám hiệu",
                    MoTa = moTa ?? $"Kế hoạch chi tiết tổ chức {tenSuKien} với đầy đủ các nội dung về chương trình, nhân sự, dự trù kinh phí. Kính trình cấp trên xem xét phê duyệt để triển khai."
                });

                _context.HoSoSuKiens.Add(new HoSoSuKien
                {
                    IdSuKien = idSuKien,
                    TrangThaiDuyet = "Chờ duyệt",
                    ThoiGianGui = DateTime.Now,
                    DuTruNganSach = duTruNganSachStr,
                    NoiDungKeHoach = noiDungJson
                });
                await _context.SaveChangesAsync();
            }
        }

        public async Task<SuKienDto?> CancelAsync(int id, string? lyDoHuy)
        {
            var suKien = await _context.SuKiens.FindAsync(id);
            if (suKien == null) return null;

            if (suKien.TrangThai == "Hủy" || suKien.TrangThai == "Kết thúc" || suKien.TrangThai == "Từ chối")
            {
                throw new InvalidOperationException("Không thể hủy sự kiện ở trạng thái này.");
            }

            suKien.TrangThai = "Hủy";
            suKien.CancelReason = lyDoHuy;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var suKien = await _context.SuKiens.FindAsync(id);
            if (suKien == null) return false;

            // Xóa các dữ liệu liên quan để tránh lỗi Foreign Key
            var danhMucs = await _context.SuKien_DanhMucs.Where(x => x.IdSuKien == id).ToListAsync();
            _context.SuKien_DanhMucs.RemoveRange(danhMucs);

            var nguoiDungs = await _context.NguoiDung_SuKiens.Where(x => x.IdSuKien == id).ToListAsync();
            _context.NguoiDung_SuKiens.RemoveRange(nguoiDungs);

            var nganSachs = await _context.NganSachDuKiens.Where(x => x.IdSuKien == id).ToListAsync();
            _context.NganSachDuKiens.RemoveRange(nganSachs);

            var hoSos = await _context.HoSoSuKiens.Where(x => x.IdSuKien == id).ToListAsync();
            foreach (var hs in hoSos)
            {
                var lichSu = await _context.LichSuPheDuyets.Where(x => x.IdHoSo == hs.IdHoSo).ToListAsync();
                _context.LichSuPheDuyets.RemoveRange(lichSu);
            }
            _context.HoSoSuKiens.RemoveRange(hoSos);

            var congViecs = await _context.CongViecs.Where(x => x.IdSuKien == id).ToListAsync();
            foreach (var cv in congViecs)
            {
                var phanCongs = await _context.PhanCongs.Where(x => x.IdCongViec == cv.IdCongViec).ToListAsync();
                _context.PhanCongs.RemoveRange(phanCongs);
            }
            _context.CongViecs.RemoveRange(congViecs);

            var dangKys = await _context.DangKySuKiens.Where(x => x.IdSuKien == id).ToListAsync();
            _context.DangKySuKiens.RemoveRange(dangKys);

            var thongBaos = await _context.ThongBaos.Where(x => x.IdSuKien == id).ToListAsync();
            _context.ThongBaos.RemoveRange(thongBaos);

            // Cuối cùng xóa sự kiện
            _context.SuKiens.Remove(suKien);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}