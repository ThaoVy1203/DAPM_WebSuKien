namespace aspiCore.Dtos.Report
{
    public class ReportDetailDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // event, budget
        public string TypeLabel { get; set; } = string.Empty;
        public string TypeIcon { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = "completed";
        public string StatusLabel { get; set; } = "Hoàn thành";
        public string Date { get; set; } = string.Empty;
        public string Creator { get; set; } = "Trưởng Ban Tổ chức";
        public string Event { get; set; } = string.Empty;
        public string Updated { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
