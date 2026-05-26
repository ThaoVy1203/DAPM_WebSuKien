namespace aspiCore.Dtos.DangKy
{
    /// <summary>QR do người tham gia hiển thị: UTE-CHECKIN-{idDangKy}-{timestamp}</summary>
    public class QrCheckInDto
    {
        public string QrToken { get; set; } = string.Empty;
    }
}
