const API_URL = "http://localhost:5103/api/SuKien";

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

function initEventTypeChart() {
    const ctx = document.getElementById("eventTypeChart");
    if (!ctx) return;

    const typeCounts = {};

    allEvents.forEach(event => {
        const type = event.loaiSuKien || "Khác";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

            }
        }
    });
}

// =======================
// BUDGET
// =======================
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

}