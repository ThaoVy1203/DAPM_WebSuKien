using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspiCore.Data;

namespace aspiCore.Services
{
    public class BaoCaoService : IBaoCaoService
    {
        private readonly ApplicationDBContext _context;

        public BaoCaoService(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<FileResult> XuatExcelAsync(int idSuKien, string outputDir)
        {
            // Lấy thông tin sự kiện
            var suKien = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .FirstOrDefaultAsync(s => s.IdSuKien == idSuKien);

            if (suKien == null)
                throw new Exception("Không tìm thấy sự kiện.");

            // Lấy danh sách đăng ký
            var dangKyList = await _context.DangKySuKiens
                .Include(dk => dk.NguoiDung)
                .Where(dk => dk.IdSuKien == idSuKien)
                .OrderBy(dk => dk.ThoiGianDangKy)
                .ToListAsync();

            // Thống kê
            int tongDangKy = dangKyList.Count;
            int daCheckin = dangKyList.Count(dk => dk.ThoiGianCheckin != null);
            int noShow = dangKyList.Count(dk => dk.ThoiGianCheckin == null && dk.TrangThai != "Đã hủy");
            int daHuy = dangKyList.Count(dk => dk.TrangThai == "Đã hủy");
            string tiLe = tongDangKy > 0
                ? Math.Round((double)daCheckin / tongDangKy * 100, 1) + "%"
                : "0%";

            // Tạo workbook
            using var wb = new XLWorkbook();

            // ==================== SHEET 1: Danh sách tham gia ====================
            var ws1 = wb.Worksheets.Add("Danh sách tham gia");

            // Tiêu đề lớn
            ws1.Cell("A1").Value = "DANH SÁCH NGƯỜI THAM GIA SỰ KIỆN";
            ws1.Range("A1:G1").Merge();
            ws1.Cell("A1").Style
                .Font.SetBold(true)
                .Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#0D5A9C"))
                .Font.SetFontColor(XLColor.White);

            // Thông tin sự kiện
            ws1.Cell("A2").Value = "Sự kiện:";
            ws1.Cell("B2").Value = suKien.TenSuKien;
            ws1.Cell("A3").Value = "Địa điểm:";
            ws1.Cell("B3").Value = suKien.DiaDiem?.TenDiaDiem ?? "Chưa xác định";
            ws1.Cell("A4").Value = "Ngày tổ chức:";
            ws1.Cell("B4").Value = suKien.ThoiGianBatDau.ToString("dd/MM/yyyy HH:mm");
            ws1.Cell("A5").Value = "Ngày xuất báo cáo:";
            ws1.Cell("B5").Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");

            foreach (var row in new[] { 2, 3, 4, 5 })
                ws1.Cell($"A{row}").Style.Font.SetBold(true);

            // Header bảng
            int headerRow = 7;
            string[] headers = { "STT", "Họ tên", "Mã số", "Ngày đăng ký", "Check-in", "Check-out", "Trạng thái" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws1.Cell(headerRow, i + 1);
                cell.Value = headers[i];
                cell.Style
                    .Font.SetBold(true)
                    .Fill.SetBackgroundColor(XLColor.FromHtml("#1976D2"))
                    .Font.SetFontColor(XLColor.White)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            }

            // Dữ liệu
            for (int i = 0; i < dangKyList.Count; i++)
            {
                var dk = dangKyList[i];
                int r = headerRow + 1 + i;

                ws1.Cell(r, 1).Value = i + 1;
                ws1.Cell(r, 2).Value = dk.NguoiDung?.HoTen ?? dk.IdNguoiDung;
                ws1.Cell(r, 3).Value = dk.IdNguoiDung;
                ws1.Cell(r, 4).Value = dk.ThoiGianDangKy.ToString("dd/MM/yyyy");
                ws1.Cell(r, 5).Value = dk.ThoiGianCheckin.HasValue
                    ? dk.ThoiGianCheckin.Value.ToString("dd/MM/yyyy HH:mm")
                    : "—";
                ws1.Cell(r, 6).Value = dk.ThoiGianCheckout.HasValue
                    ? dk.ThoiGianCheckout.Value.ToString("dd/MM/yyyy HH:mm")
                    : "—";

                string trangThai = dk.ThoiGianCheckin.HasValue
                    ? "Đã tham dự"
                    : (dk.TrangThai == "Đã hủy" ? "Đã hủy" : "Vắng mặt");
                ws1.Cell(r, 7).Value = trangThai;

                // Màu trạng thái
                var statusCell = ws1.Cell(r, 7);
                if (trangThai == "Đã tham dự")
                    statusCell.Style.Font.SetFontColor(XLColor.FromHtml("#059669"));
                else if (trangThai == "Đã hủy")
                    statusCell.Style.Font.SetFontColor(XLColor.FromHtml("#EF4444"));
                else
                    statusCell.Style.Font.SetFontColor(XLColor.FromHtml("#D97706"));

                // Màu xen kẽ dòng
                if (i % 2 == 1)
                {
                    ws1.Range(r, 1, r, 7).Style
                        .Fill.SetBackgroundColor(XLColor.FromHtml("#F3F4F6"));
                }

                // Border
                ws1.Range(r, 1, r, 7).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
            }

            // Căn chỉnh cột
            ws1.Column(1).Width = 6;
            ws1.Column(2).Width = 28;
            ws1.Column(3).Width = 16;
            ws1.Column(4).Width = 16;
            ws1.Column(5).Width = 22;
            ws1.Column(6).Width = 22;
            ws1.Column(7).Width = 16;

            // ==================== SHEET 2: Tổng hợp ====================
            var ws2 = wb.Worksheets.Add("Tổng hợp");

            ws2.Cell("A1").Value = "BÁO CÁO TỔNG HỢP SỰ KIỆN";
            ws2.Range("A1:B1").Merge();
            ws2.Cell("A1").Style
                .Font.SetBold(true)
                .Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#0D5A9C"))
                .Font.SetFontColor(XLColor.White);

            // Thông tin sự kiện
            var infoRows = new[]
            {
                ("Tên sự kiện", suKien.TenSuKien),
                ("Địa điểm", suKien.DiaDiem?.TenDiaDiem ?? "Chưa xác định"),
                ("Ngày tổ chức", suKien.ThoiGianBatDau.ToString("dd/MM/yyyy HH:mm")),
                ("Ngày kết thúc", suKien.ThoiGianKetThuc.ToString("dd/MM/yyyy HH:mm")),
                ("Sức chứa tối đa", suKien.SoLuongToiDa.HasValue ? suKien.SoLuongToiDa.Value.ToString() : "Không giới hạn"),
                ("Trạng thái sự kiện", suKien.TrangThai),
                ("Người tổ chức", suKien.NguoiTao?.HoTen ?? ""),
            };

            int row2 = 3;
            foreach (var (label, value) in infoRows)
            {
                ws2.Cell(row2, 1).Value = label;
                ws2.Cell(row2, 2).Value = value;
                ws2.Cell(row2, 1).Style.Font.SetBold(true);
                row2++;
            }

            // Thống kê tham dự
            row2++;
            ws2.Cell(row2, 1).Value = "THỐNG KÊ THAM DỰ";
            ws2.Range(row2, 1, row2, 2).Merge();
            ws2.Cell(row2, 1).Style
                .Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#1976D2"))
                .Font.SetFontColor(XLColor.White)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            row2++;

            var statsRows = new[]
            {
                ("Tổng số đăng ký", tongDangKy.ToString()),
                ("Số người đã tham dự (có check-in)", daCheckin.ToString()),
                ("Số người vắng mặt", noShow.ToString()),
                ("Số lượt đã hủy", daHuy.ToString()),
                ("Tỷ lệ tham dự", tiLe),
            };

            foreach (var (label, value) in statsRows)
            {
                ws2.Cell(row2, 1).Value = label;
                ws2.Cell(row2, 2).Value = value;
                ws2.Cell(row2, 1).Style.Font.SetBold(true);
                ws2.Range(row2, 1, row2, 2).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
                row2++;
            }

            // Footer
            row2++;
            ws2.Cell(row2, 1).Value = "Ngày xuất báo cáo:";
            ws2.Cell(row2, 2).Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
            ws2.Cell(row2, 1).Style.Font.SetBold(true);

            ws2.Column(1).Width = 35;
            ws2.Column(2).Width = 30;

            // ==================== LƯU FILE ====================
            // Tạo thư mục Reports nếu chưa có
            if (!Directory.Exists(outputDir))
                Directory.CreateDirectory(outputDir);

            string tenFile = $"BaoCao_{SanitizeFileName(suKien.TenSuKien)}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            string fullPath = Path.Combine(outputDir, tenFile);

            wb.SaveAs(fullPath);

            // Đọc file và trả về
            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            return new FileContentResult(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            {
                FileDownloadName = tenFile
            };
        }

        public async Task<FileResult> XuatExcelCtsvAsync(string outputDir)
        {
            // Lấy tất cả sự kiện kèm thông tin
            var suKienList = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .OrderBy(s => s.TrangThai)
                .ThenByDescending(s => s.ThoiGianBatDau)
                .ToListAsync();

            using var wb = new XLWorkbook();

            // ==================== SHEET 1: Danh sách sự kiện ====================
            var ws1 = wb.Worksheets.Add("Danh sách sự kiện");

            ws1.Cell("A1").Value = "BÁO CÁO DANH SÁCH SỰ KIỆN - PHÒNG CTSV";
            ws1.Range("A1:H1").Merge();
            ws1.Cell("A1").Style
                .Font.SetBold(true)
                .Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#059669"))
                .Font.SetFontColor(XLColor.White);

            ws1.Cell("A2").Value = $"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}";
            ws1.Range("A2:H2").Merge();
            ws1.Cell("A2").Style
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right)
                .Font.SetItalic(true);

            // Header
            int hr = 4;
            string[] headers = { "STT", "Tên sự kiện", "Người tổ chức", "Địa điểm",
                                  "Ngày tổ chức", "Số đăng ký", "Sức chứa", "Trạng thái" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws1.Cell(hr, i + 1);
                cell.Value = headers[i];
                cell.Style
                    .Font.SetBold(true)
                    .Fill.SetBackgroundColor(XLColor.FromHtml("#059669"))
                    .Font.SetFontColor(XLColor.White)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            }

            // Dữ liệu
            for (int i = 0; i < suKienList.Count; i++)
            {
                var sk = suKienList[i];
                int r = hr + 1 + i;
                int soDangKy = sk.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0;

                ws1.Cell(r, 1).Value = i + 1;
                ws1.Cell(r, 2).Value = sk.TenSuKien;
                ws1.Cell(r, 3).Value = sk.NguoiTao?.HoTen ?? "";
                ws1.Cell(r, 4).Value = sk.DiaDiem?.TenDiaDiem ?? "Chưa xác định";
                ws1.Cell(r, 5).Value = sk.ThoiGianBatDau.ToString("dd/MM/yyyy");
                ws1.Cell(r, 6).Value = soDangKy;
                ws1.Cell(r, 7).Value = sk.SoLuongToiDa.HasValue ? sk.SoLuongToiDa.Value.ToString() : "Không giới hạn";
                ws1.Cell(r, 8).Value = sk.TrangThai;

                // Màu trạng thái
                var statusCell = ws1.Cell(r, 8);
                statusCell.Style.Font.SetFontColor(sk.TrangThai switch
                {
                    "Đã duyệt" => XLColor.FromHtml("#059669"),
                    "Từ chối" => XLColor.FromHtml("#EF4444"),
                    "Chờ duyệt" => XLColor.FromHtml("#D97706"),
                    _ => XLColor.FromHtml("#6B7280")
                });

                if (i % 2 == 1)
                    ws1.Range(r, 1, r, 8).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F0FDF4"));

                ws1.Range(r, 1, r, 8).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
            }

            ws1.Column(1).Width = 6;
            ws1.Column(2).Width = 40;
            ws1.Column(3).Width = 22;
            ws1.Column(4).Width = 22;
            ws1.Column(5).Width = 16;
            ws1.Column(6).Width = 12;
            ws1.Column(7).Width = 16;
            ws1.Column(8).Width = 14;

            // ==================== SHEET 2: Thống kê tổng hợp ====================
            var ws2 = wb.Worksheets.Add("Thống kê tổng hợp");

            ws2.Cell("A1").Value = "THỐNG KÊ TỔNG HỢP - PHÒNG CTSV";
            ws2.Range("A1:B1").Merge();
            ws2.Cell("A1").Style
                .Font.SetBold(true)
                .Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#059669"))
                .Font.SetFontColor(XLColor.White);

            // Thống kê theo trạng thái
            int tongSuKien = suKienList.Count;
            int daDuyet = suKienList.Count(s => s.TrangThai == "Đã duyệt");
            int tuChoi = suKienList.Count(s => s.TrangThai == "Từ chối");
            int choDuyet = suKienList.Count(s => s.TrangThai == "Chờ duyệt");
            int nhap = suKienList.Count(s => s.TrangThai == "Nháp");
            int tongDangKy = suKienList.Sum(s => s.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0);
            string tiLeDuyet = tongSuKien > 0
                ? Math.Round((double)daDuyet / tongSuKien * 100, 1) + "%"
                : "0%";

            int r2 = 3;
            ws2.Cell(r2, 1).Value = "THỐNG KÊ THEO TRẠNG THÁI";
            ws2.Range(r2, 1, r2, 2).Merge();
            ws2.Cell(r2, 1).Style
                .Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#059669"))
                .Font.SetFontColor(XLColor.White)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            r2++;

            var statRows = new[]
            {
                ("Tổng số sự kiện", tongSuKien.ToString()),
                ("Đã duyệt", daDuyet.ToString()),
                ("Từ chối", tuChoi.ToString()),
                ("Chờ duyệt", choDuyet.ToString()),
                ("Bản nháp", nhap.ToString()),
                ("Tổng lượt đăng ký", tongDangKy.ToString()),
                ("Tỷ lệ phê duyệt", tiLeDuyet),
            };

            foreach (var (label, value) in statRows)
            {
                ws2.Cell(r2, 1).Value = label;
                ws2.Cell(r2, 2).Value = value;
                ws2.Cell(r2, 1).Style.Font.SetBold(true);
                ws2.Range(r2, 1, r2, 2).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
                r2++;
            }

            r2++;
            ws2.Cell(r2, 1).Value = "Ngày xuất báo cáo:";
            ws2.Cell(r2, 2).Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
            ws2.Cell(r2, 1).Style.Font.SetBold(true);

            ws2.Column(1).Width = 30;
            ws2.Column(2).Width = 20;

            // ==================== LƯU FILE ====================
            if (!Directory.Exists(outputDir))
                Directory.CreateDirectory(outputDir);

            string tenFile = $"BaoCao_CTSV_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            string fullPath = Path.Combine(outputDir, tenFile);
            wb.SaveAs(fullPath);

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            return new FileContentResult(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            {
                FileDownloadName = tenFile
            };
        }

        public async Task<FileResult> XuatExcelBghAsync(string outputDir)
        {
            var suKienList = await _context.SuKiens
                .Include(s => s.DiaDiem)
                .Include(s => s.NguoiTao)
                .Include(s => s.DangKySuKiens)
                .OrderBy(s => s.TrangThai)
                .ThenByDescending(s => s.ThoiGianBatDau)
                .ToListAsync();

            using var wb = new XLWorkbook();

            // ==================== SHEET 1: Danh sách sự kiện ====================
            var ws1 = wb.Worksheets.Add("Danh sách sự kiện");

            ws1.Cell("A1").Value = "BÁO CÁO TỔNG THỂ - BAN GIÁM HIỆU";
            ws1.Range("A1:H1").Merge();
            ws1.Cell("A1").Style
                .Font.SetBold(true).Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#DC2626"))
                .Font.SetFontColor(XLColor.White);

            ws1.Cell("A2").Value = $"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}";
            ws1.Range("A2:H2").Merge();
            ws1.Cell("A2").Style
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right)
                .Font.SetItalic(true);

            int hr = 4;
            string[] headers = { "STT", "Tên sự kiện", "Người tổ chức", "Địa điểm",
                                  "Ngày tổ chức", "Số đăng ký", "Sức chứa", "Trạng thái" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws1.Cell(hr, i + 1);
                cell.Value = headers[i];
                cell.Style
                    .Font.SetBold(true)
                    .Fill.SetBackgroundColor(XLColor.FromHtml("#DC2626"))
                    .Font.SetFontColor(XLColor.White)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            }

            for (int i = 0; i < suKienList.Count; i++)
            {
                var sk = suKienList[i];
                int r = hr + 1 + i;
                int soDangKy = sk.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0;

                ws1.Cell(r, 1).Value = i + 1;
                ws1.Cell(r, 2).Value = sk.TenSuKien;
                ws1.Cell(r, 3).Value = sk.NguoiTao?.HoTen ?? "";
                ws1.Cell(r, 4).Value = sk.DiaDiem?.TenDiaDiem ?? "Chưa xác định";
                ws1.Cell(r, 5).Value = sk.ThoiGianBatDau.ToString("dd/MM/yyyy");
                ws1.Cell(r, 6).Value = soDangKy;
                ws1.Cell(r, 7).Value = sk.SoLuongToiDa.HasValue ? sk.SoLuongToiDa.Value.ToString() : "Không giới hạn";
                ws1.Cell(r, 8).Value = sk.TrangThai;

                ws1.Cell(r, 8).Style.Font.SetFontColor(sk.TrangThai switch
                {
                    "Đã duyệt" => XLColor.FromHtml("#059669"),
                    "Từ chối" => XLColor.FromHtml("#DC2626"),
                    "Chờ duyệt" => XLColor.FromHtml("#D97706"),
                    _ => XLColor.FromHtml("#6B7280")
                });

                if (i % 2 == 1)
                    ws1.Range(r, 1, r, 8).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#FEF2F2"));

                ws1.Range(r, 1, r, 8).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
            }

            ws1.Column(1).Width = 6;  ws1.Column(2).Width = 40;
            ws1.Column(3).Width = 22; ws1.Column(4).Width = 22;
            ws1.Column(5).Width = 16; ws1.Column(6).Width = 12;
            ws1.Column(7).Width = 16; ws1.Column(8).Width = 14;

            // ==================== SHEET 2: Thống kê tổng hợp ====================
            var ws2 = wb.Worksheets.Add("Thống kê tổng hợp");

            ws2.Cell("A1").Value = "THỐNG KÊ TỔNG HỢP - BAN GIÁM HIỆU";
            ws2.Range("A1:B1").Merge();
            ws2.Cell("A1").Style
                .Font.SetBold(true).Font.SetFontSize(14)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#DC2626"))
                .Font.SetFontColor(XLColor.White);

            int tongSuKien = suKienList.Count;
            int daDuyet = suKienList.Count(s => s.TrangThai == "Đã duyệt");
            int tuChoi = suKienList.Count(s => s.TrangThai == "Từ chối");
            int choDuyet = suKienList.Count(s => s.TrangThai == "Chờ duyệt");
            int tongDangKy = suKienList.Sum(s => s.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0);
            string tiLeDuyet = tongSuKien > 0
                ? Math.Round((double)daDuyet / tongSuKien * 100, 1) + "%" : "0%";

            int r2 = 3;
            ws2.Cell(r2, 1).Value = "THỐNG KÊ THEO TRẠNG THÁI";
            ws2.Range(r2, 1, r2, 2).Merge();
            ws2.Cell(r2, 1).Style
                .Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#DC2626"))
                .Font.SetFontColor(XLColor.White)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            r2++;

            var statRows = new[]
            {
                ("Tổng số sự kiện", tongSuKien.ToString()),
                ("Đã duyệt", daDuyet.ToString()),
                ("Từ chối", tuChoi.ToString()),
                ("Chờ duyệt", choDuyet.ToString()),
                ("Tổng lượt đăng ký", tongDangKy.ToString()),
                ("Tỷ lệ phê duyệt", tiLeDuyet),
            };

            foreach (var (label, value) in statRows)
            {
                ws2.Cell(r2, 1).Value = label;
                ws2.Cell(r2, 2).Value = value;
                ws2.Cell(r2, 1).Style.Font.SetBold(true);
                ws2.Range(r2, 1, r2, 2).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
                r2++;
            }

            // Top 5 sự kiện có đăng ký nhiều nhất
            r2++;
            ws2.Cell(r2, 1).Value = "TOP 5 SỰ KIỆN QUY MÔ LỚN NHẤT";
            ws2.Range(r2, 1, r2, 2).Merge();
            ws2.Cell(r2, 1).Style
                .Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#DC2626"))
                .Font.SetFontColor(XLColor.White)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            r2++;

            var top5 = suKienList
                .Where(s => s.TrangThai == "Đã duyệt")
                .OrderByDescending(s => s.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0)
                .Take(5)
                .ToList();

            ws2.Cell(r2, 1).Value = "Tên sự kiện";
            ws2.Cell(r2, 2).Value = "Số đăng ký";
            ws2.Row(r2).Style.Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#FEE2E2"));
            r2++;

            foreach (var sk in top5)
            {
                int soDk = sk.DangKySuKiens?.Count(dk => dk.TrangThai != "Đã hủy") ?? 0;
                ws2.Cell(r2, 1).Value = sk.TenSuKien;
                ws2.Cell(r2, 2).Value = soDk;
                ws2.Range(r2, 1, r2, 2).Style
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetInsideBorder(XLBorderStyleValues.Thin);
                r2++;
            }

            r2++;
            ws2.Cell(r2, 1).Value = "Ngày xuất báo cáo:";
            ws2.Cell(r2, 2).Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
            ws2.Cell(r2, 1).Style.Font.SetBold(true);

            ws2.Column(1).Width = 40;
            ws2.Column(2).Width = 20;

            // ==================== LƯU FILE ====================
            if (!Directory.Exists(outputDir))
                Directory.CreateDirectory(outputDir);

            string tenFile = $"BaoCao_BGH_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            string fullPath = Path.Combine(outputDir, tenFile);
            wb.SaveAs(fullPath);

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            return new FileContentResult(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            {
                FileDownloadName = tenFile
            };
        }

        private static string SanitizeFileName(string name)
        {
            foreach (char c in Path.GetInvalidFileNameChars())
                name = name.Replace(c, '_');
            return name.Replace(' ', '_');
        }
    }
}