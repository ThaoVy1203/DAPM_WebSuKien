@echo off
echo ========================================
echo   KHOI DONG BACKEND - UTE EVENTS
echo ========================================
echo.

cd /d "%~dp0BE\aspiCore"

echo [1/3] Kiem tra .NET SDK...
dotnet --version
if errorlevel 1 (
    echo ERROR: .NET SDK chua duoc cai dat!
    echo Vui long tai tai: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)
echo OK - .NET SDK da san sang
echo.

echo [2/3] Build project...
dotnet build
if errorlevel 1 (
    echo ERROR: Build that bai!
    pause
    exit /b 1
)
echo OK - Build thanh cong
echo.

echo [3/3] Khoi dong Backend...
echo.
echo ========================================
echo   Backend dang chay tai:
echo   - HTTPS: https://localhost:5001
echo   - HTTP:  http://localhost:5000
echo   - Swagger: https://localhost:5001/swagger
echo ========================================
echo.
echo Nhan Ctrl+C de dung Backend
echo.

dotnet run

pause
