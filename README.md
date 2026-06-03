# 🎓 UTE EVENTS - HỆ THỐNG QUẢN LÝ SỰ KIỆN

Hệ thống quản lý sự kiện cho Trường Đại học Sư phạm Kỹ thuật Đà Nẵng

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core |
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Tài liệu API | Swagger (khi chạy BE) |

---

## 📚 Mục lục

1. [Khởi động nhanh](#-khởi-động-nhanh)
2. [Tổng quan chức năng](#-tổng-quan-chức-năng)
3. [Cấu trúc dự án](#-cấu-trúc-dự-án)
4. [Cài đặt & chạy chi tiết](#-cài-đặt--chạy-chi-tiết)
5. [Luồng nghiệp vụ — Người tham gia](#-luồng-nghiệp-vụ--người-tham-gia)
6. [API đăng ký / vé / check-in](#-api-đăng-ký--vé--check-in)
7. [Trang frontend theo vai trò](#-trang-frontend-theo-vai-trò)
8. [Tài khoản test](#-tài-khoản-test)
9. [Cập nhật gần đây](#-cập-nhật-gần-đây)
10. [Tài liệu bổ sung](#-tài-liệu-bổ-sung)
11. [Khắc phục sự cố](#-khắc-phục-sự-cố)

---

## 🚀 KHỞI ĐỘNG NHANH

### 1️⃣ Khởi động Backend
```bash
# Cách 1: Double-click file
start-backend.bat

# Cách 2: Command line
cd BE\aspiCore
dotnet run