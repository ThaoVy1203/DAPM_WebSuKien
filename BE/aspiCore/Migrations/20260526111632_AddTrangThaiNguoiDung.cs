using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace aspiCore.Migrations
{
    /// <inheritdoc />
    public partial class AddTrangThaiNguoiDung : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DatLichs");

            migrationBuilder.DropTable(
                name: "KhoaHocMonAns");

            migrationBuilder.DropTable(
                name: "KhoaHocs");

            migrationBuilder.DropTable(
                name: "MonAns");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "DanhMucMons");

            migrationBuilder.CreateTable(
                name: "DanhMucSuKien",
                columns: table => new
                {
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenDanhMuc = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhMucSuKien", x => x.IdDanhMuc);
                });

            migrationBuilder.CreateTable(
                name: "DiaDiem",
                columns: table => new
                {
                    IdDiaDiem = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenDiaDiem = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ViTri = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SucChua = table.Column<int>(type: "int", nullable: true),
                    TrangThaiSuDung = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaDiem", x => x.IdDiaDiem);
                });

            migrationBuilder.CreateTable(
                name: "NguoiDung",
                columns: table => new
                {
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    MaSoSSO = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    HoTen = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SDT = table.Column<string>(type: "nvarchar(11)", maxLength: 11, nullable: true),
                    AnhDaiDien = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MatKhauSSO = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NguoiDung", x => x.IdNguoiDung);
                });

            migrationBuilder.CreateTable(
                name: "VaiTro",
                columns: table => new
                {
                    IdVaiTro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenVaiTro = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VaiTro", x => x.IdVaiTro);
                });

            migrationBuilder.CreateTable(
                name: "SuKien",
                columns: table => new
                {
                    IdSuKien = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenSuKien = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThoiGianBatDau = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianKetThuc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IdDiaDiem = table.Column<int>(type: "int", nullable: true),
                    IdNguoiTao = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    SoLuongToiDa = table.Column<int>(type: "int", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CapPheDuyet = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    ThoiGianTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuKien", x => x.IdSuKien);
                    table.ForeignKey(
                        name: "FK_SuKien_DiaDiem_IdDiaDiem",
                        column: x => x.IdDiaDiem,
                        principalTable: "DiaDiem",
                        principalColumn: "IdDiaDiem",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SuKien_NguoiDung_IdNguoiTao",
                        column: x => x.IdNguoiTao,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VaiTro_NguoiDung",
                columns: table => new
                {
                    IdVaiTro = table.Column<int>(type: "int", nullable: false),
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    ThoiGianCapQuan = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VaiTro_NguoiDung", x => new { x.IdVaiTro, x.IdNguoiDung });
                    table.ForeignKey(
                        name: "FK_VaiTro_NguoiDung_NguoiDung_IdNguoiDung",
                        column: x => x.IdNguoiDung,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VaiTro_NguoiDung_VaiTro_IdVaiTro",
                        column: x => x.IdVaiTro,
                        principalTable: "VaiTro",
                        principalColumn: "IdVaiTro",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CongViec",
                columns: table => new
                {
                    IdCongViec = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenCongViec = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdSuKien = table.Column<int>(type: "int", nullable: false),
                    TieuDe = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MoTa = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    HanChot = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CongViec", x => x.IdCongViec);
                    table.ForeignKey(
                        name: "FK_CongViec_SuKien_IdSuKien",
                        column: x => x.IdSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DangKySuKien",
                columns: table => new
                {
                    IdDangKy = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdSuKien = table.Column<int>(type: "int", nullable: false),
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ThoiGianDangKy = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianHuy = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ThoiGianCheckin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ThoiGianCheckout = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DangKySuKien", x => x.IdDangKy);
                    table.ForeignKey(
                        name: "FK_DangKySuKien_NguoiDung_IdNguoiDung",
                        column: x => x.IdNguoiDung,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DangKySuKien_SuKien_IdSuKien",
                        column: x => x.IdSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NguoiDung_SuKien",
                columns: table => new
                {
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    IdSuKien = table.Column<int>(type: "int", nullable: false),
                    VaiTroTrongSuKien = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NguoiDung_SuKien", x => new { x.IdNguoiDung, x.IdSuKien });
                    table.ForeignKey(
                        name: "FK_NguoiDung_SuKien_NguoiDung_IdNguoiDung",
                        column: x => x.IdNguoiDung,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NguoiDung_SuKien_SuKien_IdSuKien",
                        column: x => x.IdSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SuKien_DanhMuc",
                columns: table => new
                {
                    IdSuKien = table.Column<int>(type: "int", nullable: false),
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuKien_DanhMuc", x => new { x.IdSuKien, x.IdDanhMuc });
                    table.ForeignKey(
                        name: "FK_SuKien_DanhMuc_DanhMucSuKien_IdDanhMuc",
                        column: x => x.IdDanhMuc,
                        principalTable: "DanhMucSuKien",
                        principalColumn: "IdDanhMuc",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SuKien_DanhMuc_SuKien_IdSuKien",
                        column: x => x.IdSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ThongBao",
                columns: table => new
                {
                    IdThongBao = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    IdSuKien = table.Column<int>(type: "int", nullable: true),
                    TieuDe = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DaDoc = table.Column<bool>(type: "bit", nullable: false),
                    ThoiGianGui = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThongBao", x => x.IdThongBao);
                    table.ForeignKey(
                        name: "FK_ThongBao_NguoiDung_IdNguoiDung",
                        column: x => x.IdNguoiDung,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ThongBao_SuKien_IdSuKien",
                        column: x => x.IdSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien");
                });

            migrationBuilder.CreateTable(
                name: "PhanCong",
                columns: table => new
                {
                    IdPhanCong = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCongViec = table.Column<int>(type: "int", nullable: false),
                    IdNguoiDung = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    VaiTroTrongBTC = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ThoiGianPhanCong = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhanCong", x => x.IdPhanCong);
                    table.ForeignKey(
                        name: "FK_PhanCong_CongViec_IdCongViec",
                        column: x => x.IdCongViec,
                        principalTable: "CongViec",
                        principalColumn: "IdCongViec",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhanCong_NguoiDung_IdNguoiDung",
                        column: x => x.IdNguoiDung,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CongViec_IdSuKien",
                table: "CongViec",
                column: "IdSuKien");

            migrationBuilder.CreateIndex(
                name: "IX_DangKySuKien_IdNguoiDung",
                table: "DangKySuKien",
                column: "IdNguoiDung");

            migrationBuilder.CreateIndex(
                name: "IX_DangKySuKien_IdSuKien_IdNguoiDung",
                table: "DangKySuKien",
                columns: new[] { "IdSuKien", "IdNguoiDung" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DangKySuKien_TrangThai",
                table: "DangKySuKien",
                column: "TrangThai");

            migrationBuilder.CreateIndex(
                name: "IX_NguoiDung_Email",
                table: "NguoiDung",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NguoiDung_MaSoSSO",
                table: "NguoiDung",
                column: "MaSoSSO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NguoiDung_SuKien_IdSuKien",
                table: "NguoiDung_SuKien",
                column: "IdSuKien");

            migrationBuilder.CreateIndex(
                name: "IX_PhanCong_IdCongViec",
                table: "PhanCong",
                column: "IdCongViec");

            migrationBuilder.CreateIndex(
                name: "IX_PhanCong_IdNguoiDung",
                table: "PhanCong",
                column: "IdNguoiDung");

            migrationBuilder.CreateIndex(
                name: "IX_SuKien_IdDiaDiem",
                table: "SuKien",
                column: "IdDiaDiem");

            migrationBuilder.CreateIndex(
                name: "IX_SuKien_IdNguoiTao",
                table: "SuKien",
                column: "IdNguoiTao");

            migrationBuilder.CreateIndex(
                name: "IX_SuKien_ThoiGianBatDau_ThoiGianKetThuc",
                table: "SuKien",
                columns: new[] { "ThoiGianBatDau", "ThoiGianKetThuc" });

            migrationBuilder.CreateIndex(
                name: "IX_SuKien_TrangThai",
                table: "SuKien",
                column: "TrangThai");

            migrationBuilder.CreateIndex(
                name: "IX_SuKien_DanhMuc_IdDanhMuc",
                table: "SuKien_DanhMuc",
                column: "IdDanhMuc");

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_DaDoc",
                table: "ThongBao",
                column: "DaDoc");

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_IdNguoiDung",
                table: "ThongBao",
                column: "IdNguoiDung");

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_IdSuKien",
                table: "ThongBao",
                column: "IdSuKien");

            migrationBuilder.CreateIndex(
                name: "IX_VaiTro_NguoiDung_IdNguoiDung",
                table: "VaiTro_NguoiDung",
                column: "IdNguoiDung");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DangKySuKien");

            migrationBuilder.DropTable(
                name: "NguoiDung_SuKien");

            migrationBuilder.DropTable(
                name: "PhanCong");

            migrationBuilder.DropTable(
                name: "SuKien_DanhMuc");

            migrationBuilder.DropTable(
                name: "ThongBao");

            migrationBuilder.DropTable(
                name: "VaiTro_NguoiDung");

            migrationBuilder.DropTable(
                name: "CongViec");

            migrationBuilder.DropTable(
                name: "DanhMucSuKien");

            migrationBuilder.DropTable(
                name: "VaiTro");

            migrationBuilder.DropTable(
                name: "SuKien");

            migrationBuilder.DropTable(
                name: "DiaDiem");

            migrationBuilder.DropTable(
                name: "NguoiDung");

            migrationBuilder.CreateTable(
                name: "DanhMucMons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenDanhMuc = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhMucMons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Avatar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HoTen = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MonAns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false),
                    AnhMon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguyenLieu = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Region = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenMon = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonAns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonAns_DanhMucMons_IdDanhMuc",
                        column: x => x.IdDanhMuc,
                        principalTable: "DanhMucMons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KhoaHocs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdGiaoVien = table.Column<int>(type: "int", nullable: false),
                    AnhBia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DanhGiaTrungBinh = table.Column<double>(type: "float", nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Gia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LichTrinh = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoiIch = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayKhaiGiang = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoBuoiHoc = table.Column<int>(type: "int", nullable: false),
                    SoChoConTrong = table.Column<int>(type: "int", nullable: false),
                    SoLuongDanhGia = table.Column<int>(type: "int", nullable: false),
                    SoLuongToiDa = table.Column<int>(type: "int", nullable: false),
                    ThoiGianHoc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TieuDe = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrangThaiLop = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KhoaHocs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KhoaHocs_Users_IdGiaoVien",
                        column: x => x.IdGiaoVien,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DatLichs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdKhachHang = table.Column<int>(type: "int", nullable: false),
                    IdKhoaHoc = table.Column<int>(type: "int", nullable: false),
                    SoLuongDat = table.Column<int>(type: "int", nullable: false),
                    ThoiGianDat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DatLichs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DatLichs_KhoaHocs_IdKhoaHoc",
                        column: x => x.IdKhoaHoc,
                        principalTable: "KhoaHocs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DatLichs_Users_IdKhachHang",
                        column: x => x.IdKhachHang,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KhoaHocMonAns",
                columns: table => new
                {
                    IdKhoaHoc = table.Column<int>(type: "int", nullable: false),
                    IdMonAn = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KhoaHocMonAns", x => new { x.IdKhoaHoc, x.IdMonAn });
                    table.ForeignKey(
                        name: "FK_KhoaHocMonAns_KhoaHocs_IdKhoaHoc",
                        column: x => x.IdKhoaHoc,
                        principalTable: "KhoaHocs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KhoaHocMonAns_MonAns_IdMonAn",
                        column: x => x.IdMonAn,
                        principalTable: "MonAns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DatLichs_IdKhachHang",
                table: "DatLichs",
                column: "IdKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_DatLichs_IdKhoaHoc",
                table: "DatLichs",
                column: "IdKhoaHoc");

            migrationBuilder.CreateIndex(
                name: "IX_KhoaHocMonAns_IdMonAn",
                table: "KhoaHocMonAns",
                column: "IdMonAn");

            migrationBuilder.CreateIndex(
                name: "IX_KhoaHocs_IdGiaoVien",
                table: "KhoaHocs",
                column: "IdGiaoVien");

            migrationBuilder.CreateIndex(
                name: "IX_MonAns_IdDanhMuc",
                table: "MonAns",
                column: "IdDanhMuc");
        }
    }
}
