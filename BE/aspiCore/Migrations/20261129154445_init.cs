using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace aspiCore.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HoTen = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Avatar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false)
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
                    TenMon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnhMon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguyenLieu = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Region = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false)
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
                    TieuDe = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnhBia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Gia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SoLuongToiDa = table.Column<int>(type: "int", nullable: false),
                    IdGiaoVien = table.Column<int>(type: "int", nullable: false),
                    NgayKhaiGiang = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianHoc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SoBuoiHoc = table.Column<int>(type: "int", nullable: false),
                    SoChoConTrong = table.Column<int>(type: "int", nullable: false),
                    TrangThaiLop = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoiIch = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LichTrinh = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DanhGiaTrungBinh = table.Column<double>(type: "float", nullable: false),
                    SoLuongDanhGia = table.Column<int>(type: "int", nullable: false)
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
                    ThoiGianDat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoLuongDat = table.Column<int>(type: "int", nullable: false),
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
