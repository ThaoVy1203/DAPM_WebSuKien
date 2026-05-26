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

        private static string SanitizeFileName(string name)
        {
            foreach (char c in Path.GetInvalidFileNameChars())
                name = name.Replace(c, '_');
            return name.Replace(' ', '_');
        }
    }
}