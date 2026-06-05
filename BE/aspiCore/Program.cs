using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using aspiCore.Data;
using aspiCore.Services;
using aspiCore.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.ToString());
});

// Add DbContext
builder.Services.AddDbContext<ApplicationDBContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<ISuKienService, SuKienService>();
builder.Services.AddScoped<INguoiDungService, NguoiDungService>();
builder.Services.AddScoped<IDangKyService, DangKyService>();
builder.Services.AddScoped<IDiaDiemService, DiaDiemService>();
builder.Services.AddScoped<IDanhMucService, DanhMucService>();
builder.Services.AddScoped<ICongViecService, CongViecService>();
builder.Services.AddScoped<IThongBaoService, ThongBaoService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IBaoCaoService, BaoCaoService>();
builder.Services.AddHostedService<EventLifecycleHostedService>();

// ========== JWT AUTHENTICATION ==========
var jwtKey = builder.Configuration["Jwt:Key"] ?? "UTE-Events-SecretKey-2026-For-JWT-Token-VeryLongAndSecure!!!";
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Auto-migrate schema fixes
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
    try
    {
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SuKien') AND name = 'CancelReason')
                ALTER TABLE SuKien ADD CancelReason NVARCHAR(500) NULL;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SuKien') AND name = 'gioHuyTruocBatDauPhut')
                ALTER TABLE SuKien ADD gioHuyTruocBatDauPhut INT NOT NULL CONSTRAINT DF_SK_GioHuy DEFAULT 120;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SuKien') AND name = 'yeuCauKhaoSatCheckout')
                ALTER TABLE SuKien ADD yeuCauKhaoSatCheckout BIT NOT NULL CONSTRAINT DF_SK_YeuCauKS DEFAULT 1;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SuKien') AND name = 'daXuLyKetThuc')
                ALTER TABLE SuKien ADD daXuLyKetThuc BIT NOT NULL CONSTRAINT DF_SK_DaXuLyKT DEFAULT 0;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SuKien') AND name = 'yeuCauXacNhan')
                ALTER TABLE SuKien ADD yeuCauXacNhan BIT NOT NULL DEFAULT 0;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'soVangMatLienTiep')
                ALTER TABLE NguoiDung ADD soVangMatLienTiep INT NOT NULL CONSTRAINT DF_ND_SoVangMat DEFAULT 0;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'khoaDangKyDen')
                ALTER TABLE NguoiDung ADD khoaDangKyDen DATETIME2 NULL;

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DangKySuKien') AND name = 'checkoutTuDong')
                ALTER TABLE DangKySuKien ADD checkoutTuDong BIT NOT NULL CONSTRAINT DF_DK_CheckoutTD DEFAULT 0;
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error running custom database migration: {ex.Message}");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();
// app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();