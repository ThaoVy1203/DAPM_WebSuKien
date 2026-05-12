using Microsoft.EntityFrameworkCore;
using aspiCore.Model;

namespace aspiCore.Data
{
    public class ApplicationDBContext : DbContext
    {
        public ApplicationDBContext(DbContextOptions<ApplicationDBContext> options) : base(options)
        {
        }

        public DbSet<NguoiDung> NguoiDungs { get; set; }
        public DbSet<VaiTro> VaiTros { get; set; }
        public DbSet<VaiTro_NguoiDung> VaiTro_NguoiDungs { get; set; }
        public DbSet<DiaDiem> DiaDiems { get; set; }
        public DbSet<DanhMucSuKien> DanhMucSuKiens { get; set; }
        public DbSet<SuKien> SuKiens { get; set; }
        public DbSet<SuKien_DanhMuc> SuKien_DanhMucs { get; set; }
        public DbSet<DangKySuKien> DangKySuKiens { get; set; }
        public DbSet<NguoiDung_SuKien> NguoiDung_SuKiens { get; set; }
        public DbSet<ThongBao> ThongBaos { get; set; }
        public DbSet<CongViec> CongViecs { get; set; }
        public DbSet<PhanCong> PhanCongs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // VaiTro_NguoiDung composite key
            modelBuilder.Entity<VaiTro_NguoiDung>()
                .HasKey(vn => new { vn.IdVaiTro, vn.IdNguoiDung });

            // SuKien_DanhMuc composite key
            modelBuilder.Entity<SuKien_DanhMuc>()
                .HasKey(sd => new { sd.IdSuKien, sd.IdDanhMuc });

            // NguoiDung_SuKien composite key
            modelBuilder.Entity<NguoiDung_SuKien>()
                .HasKey(ns => new { ns.IdNguoiDung, ns.IdSuKien });

            // DangKySuKien unique constraint
            modelBuilder.Entity<DangKySuKien>()
                .HasIndex(dk => new { dk.IdSuKien, dk.IdNguoiDung })
                .IsUnique();

            // NguoiDung unique constraints
            modelBuilder.Entity<NguoiDung>()
                .HasIndex(n => n.MaSoSSO)
                .IsUnique();

            modelBuilder.Entity<NguoiDung>()
                .HasIndex(n => n.Email)
                .IsUnique();

            // Indexes for performance
            modelBuilder.Entity<SuKien>()
                .HasIndex(s => s.TrangThai);

            modelBuilder.Entity<SuKien>()
                .HasIndex(s => new { s.ThoiGianBatDau, s.ThoiGianKetThuc });

            modelBuilder.Entity<DangKySuKien>()
                .HasIndex(dk => dk.TrangThai);

            modelBuilder.Entity<ThongBao>()
                .HasIndex(tb => tb.DaDoc);

            // Relationships
            modelBuilder.Entity<SuKien>()
                .HasOne(s => s.NguoiTao)
                .WithMany(n => n.SuKiensTao)
                .HasForeignKey(s => s.IdNguoiTao)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SuKien>()
                .HasOne(s => s.DiaDiem)
                .WithMany(d => d.SuKiens)
                .HasForeignKey(s => s.IdDiaDiem)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
