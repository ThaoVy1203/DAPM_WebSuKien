using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace aspiCore.Migrations
{
    /// <inheritdoc />
    public partial class AddEventWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapPheDuyet",
                table: "SuKien");

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "SuKien",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "SuKien",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelReason",
                table: "SuKien",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "SuKien",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "SuKien",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "SuKien",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HoSoSuKien",
                columns: table => new
                {
                    idHoSo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idSuKien = table.Column<int>(type: "int", nullable: false),
                    noiDungKeHoach = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    duTruNganSach = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    trangThaiDuyet = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    thoiGianGui = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoSoSuKien", x => x.idHoSo);
                    table.ForeignKey(
                        name: "FK_HoSoSuKien_SuKien_idSuKien",
                        column: x => x.idSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NganSachDuKien",
                columns: table => new
                {
                    idNganSach = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idSuKien = table.Column<int>(type: "int", nullable: false),
                    tongChiPhiDuKien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    chiTietNganSach = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ghiChu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NganSachDuKien", x => x.idNganSach);
                    table.ForeignKey(
                        name: "FK_NganSachDuKien_SuKien_idSuKien",
                        column: x => x.idSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LichSuPheDuyet",
                columns: table => new
                {
                    idPheDuyet = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idSuKien = table.Column<int>(type: "int", nullable: false),
                    idNguoiDuyet = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    level = table.Column<int>(type: "int", nullable: false),
                    approverRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    approveStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    feedback = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    approvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HoSoSuKienIdHoSo = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichSuPheDuyet", x => x.idPheDuyet);
                    table.ForeignKey(
                        name: "FK_LichSuPheDuyet_HoSoSuKien_HoSoSuKienIdHoSo",
                        column: x => x.HoSoSuKienIdHoSo,
                        principalTable: "HoSoSuKien",
                        principalColumn: "idHoSo");
                    table.ForeignKey(
                        name: "FK_LichSuPheDuyet_NguoiDung_idNguoiDuyet",
                        column: x => x.idNguoiDuyet,
                        principalTable: "NguoiDung",
                        principalColumn: "IdNguoiDung",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LichSuPheDuyet_SuKien_idSuKien",
                        column: x => x.idSuKien,
                        principalTable: "SuKien",
                        principalColumn: "IdSuKien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HoSoSuKien_idSuKien",
                table: "HoSoSuKien",
                column: "idSuKien");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuPheDuyet_HoSoSuKienIdHoSo",
                table: "LichSuPheDuyet",
                column: "HoSoSuKienIdHoSo");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuPheDuyet_idNguoiDuyet",
                table: "LichSuPheDuyet",
                column: "idNguoiDuyet");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuPheDuyet_idSuKien",
                table: "LichSuPheDuyet",
                column: "idSuKien");

            migrationBuilder.CreateIndex(
                name: "IX_NganSachDuKien_idSuKien",
                table: "NganSachDuKien",
                column: "idSuKien");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LichSuPheDuyet");

            migrationBuilder.DropTable(
                name: "NganSachDuKien");

            migrationBuilder.DropTable(
                name: "HoSoSuKien");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "SuKien");

            migrationBuilder.DropColumn(
                name: "CancelReason",
                table: "SuKien");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "SuKien");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "SuKien");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "SuKien");

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "SuKien",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "CapPheDuyet",
                table: "SuKien",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);
        }
    }
}
