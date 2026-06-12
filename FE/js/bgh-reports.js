// bgh-reports.js - Báo cáo tổng thể BGH

const API_BASE_URL = 'http://localhost:5103/api';
let allEvents = [];

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async function () {
    await loadData();
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
    }
}

// ==================== THÔNG BÁO GIỮA MÀN HÌNH ====================
function showAlert(message, type = 'success') {
    const existing = document.getElementById('custom-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-alert';
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 99999;
        display: flex; align-items: center; justify-content: center;
    `;

    const color  = type === 'success' ? '#059669' : '#DC2626';
    const icon   = type === 'success' ? 'check-circle' : 'times-circle';
    const title  = type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra!';

    overlay.innerHTML = `
        <style>
            @keyframes popIn { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
        </style>
        <div style="background:white; border-radius:16px; padding:36px 40px;
                    text-align:center; max-width:380px; width:90%;
                    box-shadow:0 20px 60px rgba(0,0,0,0.3);
                    animation:popIn 0.25s ease;">
            <i class="fas fa-${icon}" style="font-size:52px; color:${color}; margin-bottom:16px; display:block;"></i>
            <h3 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#111827;">${title}</h3>
            <p style="margin:0 0 24px 0; font-size:15px; color:#6B7280; line-height:1.5;">${message}</p>
            <button onclick="document.getElementById('custom-alert').remove()" style="
                background:${color}; color:white; border:none;
                padding:10px 32px; border-radius:8px;
                font-size:15px; font-weight:600; cursor:pointer;">OK</button>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

// ==================== XUẤT BÁO CÁO EXCEL ====================
async function exportReport() {
    const btn = document.querySelector('.btn-secondary[onclick="exportReport()"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';
        }

        const response = await fetch(`${API_BASE_URL}/BaoCao/xuat-excel-bgh`, {
            method: 'GET',
            headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        if (!response.ok) throw new Error(`Lỗi server (${response.status})`);

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('File trả về rỗng');

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `BaoCao_BGH_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        showAlert('File Excel đã được tải về máy thành công!');

    } catch (err) {
        console.error('Export error:', err);
        showAlert('Không thể xuất Excel: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-export"></i> Xuất báo cáo';
        }
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
    const ctx = document.getElementById('approvalTrendChart');
    if (!ctx) return;
    const approved = allEvents.filter(e => e.trangThai === 'Đã duyệt').length;
    const rejected = allEvents.filter(e => e.trangThai === 'Từ chối').length;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T7/2024','T8/2024','T9/2024','T10/2024','T11/2024','T12/2024'],
            datasets: [
                { label: 'Đã duyệt', data: [28,32,30,35,33,approved||35], borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.4, fill: true },
                { label: 'Từ chối',  data: [5,4,6,3,4,rejected||3],  borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)',  tension: 0.4, fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ','Khác'],
            datasets: [{ data: [35,25,20,15,5], backgroundColor: ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#6b7280'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 50tr','50-100tr','100-150tr','150-200tr','> 200tr'],
            datasets: [{ label: 'Số lượng sự kiện', data: [8,12,10,5,3], backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function initProcessingTimeChart() {
    const ctx = document.getElementById('processingTimeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 1h','1-2h','2-3h','3-4h','> 4h'],
            datasets: [{ label: 'Số lượng hồ sơ', data: [5,18,10,4,1], backgroundColor: '#059669', borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// ==================== HỖ TRỢ ====================
function setupLogout() {
    document.querySelectorAll('.nav-item.danger').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    });
}

function setupPeriodFilter() {
    document.getElementById('reportPeriod')?.addEventListener('change', function(e) {
        console.log('Đổi kỳ báo cáo:', e.target.value);
    });
}