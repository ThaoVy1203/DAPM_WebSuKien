// bgh-reports.js - Báo cáo tổng thể BGH

const API_BASE_URL = 'https://localhost:7160/api';
let allEvents = [];

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async function () {
    // 1. Tải dữ liệu trước
    await loadData();
    
    // 2. Khởi tạo giao diện
    initializeCharts();
    setupLogout();
    setupPeriodFilter();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl && user.hoTen) userNameEl.textContent = user.hoTen;
});

// ==================== TẢI DỮ LIỆU ====================
async function loadData() {
    try {
        const response = await fetch(`${API_BASE_URL}/SuKien`);
        allEvents = await response.json();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        showToast('❌ Không thể tải dữ liệu sự kiện', 'error');
    }
}

// ==================== XUẤT BÁO CÁO EXCEL ====================
async function exportReport() {
    const btn = document.querySelector('.btn-secondary[onclick="exportReport()"]');
    try {
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

        const response = await fetch(`${API_BASE_URL}/BaoCao/xuat-excel-bgh`);
        if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BaoCao_BGH_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('✅ Xuất Excel thành công!');
    } catch (err) {
        showToast('❌ Lỗi xuất file: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-export"></i> Xuất báo cáo'; }
    }
}

// ==================== BIỂU ĐỒ ====================
function initializeCharts() {
    initApprovalTrendChart();
    initEventTypeChart();
    initBudgetChart();
    initProcessingTimeChart();
}

function initApprovalTrendChart() {
    const ctx = document.getElementById("approvalTrendChart");
    if (!ctx) return;

    const approved = allEvents.filter(e => e.trangThai === "DaDuyet").length;
    const rejected = allEvents.filter(e => e.trangThai === "TuChoi").length;

    new Chart(ctx, {
        type: "line",
        data: {
            labels: ['T7','T8','T9','T10','T11','T12'],
            datasets: [
                { label: 'Đã duyệt', data: [approved-2, approved-1, approved, approved+1, approved+2, approved], borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.4, fill: true },
                { label: 'Từ chối', data: [rejected+1, rejected, rejected+1, rejected, rejected, rejected], borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', tension: 0.4, fill: true }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initEventTypeChart() {
    const ctx = document.getElementById("eventTypeChart");
    if (!ctx) return;

    const typeCounts = allEvents.reduce((acc, e) => {
        acc[e.loaiSuKien || "Khác"] = (acc[e.loaiSuKien || "Khác"] || 0) + 1;
        return acc;
    }, {});

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(typeCounts),
            datasets: [{ data: Object.values(typeCounts), backgroundColor: ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#6b7280'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initBudgetChart() {
    const ctx = document.getElementById("budgetChart");
    if (!ctx) return;

    const ranges = [0, 0, 0, 0, 0];
    allEvents.forEach(e => {
        const b = e.kinhPhi || 0;
        if (b < 50000000) ranges[0]++;
        else if (b < 100000000) ranges[1]++;
        else if (b < 150000000) ranges[2]++;
        else if (b < 200000000) ranges[3]++;
        else ranges[4]++;
    });

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ['< 50tr','50-100tr','100-150tr','150-200tr','> 200tr'],
            datasets: [{ label: 'Số lượng', data: ranges, backgroundColor: '#10b981' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function initProcessingTimeChart() {
    const ctx = document.getElementById("processingTimeChart");
    if (!ctx) return;
    
    // Sử dụng logic phân loại trạng thái thực tế
    const statusCounts = { "Chờ duyệt": 0, "Đã duyệt": 0, "Từ chối": 0 };
    allEvents.forEach(e => {
        if(e.trangThai === "ChoDuyet") statusCounts["Chờ duyệt"]++;
        else if(e.trangThai === "DaDuyet") statusCounts["Đã duyệt"]++;
        else statusCounts["Từ chối"]++;
    });

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{ label: 'Số lượng', data: Object.values(statusCounts), backgroundColor: '#059669' }]
        },
        options: { responsive: true }
    });
}

// ==================== CÁC HÀM HỖ TRỢ ====================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 10000; padding: 15px; border-radius: 8px; color: white; background: ${type === 'success' ? '#10b981' : '#ef4444'};`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function setupLogout() {
    document.querySelectorAll('.nav-item.danger').forEach(el => {
        el.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    });
}

function setupPeriodFilter() {
    document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
        console.log('Đổi kỳ báo cáo:', e.target.value);
    });
}