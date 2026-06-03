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
                ThoiGianTao = s.ThoiGianTao,
                SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList(),
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

            // ══════════════════════════════════════════════
            // LƯU DỮ LIỆU BAN TỔ CHỨC, CÔNG VIỆC, NGÂN SÁCH
            // ══════════════════════════════════════════════
            await SaveOrganizersAndTasksAsync(suKien.IdSuKien, dto.IdNguoiTao, suKien.ThoiGianKetThuc, dto.ThanhVienBTCs);
            await SaveBudgetAsync(suKien.IdSuKien, dto.NganSachs);
            await InitializeMockApprovalAsync(suKien.IdSuKien, suKien.TenSuKien);

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

            // ══════════════════════════════════════════════
            // CẬP NHẬT DỮ LIỆU LIÊN QUAN (NẾU CÓ TRUYỀN LÊN)
            // ══════════════════════════════════════════════
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

        private async Task InitializeMockApprovalAsync(int idSuKien, string tenSuKien)
        {
            // ── 4. Tạo 2 hồ sơ phê duyệt mẫu ──
            bool hasApprovals = await _context.HoSoSuKiens.AnyAsync(h => h.IdSuKien == idSuKien);

            if (!hasApprovals)
            {
                var sample1Json = JsonSerializer.Serialize(new
                {
                    TieuDe = $"Phê duyệt kế hoạch tổ chức {tenSuKien}",
                    Loai = "event",
                    TrangThai = "pending",
                    NguoiGui = "Trưởng Ban Tổ chức",
                    NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                    NguoiDuyet = "Ban Giám hiệu",
                    MoTa = $"Kế hoạch chi tiết tổ chức {tenSuKien} với đầy đủ các nội dung về chương trình, nhân sự, dự trù kinh phí. Kính trình cấp trên xem xét phê duyệt để triển khai."
                });

                var sample2Json = JsonSerializer.Serialize(new
                {
                    TieuDe = $"Phê duyệt ngân sách dự phòng {tenSuKien}",
                    Loai = "budget",
                    TrangThai = "pending",
                    NguoiGui = "Trưởng Ban Tổ chức",
                    NgayGui = DateTime.Now.ToString("dd/MM/yyyy"),
                    NguoiDuyet = "Đoàn Trường",
                    MoTa = $"Kế hoạch kinh phí chi tiết cho các hạng mục trang thiết bị, văn phòng phẩm, và chi phí dự trù phát sinh của {tenSuKien}."
                });

                _context.HoSoSuKiens.AddRange(
                    new HoSoSuKien
                    {
                        IdSuKien = idSuKien,
                        TrangThaiDuyet = "Chờ duyệt",
                        ThoiGianGui = DateTime.Now,
                        DuTruNganSach = "65,000,000 VNĐ",
                        NoiDungKeHoach = sample1Json
                    },
                    new HoSoSuKien
                    {
                        IdSuKien = idSuKien,
                        TrangThaiDuyet = "Chờ duyệt",
                        ThoiGianGui = DateTime.Now,
                        DuTruNganSach = "8,000,000 VNĐ",
                        NoiDungKeHoach = sample2Json
                    }
                );
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
