using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Models;

namespace EventManagementAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<VaiTro> VaiTros { get; set; }
    public DbSet<NguoiDung> NguoiDungs { get; set; }
    public DbSet<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; }
    public DbSet<DiaDiem> DiaDiems { get; set; }
    public DbSet<DanhMucSuKien> DanhMucSuKiens { get; set; }
    public DbSet<SuKien> SuKiens { get; set; }
    public DbSet<SuKien_DanhMuc> SuKien_DanhMucs { get; set; }
    public DbSet<DangKySuKien> DangKySuKiens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // VaiTro_NguoiDung composite key
        modelBuilder.Entity<VaiTro_NguoiDung>()
            .HasKey(vn => new { vn.IdVaiTro, vn.IdNguoiDung });

        // SuKien_DanhMuc composite key
        modelBuilder.Entity<SuKien_DanhMuc>()
            .HasKey(sd => new { sd.IdSuKien, sd.IdDanhMuc });

        // DangKySuKien unique constraint
        modelBuilder.Entity<DangKySuKien>()
            .HasIndex(d => new { d.IdSuKien, d.IdNguoiDung })
            .IsUnique();
    }
}
