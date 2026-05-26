const API_URL = "https://localhost:7160/api/SuKien";

let allEvents = [];

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", async function () {
    await loadReports();

    const periodSelect = document.getElementById("reportPeriod");
    if (periodSelect) {
        periodSelect.addEventListener("change", loadReports);
    }
});

// =======================
// LOAD DATA
// =======================
async function loadReports() {
    try {
        const response = await fetch(API_URL);
        allEvents = await response.json();

        initApprovalTrendChart();
        initEventTypeChart();
        initBudgetChart();
        initProcessingTimeChart();

    } catch (error) {
        console.error("Lỗi tải báo cáo:", error);
        alert("Không tải được dữ liệu báo cáo");
    }
}

// =======================
// EXPORT
// =======================
function exportReport() {
    const data = JSON.stringify(allEvents, null, 2);

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bgh-report.json";
    a.click();

    URL.revokeObjectURL(url);
}

// =======================
// APPROVAL TREND
// =======================
function initApprovalTrendChart() {
    const ctx = document.getElementById("approvalTrendChart");
    if (!ctx) return;

    const approved = allEvents.filter(e => e.trangThai === "DaDuyet").length;
    const rejected = allEvents.filter(e => e.trangThai === "TuChoi").length;

    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["T7", "T8", "T9", "T10", "T11", "T12"],
            datasets: [
                {
                    label: "Đã duyệt",
                    data: [approved - 5, approved - 4, approved - 3, approved - 2, approved - 1, approved],
                    borderColor: "#059669",
                    backgroundColor: "rgba(5,150,105,0.1)",
                    tension: 0.4,
                    fill: true
                },
                {
                    label: "Từ chối",
                    data: [rejected - 2, rejected - 1, rejected, rejected, rejected + 1, rejected],
                    borderColor: "#dc2626",
                    backgroundColor: "rgba(220,38,38,0.1)",
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: chartOptions()
    });
}

// =======================
// EVENT TYPE
// =======================
function initEventTypeChart() {
    const ctx = document.getElementById("eventTypeChart");
    if (!ctx) return;

    const typeCounts = {};

    allEvents.forEach(event => {
        const type = event.loaiSuKien || "Khác";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(typeCounts),
            datasets: [{
                data: Object.values(typeCounts)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

// =======================
// BUDGET
// =======================
function initBudgetChart() {
    const ctx = document.getElementById("budgetChart");
    if (!ctx) return;

    const ranges = [0, 0, 0, 0, 0];

    allEvents.forEach(event => {
        const budget = event.kinhPhi || 0;

        if (budget < 50000000) ranges[0]++;
        else if (budget < 100000000) ranges[1]++;
        else if (budget < 150000000) ranges[2]++;
        else if (budget < 200000000) ranges[3]++;
        else ranges[4]++;
    });

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["<50tr", "50-100tr", "100-150tr", "150-200tr", ">200tr"],
            datasets: [{
                label: "Số lượng sự kiện",
                data: ranges
            }]
        },
        options: chartOptions()
    });
}

// =======================
// PROCESSING TIME
// =======================
function initProcessingTimeChart() {
    const ctx = document.getElementById("processingTimeChart");
    if (!ctx) return;

    const pending = allEvents.filter(e => e.trangThai === "ChoDuyet").length;
    const approved = allEvents.filter(e => e.trangThai === "DaDuyet").length;
    const rejected = allEvents.filter(e => e.trangThai === "TuChoi").length;

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Chờ duyệt", "Đã duyệt", "Từ chối"],
            datasets: [{
                label: "Số lượng",
                data: [pending, approved, rejected],
                backgroundColor: "#059669"
            }]
        },
        options: chartOptions()
    });
}

// =======================
// COMMON OPTIONS
// =======================
function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: "bottom"
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };
}