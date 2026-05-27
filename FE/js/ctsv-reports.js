// ctsv-reports.js - Báo cáo thống kê CTSV

const API_BASE_URL = 'http://localhost:5103/api';

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    setupLogout();

    // Cập nhật tên user từ localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl && user.hoTen) userNameEl.textContent = user.hoTen;
    if (userRoleEl && user.vaiTros?.length > 0) {
        userRoleEl.textContent = 'Cán bộ phê duyệt cấp 1';
    }
});

// ==================== XUẤT EXCEL ====================
function showAlert(message, type = 'success') {
    const existing = document.getElementById('custom-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-alert';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const color = type === 'success' ? '#059669' : '#DC2626';
    const icon  = type === 'success' ? 'check-circle' : 'times-circle';
    const title = type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra!';

    overlay.innerHTML = `
        <style>
            @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
            @keyframes popIn   { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
        </style>
        <div style="
            background: white;
            border-radius: 16px;
            padding: 36px 40px;
            text-align: center;
            max-width: 380px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: popIn 0.25s ease;
        ">
            <i class="fas fa-${icon}" style="font-size:52px; color:${color}; margin-bottom:16px; display:block;"></i>
            <h3 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#111827;">${title}</h3>
            <p style="margin:0 0 24px 0; font-size:15px; color:#6B7280; line-height:1.5;">${message}</p>
            <button onclick="document.getElementById('custom-alert').remove()" style="
                background: ${color};
                color: white;
                border: none;
                padding: 10px 32px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Tự đóng sau 4 giây
    setTimeout(() => overlay?.remove(), 4000);
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

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `BaoCao_BGH_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

        showAlert('✅ Xuất Excel thành công! File đang tải về...');

    } catch (err) {
        if (lanThu < 2) {
            await new Promise(r => setTimeout(r, 1000));
            await xuatExcelVoiRetry(lanThu + 1);
            return;
        }
        console.error('Export Error:', err);
        showAlert('❌ Không thể xuất Excel: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-export"></i> Xuất báo cáo';
        }
    }
}

// ==================== IN BÁO CÁO ====================
function printReport() {
    // Ẩn các phần không cần in
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    const headerActions = document.querySelector('.header-actions');
    const footer = document.querySelector('.footer');

    // Thêm tiêu đề in
    const printTitle = document.createElement('div');
    printTitle.id = 'print-title';
    printTitle.style.cssText = `
        display: none;
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #059669;
    `;
    printTitle.innerHTML = `
        <h1 style="font-size:20px; font-weight:700; color:#059669; margin:0 0 4px 0;">
            BÁO CÁO THỐNG KÊ HOẠT ĐỘNG SỰ KIỆN
        </h1>
        <p style="font-size:13px; color:#6B7280; margin:0;">
            Trường Đại học Sư phạm Kỹ thuật Đà Nẵng &nbsp;|&nbsp; 
            Ngày in: ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
    `;
    document.querySelector('.main-content').prepend(printTitle);

    // CSS in ấn
    const printStyle = document.createElement('style');
    printStyle.id = 'print-style';
    printStyle.textContent = `
        @media print {
            #print-title { display: block !important; }
            .header, .sidebar, .header-actions,
            .footer, .period-select, .btn-secondary, .btn-primary,
            .search-bar { display: none !important; }
            .main-container { display: block !important; }
            .main-content { padding: 0 !important; margin: 0 !important; }
            body { font-size: 12px; }
            .stat-card { break-inside: avoid; }
            .chart-card { break-inside: avoid; page-break-inside: avoid; }
            .stats-table table { font-size: 11px; }
            canvas { max-height: 200px !important; }
        }
    `;
    document.head.appendChild(printStyle);

    window.print();

    // Dọn dẹp sau khi in
    setTimeout(() => {
        document.getElementById('print-title')?.remove();
        document.getElementById('print-style')?.remove();
    }, 1000);
}

// ==================== THAY ĐỔI KỲ BÁO CÁO ====================
function changePeriod() {
    const period = document.getElementById('periodSelect').value;
    const labels = {
        month: 'tháng này',
        quarter: 'quý này',
        year: 'năm nay',
        custom: 'tùy chỉnh'
    };
    console.log('Chuyển kỳ báo cáo:', period);
    // Trong thực tế sẽ gọi API lọc theo kỳ
}

// ==================== BIỂU ĐỒ ====================
function initializeCharts() {
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
                {
                    label: 'Đã duyệt',
                    data: [8,12,10,15,11,14,13,16,12,18,15,17],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    tension: 0.4, fill: true
                },
                {
                    label: 'Từ chối',
                    data: [2,1,3,2,2,1,2,1,3,2,1,2],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    tension: 0.4, fill: true
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function createEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{
                data: [42,35,28,22],
                backgroundColor: ['#3B82F6','#8B5CF6','#F59E0B','#EC4899'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, font: { size: 13 }, usePointStyle: true, pointStyle: 'circle' }
                }
            }
        }
    });
}

function createBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{
                data: [4.2,2.1,3.36,2.84],
                backgroundColor: ['rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(245,158,11,0.8)','rgba(236,72,153,0.8)'],
                borderColor: ['#3B82F6','#8B5CF6','#F59E0B','#EC4899'],
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => v + ' tỷ' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function createApprovalTimeChart() {
    const ctx = document.getElementById('approvalTimeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo','Workshop','Thi đấu','Văn nghệ'],
            datasets: [{
                data: [2.8,2.2,2.5,2.6],
                backgroundColor: 'rgba(5,150,105,0.8)',
                borderColor: '#059669',
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { callback: v => v + 'h' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { grid: { display: false } }
            }
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
}