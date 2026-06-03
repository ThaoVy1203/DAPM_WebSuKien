namespace aspiCore.Dtos.DangKy
{
    /// <summary>QR do người tham gia hiển thị: UTE-CHECKIN-{idDangKy}-{timestamp}</summary>
    public class QrCheckInDto
    {
        public string QrToken { get; set; } = string.Empty;
        // Offline fallback: kiosk lưu lại thời gian quét (epoch ms).
        // Nếu null thì backend dùng DateTime.Now.
        public long? ScanTimeMs { get; set; }
    }
}
