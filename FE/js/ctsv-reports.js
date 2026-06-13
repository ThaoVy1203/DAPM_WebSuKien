// ctsv-reports.js - Báo cáo CTSV

const API_URL = 'http://localhost:5103/api/SuKien';
const API_BASE_URL = 'http://localhost:5103/api';
let allEvents = [];

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async function () {
    await loadReports();

    const periodSelect = document.getElementById('reportPeriod') || document.getElementById('periodSelect');
    if (periodSelect) periodSelect.addEventListener('change', loadReports);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl && user.hoTen) userNameEl.textContent = user.hoTen;
    if (userRoleEl) userRoleEl.textContent = 'Cán bộ phê duyệt cấp 1';

    setupLogout();
});

// ==================== TẢI DỮ LIỆU ====================
async function loadReports() {
    try {
        const response = await fetch(API_URL);
        allEvents = await response.json();
        initializeCharts();
    } catch (error) {
        console.error('Lỗi tải báo cáo:', error);
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

    const color = type === 'success' ? '#059669' : '#DC2626';
    const icon  = type === 'success' ? 'check-circle' : 'times-circle';
    const title = type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra!';

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

// ==================== XUẤT EXCEL ====================
async function exportReport() {
    const btn = document.querySelector('.btn-primary[onclick="exportReport()"]');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';
        }

        const response = await fetch(`${API_BASE_URL}/BaoCao/xuat-excel-ctsv`, {
            method: 'GET',
            headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        if (!response.ok) throw new Error(`Lỗi server (${response.status})`);

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('File trả về rỗng');

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `BaoCao_CTSV_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            btn.innerHTML = '<i class="fas fa-file-export"></i> Xuất Excel';
        }
    }
}

// ==================== IN BÁO CÁO ====================
function printReport() {
    const printTitle = document.createElement('div');
    printTitle.id = 'print-title';
    printTitle.style.cssText = 'display:none; text-align:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid #059669;';
    printTitle.innerHTML = `
        <h1 style="font-size:20px; font-weight:700; color:#059669; margin:0 0 4px 0;">BÁO CÁO THỐNG KÊ HOẠT ĐỘNG SỰ KIỆN</h1>
        <p style="font-size:13px; color:#6B7280; margin:0;">Trường Đại học Sư phạm Kỹ thuật Đà Nẵng &nbsp;|&nbsp; Ngày in: ${new Date().toLocaleDateString('vi-VN', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>`;
    document.querySelector('.main-content')?.prepend(printTitle);

    const printStyle = document.createElement('style');
    printStyle.id = 'print-style';
    printStyle.textContent = `
        @media print {
            #print-title { display:block !important; }
            .header, .sidebar, .header-actions, .footer, .period-select,
            .btn-secondary, .btn-primary, .search-bar { display:none !important; }
            .main-container { display:block !important; }
            .main-content { padding:0 !important; margin:0 !important; }
            canvas { max-height:200px !important; }
        }`;
    document.head.appendChild(printStyle);

    window.print();

    setTimeout(() => {
        document.getElementById('print-title')?.remove();
        document.getElementById('print-style')?.remove();
    }, 1000);
}

// ==================== BIỂU ĐỒ ====================
function initializeCharts() {
    // Hủy chart cũ nếu có để vẽ lại
    ['eventTrendChart','eventTypeChart','budgetChart','approvalTimeChart'].forEach(id => {
        const existing = Chart.getChart(id);
        if (existing) existing.destroy();
    });
    createEventTrendChart();
    createEventTypeChart();
    createBudgetChart();
    createApprovalTimeChart();
}

function createEventTrendChart() {
    const ctx = document.getElementById('eventTrendChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
            datasets: [
                { label: 'Đã duyệt', data: [8,12,10,15,11,14,13,16,12,18,15,17], borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
                { label: 'Từ chối',  data: [2,1,3,2,2,1,2,1,3,2,1,2], borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });
}

function createEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{ data: [42,35,28,22], backgroundColor: ['#3B82F6','#8B5CF6','#F59E0B','#EC4899'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function createBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{ data: [4.2,2.1,3.36,2.84], backgroundColor: ['rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(245,158,11,0.8)','rgba(236,72,153,0.8)'], borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' tỷ' } } } }
    });
}

function createApprovalTimeChart() {
    const ctx = document.getElementById('approvalTimeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{ data: [2.8,2.2,2.5,2.6], backgroundColor: 'rgba(5,150,105,0.8)', borderRadius: 8 }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { callback: v => v + 'h' } } } }
    });
}

// ==================== ĐĂNG XUẤT ====================
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

function changePeriod() {
    console.log('Đổi kỳ báo cáo');
}