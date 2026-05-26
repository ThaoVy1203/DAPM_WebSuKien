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
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .ToListAsync();
        }

        public async Task<SuKienDto?> GetByIdAsync(int id)
        {
            var suKien = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .FirstOrDefaultAsync(s => s.IdSuKien == id);

            if (suKien == null) return null;

            return new SuKienDto
            {
                IdSuKien = suKien.IdSuKien,
                TenSuKien = suKien.TenSuKien,
                MoTa = suKien.MoTa,
                ThoiGianBatDau = suKien.ThoiGianBatDau,
                ThoiGianKetThuc = suKien.ThoiGianKetThuc,
                IdDiaDiem = suKien.IdDiaDiem,
                TenDiaDiem = suKien.DiaDiem?.TenDiaDiem,
                IdNguoiTao = suKien.IdNguoiTao,
                TenNguoiTao = suKien.NguoiTao?.HoTen,
                SoLuongToiDa = suKien.SoLuongToiDa,
                HinhAnh = suKien.HinhAnh,
                TrangThai = suKien.TrangThai,
                ThoiGianTao = suKien.ThoiGianTao,
                SoDaDangKy = suKien.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                DanhMucs = suKien.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
            };
        }

        public async Task<IEnumerable<SuKienDto>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Where(s => s.TrangThai == trangThai)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<SuKienDto>> GetByNguoiTaoAsync(string idNguoiTao)
        {
            return await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .Include(s => s.SuKien_DanhMucs)
                .ThenInclude(sd => sd.DanhMuc)
                .Where(s => s.IdNguoiTao == idNguoiTao)
                .Select(s => new SuKienDto
                {
                    IdSuKien = s.IdSuKien,
                    TenSuKien = s.TenSuKien,
                    MoTa = s.MoTa,
                    ThoiGianBatDau = s.ThoiGianBatDau,
                    ThoiGianKetThuc = s.ThoiGianKetThuc,
                    IdDiaDiem = s.IdDiaDiem,
                    TenDiaDiem = s.DiaDiem != null ? s.DiaDiem.TenDiaDiem : null,
                    IdNguoiTao = s.IdNguoiTao,
                    TenNguoiTao = s.NguoiTao != null ? s.NguoiTao.HoTen : null,
                    SoLuongToiDa = s.SoLuongToiDa,
                    HinhAnh = s.HinhAnh,
                    TrangThai = s.TrangThai,
                    ThoiGianTao = s.ThoiGianTao,
                    SoDaDangKy = s.DangKySuKiens.Count(dk => dk.TrangThai != "Đã hủy"),
                    DanhMucs = s.SuKien_DanhMucs.Where(sd => sd.DanhMuc != null).Select(sd => new DanhMucInfo { IdDanhMuc = sd.IdDanhMuc, TenDanhMuc = sd.DanhMuc!.TenDanhMuc }).ToList()
                })
                .OrderByDescending(s => s.ThoiGianTao)
                .ToListAsync();
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
            // TỰ ĐỘNG KHỞI TẠO DỮ LIỆU LIÊN QUAN
            // ══════════════════════════════════════════════
            await InitializeRelatedDataAsync(suKien.IdSuKien, suKien.TenSuKien, dto.IdNguoiTao, suKien.ThoiGianKetThuc);

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
            // ĐẢM BẢO DỮ LIỆU LIÊN QUAN TỒN TẠI
            // (chỉ thêm nếu chưa có, không ghi đè dữ liệu đã tồn tại)
            // ══════════════════════════════════════════════
            await InitializeRelatedDataAsync(suKien.IdSuKien, suKien.TenSuKien, suKien.IdNguoiTao, suKien.ThoiGianKetThuc);

            return await GetByIdAsync(id);
        }

        // ══════════════════════════════════════════════════════════════
        // PRIVATE: Khởi tạo dữ liệu đồng bộ cho sự kiện
        // Tạo: Thành viên BTC, Công việc + Phân công, Ngân sách, Hồ sơ phê duyệt
        // An toàn: Chỉ thêm nếu chưa tồn tại (idempotent)
        // ══════════════════════════════════════════════════════════════
        private async Task InitializeRelatedDataAsync(int idSuKien, string tenSuKien, string idNguoiTao, DateTime thoiGianKetThuc)
        {
            // ── 1. Thêm người tạo vào Ban Tổ Chức của sự kiện ──
            bool alreadyMember = await _context.NguoiDung_SuKiens
                .AnyAsync(ns => ns.IdSuKien == idSuKien && ns.IdNguoiDung == idNguoiTao);

            if (!alreadyMember)
            {
                _context.NguoiDung_SuKiens.Add(new NguoiDung_SuKien
                {
                    IdNguoiDung = idNguoiTao,
                    IdSuKien = idSuKien,
                    VaiTroTrongSuKien = "Trưởng Ban Tổ chức"
                });
                await _context.SaveChangesAsync();
            }

            // ── 2. Tạo 6 công việc mẫu + phân công cho người tạo ──
            bool hasTasks = await _context.CongViecs.AnyAsync(c => c.IdSuKien == idSuKien);

            if (!hasTasks)
            {
                var defaultTasks = new[]
                {
                    new { Ten = "Lên kế hoạch chi tiết", MoTa = "Xây dựng kế hoạch tổ chức sự kiện chi tiết, bao gồm chương trình, nội dung và lịch trình." },
                    new { Ten = "Dự trù kinh phí", MoTa = "Lập bảng dự trù kinh phí cho từng hạng mục: hội trường, teabreak, in ấn, quà tặng." },
                    new { Ten = "Truyền thông & quảng bá", MoTa = "Thiết kế banner, poster, đăng bài trên các kênh truyền thông nội bộ và mạng xã hội." },
                    new { Ten = "Tổng duyệt chương trình", MoTa = "Chạy thử chương trình, kiểm tra âm thanh, ánh sáng, sân khấu và các thiết bị kỹ thuật." },
                    new { Ten = "Vận hành sự kiện", MoTa = "Điều phối check-in, hướng dẫn khách mời, phân công nhân sự vận hành tại chỗ." },
                    new { Ten = "Báo cáo tổng kết", MoTa = "Tổng hợp số liệu tham gia, quyết toán kinh phí, viết báo cáo kết quả sự kiện." }
                };

                foreach (var t in defaultTasks)
                {
                    var cv = new CongViec
                    {
                        TenCongViec = t.Ten,
                        IdSuKien = idSuKien,
                        TieuDe = t.Ten,
                        MoTa = t.MoTa,
                        HanChot = thoiGianKetThuc,
                        TrangThai = "Chưa bắt đầu"
                    };
                    _context.CongViecs.Add(cv);
                    await _context.SaveChangesAsync();

                    // Phân công cho người tạo sự kiện
                    _context.PhanCongs.Add(new PhanCong
                    {
                        IdCongViec = cv.IdCongViec,
                        IdNguoiDung = idNguoiTao,
                        VaiTroTrongBTC = "Trưởng Ban Tổ chức",
                        ThoiGianPhanCong = DateTime.Now
                    });
                }
                await _context.SaveChangesAsync();
            }

            // ── 3. Tạo kế hoạch ngân sách mẫu ──
            bool hasBudget = await _context.NganSachDuKiens.AnyAsync(n => n.IdSuKien == idSuKien);

            if (!hasBudget)
            {
                var budgetItems = new[]
                {
                    new { TenHangMuc = "Thuê địa điểm tổ chức", Loai = "venue", SoLuong = 1, DonGia = 40000000m, ThanhTien = 40000000m },
                    new { TenHangMuc = "Tiệc trà nhẹ (teabreak)", Loai = "food", SoLuong = 100, DonGia = 150000m, ThanhTien = 15000000m },
                    new { TenHangMuc = "In ấn banner, hashtag", Loai = "marketing", SoLuong = 10, DonGia = 500000m, ThanhTien = 5000000m },
                    new { TenHangMuc = "Quà tặng cho đại biểu", Loai = "other", SoLuong = 10, DonGia = 500000m, ThanhTien = 5000000m }
                };

                var itemsJson = JsonSerializer.Serialize(budgetItems.Select(b => new
                {
                    tenHangMuc = b.TenHangMuc,
                    loai = b.Loai,
                    soLuong = b.SoLuong,
                    donGia = b.DonGia,
                    thanhTien = b.ThanhTien
                }));

                _context.NganSachDuKiens.Add(new NganSachDuKien
                {
                    IdSuKien = idSuKien,
                    TongChiPhiDuKien = 65000000,
                    ChiTietNganSach = 0, // Chưa chi gì
                    GhiChu = itemsJson
                });
                await _context.SaveChangesAsync();
            }

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

            _context.SuKiens.Remove(suKien);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
