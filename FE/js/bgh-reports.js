<<<<<<< HEAD
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
=======
// bgh-reports.js - Báo cáo tổng thể BGH

const API_BASE_URL = 'http://localhost:5103/api';

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    setupLogout();
    setupPeriodFilter();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl && user.hoTen) userNameEl.textContent = user.hoTen;
    if (userRoleEl) userRoleEl.textContent = 'Cán bộ phê duyệt cấp 2';
});

// ==================== TOAST THÔNG BÁO ====================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 80px; right: 20px; z-index: 10000;
        padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2); min-width: 300px; font-size: 15px;
    `;
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-30px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ==================== XUẤT BÁO CÁO EXCEL ====================
async function exportReport() {
    await xuatExcelVoiRetry(1);
}

async function xuatExcelVoiRetry(lanThu) {
    const btn = document.querySelector('.btn-secondary[onclick="exportReport()"]');
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';
        }

        const response = await fetch(`${API_BASE_URL}/BaoCao/xuat-excel-bgh`);

        if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('File rỗng');

        // Tải file trước
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `BaoCao_BGH_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Hiển thị toast (không dùng alert)
        showToast('✅ Xuất Excel thành công!<br>File đã được tải về thư mục Downloads.');

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

    } catch (err) {
        console.error('Export Error:', err);
        showToast('❌ Không thể xuất Excel: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-export"></i> Xuất báo cáo';
        }
    }
}

// ==================== LỌC KỲ BÁO CÁO ====================
function setupPeriodFilter() {
    const periodSelect = document.getElementById('reportPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function () {
            console.log('Kỳ báo cáo:', this.value);
        });
    }
}

// ==================== BIỂU ĐỒ ====================
function initializeCharts() {
    initApprovalTrendChart();
    initEventTypeChart();
    initBudgetChart();
    initProcessingTimeChart();
}

>>>>>>> origin/VanHuy
function initApprovalTrendChart() {
    const ctx = document.getElementById("approvalTrendChart");
    if (!ctx) return;
<<<<<<< HEAD

    const approved = allEvents.filter(e => e.trangThai === "DaDuyet").length;
    const rejected = allEvents.filter(e => e.trangThai === "TuChoi").length;

=======
>>>>>>> origin/VanHuy
    new Chart(ctx, {
        type: "line",
        data: {
<<<<<<< HEAD
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
=======
            labels: ['T7/2024','T8/2024','T9/2024','T10/2024','T11/2024','T12/2024'],
            datasets: [
                {
                    label: 'Đã duyệt',
                    data: [28,32,30,35,33,35],
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5,150,105,0.1)',
                    tension: 0.4, fill: true
                },
                {
                    label: 'Từ chối',
                    data: [5,4,6,3,4,3],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220,38,38,0.1)',
                    tension: 0.4, fill: true
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } }
        }
    });
}

>>>>>>> origin/VanHuy
function initEventTypeChart() {
    const ctx = document.getElementById("eventTypeChart");
    if (!ctx) return;
<<<<<<< HEAD

    const typeCounts = {};

    allEvents.forEach(event => {
        const type = event.loaiSuKien || "Khác";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

=======
>>>>>>> origin/VanHuy
    new Chart(ctx, {
        type: "doughnut",
        data: {
<<<<<<< HEAD
            labels: Object.keys(typeCounts),
            datasets: [{
                data: Object.values(typeCounts)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
=======
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ','Khác'],
            datasets: [{
                data: [35,25,20,15,5],
                backgroundColor: ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#6b7280'],
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a,b) => a+b, 0);
                            const pct = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
>>>>>>> origin/VanHuy
            }
        }
    });
}

<<<<<<< HEAD
// =======================
// BUDGET
// =======================
=======
>>>>>>> origin/VanHuy
function initBudgetChart() {
    const ctx = document.getElementById("budgetChart");
    if (!ctx) return;
<<<<<<< HEAD

    const ranges = [0, 0, 0, 0, 0];

    allEvents.forEach(event => {
        const budget = event.kinhPhi || 0;

        if (budget < 50000000) ranges[0]++;
        else if (budget < 100000000) ranges[1]++;
        else if (budget < 150000000) ranges[2]++;
        else if (budget < 200000000) ranges[3]++;
        else ranges[4]++;
    });

=======
>>>>>>> origin/VanHuy
    new Chart(ctx, {
        type: "bar",
        data: {
<<<<<<< HEAD
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
=======
            labels: ['< 50tr','50-100tr','100-150tr','150-200tr','> 200tr'],
            datasets: [{
                label: 'Số lượng sự kiện',
                data: [8,12,10,5,3],
                backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 2 } } }
        }
    });
}

>>>>>>> origin/VanHuy
function initProcessingTimeChart() {
    const ctx = document.getElementById("processingTimeChart");
    if (!ctx) return;
<<<<<<< HEAD

    const pending = allEvents.filter(e => e.trangThai === "ChoDuyet").length;
    const approved = allEvents.filter(e => e.trangThai === "DaDuyet").length;
    const rejected = allEvents.filter(e => e.trangThai === "TuChoi").length;

=======
>>>>>>> origin/VanHuy
    new Chart(ctx, {
        type: "bar",
        data: {
<<<<<<< HEAD
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
=======
            labels: ['< 1h','1-2h','2-3h','3-4h','> 4h'],
            datasets: [{
                label: 'Số lượng hồ sơ',
                data: [5,18,10,4,1],
                backgroundColor: '#059669',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } }
        }
    });
}

// ==================== ĐĂNG XUẤT ====================
function setupLogout() {
    document.querySelectorAll('.nav-item.danger').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    });
>>>>>>> origin/VanHuy
}