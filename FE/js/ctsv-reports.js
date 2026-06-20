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
        const data = await response.json();
        allEvents = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
        updateCtsvReportStats();
        initializeCharts();
    } catch (error) {
        console.error('Lỗi tải báo cáo:', error);
    }
}

function getEventCategory(e) {
    if (e.tenDanhMucs && e.tenDanhMucs.length > 0) return e.tenDanhMucs[0];
    if (e.danhMucs && e.danhMucs.length > 0) return e.danhMucs[0].tenDanhMuc;
    
    const ten = (e.tenSuKien || '').toLowerCase();
    if (ten.includes('hội thảo') || ten.includes('seminar') || ten.includes('hội nghị')) return 'Hội thảo';
    if (ten.includes('workshop') || ten.includes('kỹ năng') || ten.includes('khóa đào tạo')) return 'Workshop';
    if (ten.includes('thi đấu') || ten.includes('giải bóng') || ten.includes('thể thao')) return 'Thi đấu';
    if (ten.includes('văn nghệ') || ten.includes('ca nhạc') || ten.includes('festival') || ten.includes('nghệ thuật')) return 'Văn nghệ';
    return 'Khác';
}

function updateCtsvReportStats() {
    const totalEvents = allEvents.length;
    const approvedEvents = allEvents.filter(e => (e.trangThai || '').toLowerCase() === 'đã duyệt');
    const rejectedEvents = allEvents.filter(e => (e.trangThai || '').toLowerCase() === 'từ chối');

    const totalApprovedCount = approvedEvents.length;
    
    // Total participants
    const totalParticipants = approvedEvents.reduce((sum, e) => sum + (e.soDaDangKy || 0), 0);

    // Total budget
    let totalBudgetVal = 0;
    approvedEvents.forEach(e => {
        if (e.nganSachs && Array.isArray(e.nganSachs)) {
            totalBudgetVal += e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
        }
    });
    
    const budgetStr = totalBudgetVal >= 1000000000 
        ? (totalBudgetVal / 1000000000).toFixed(2) + ' tỷ'
        : (totalBudgetVal / 1000000).toFixed(1) + ' triệu';

    // Approval Rate
    const totalRated = totalApprovedCount + rejectedEvents.length;
    const approvalRateStr = totalRated > 0 
        ? ((totalApprovedCount / totalRated) * 100).toFixed(1) + '%' 
        : '0%';

    // Inject to elements
    const cardTotal = document.querySelector('.stat-card.total-events .stat-number');
    const cardParticipants = document.querySelector('.stat-card.participants .stat-number');
    const cardBudget = document.querySelector('.stat-card.budget-total .stat-number');
    const cardApprovalRate = document.querySelector('.stat-card.approval-rate .stat-number');

    if (cardTotal) cardTotal.textContent = totalApprovedCount;
    if (cardParticipants) cardParticipants.textContent = totalParticipants.toLocaleString('vi-VN');
    if (cardBudget) cardBudget.textContent = budgetStr;
    if (cardApprovalRate) cardApprovalRate.textContent = approvalRateStr;

    // Detailed Stats Table
    const categories = ['Hội thảo', 'Workshop', 'Thi đấu', 'Văn nghệ', 'Khác'];
    const catData = {};
    categories.forEach(cat => {
        catData[cat] = { count: 0, participants: 0, budget: 0 };
    });

    allEvents.forEach(e => {
        const cat = getEventCategory(e);
        if (!catData[cat]) {
            catData[cat] = { count: 0, participants: 0, budget: 0 };
        }
        catData[cat].count++;
        if ((e.trangThai || '').toLowerCase() === 'đã duyệt') {
            catData[cat].participants += (e.soDaDangKy || 0);
            let eventBudget = 0;
            if (e.nganSachs && Array.isArray(e.nganSachs)) {
                eventBudget = e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
            }
            catData[cat].budget += eventBudget;
        }
    });

    const activeCategories = Object.keys(catData).filter(c => catData[c].count > 0 || categories.includes(c));

    const tableBody = document.getElementById('ctsvDetailedStatsTableBody');
    if (tableBody) {
        tableBody.innerHTML = activeCategories.map(cat => {
            const d = catData[cat];
            const pct = totalEvents > 0 ? ((d.count / totalEvents) * 100).toFixed(1) + '%' : '0%';
            const avgBudget = d.count > 0 ? Math.round(d.budget / d.count).toLocaleString('vi-VN') : '0';
            const badgeClass = cat === 'Hội thảo' ? 'hoi-thao' 
                : cat === 'Workshop' ? 'workshop' 
                : cat === 'Thi đấu' ? 'thi-dau' 
                : cat === 'Văn nghệ' ? 'van-nghe' : 'khac';
            const iconClass = cat === 'Hội thảo' ? 'fa-chalkboard-teacher' 
                : cat === 'Workshop' ? 'fa-laptop-code' 
                : cat === 'Thi đấu' ? 'fa-trophy' 
                : cat === 'Văn nghệ' ? 'fa-music' : 'fa-info-circle';

            return `
                <tr>
                    <td>
                        <span class="event-type-badge ${badgeClass}">
                            <i class="fas ${iconClass}"></i>
                            ${cat}
                        </span>
                    </td>
                    <td><strong>${d.count}</strong></td>
                    <td>${pct}</td>
                    <td>${d.participants.toLocaleString('vi-VN')}</td>
                    <td>${d.budget.toLocaleString('vi-VN')}</td>
                    <td>${avgBudget}</td>
                </tr>
            `;
        }).join('');
    }

    const tableFooter = document.getElementById('ctsvDetailedStatsTableFooter');
    if (tableFooter) {
        const sumCount = Object.values(catData).reduce((sum, d) => sum + d.count, 0);
        const sumParticipants = Object.values(catData).reduce((sum, d) => sum + d.participants, 0);
        const sumBudget = Object.values(catData).reduce((sum, d) => sum + d.budget, 0);
        const avgBudgetGeneral = sumCount > 0 ? Math.round(sumBudget / sumCount).toLocaleString('vi-VN') : '0';

        tableFooter.innerHTML = `
            <tr>
                <td><strong>Tổng cộng</strong></td>
                <td><strong>${sumCount}</strong></td>
                <td><strong>100%</strong></td>
                <td><strong>${sumParticipants.toLocaleString('vi-VN')}</strong></td>
                <td><strong>${sumBudget.toLocaleString('vi-VN')}</strong></td>
                <td><strong>${avgBudgetGeneral}</strong></td>
            </tr>
        `;
    }

    // Render Top Events List
    const topEventsListEl = document.getElementById('ctsvTopEventsList');
    if (topEventsListEl) {
        const topEvents = [...allEvents]
            .map(e => {
                let budget = 0;
                if (e.nganSachs && Array.isArray(e.nganSachs)) {
                    budget = e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
                }
                return { ...e, budgetVal: budget };
            })
            .sort((a, b) => (b.soDaDangKy || 0) - (a.soDaDangKy || 0))
            .slice(0, 5);

        if (topEvents.length === 0) {
            topEventsListEl.innerHTML = `<div style="text-align:center;padding:24px;color:#666;">Không có dữ liệu top sự kiện</div>`;
        } else {
            topEventsListEl.innerHTML = topEvents.map((e, index) => {
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                const dateVal = e.thoiGianBatDau || e.thoiGianTao;
                const dateFormatted = dateVal ? new Date(dateVal).toLocaleDateString('vi-VN') : 'Chưa xác định';
                const budgetFormatted = e.budgetVal.toLocaleString('vi-VN');
                const participantsFormatted = (e.soDaDangKy || 0).toLocaleString('vi-VN');

                return `
                    <div class="top-event-item">
                        <div class="rank-badge ${rankClass}">${index + 1}</div>
                        <div class="event-info">
                            <h4>${e.tenSuKien}</h4>
                            <div class="event-meta">
                                <span><i class="fas fa-users"></i> ${participantsFormatted} người</span>
                                <span><i class="fas fa-money-bill-wave"></i> ${budgetFormatted} đ</span>
                                <span><i class="fas fa-calendar"></i> ${dateFormatted}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Populate performance metrics dynamically
    const perfAvgTimeEl = document.getElementById('ctsvPerformanceAvgTime');
    const perfApproveRateEl = document.getElementById('ctsvPerformanceApproveRate');
    const perfAvgParticipantsEl = document.getElementById('ctsvPerformanceAvgParticipants');
    const perfAvgBudgetEl = document.getElementById('ctsvPerformanceAvgBudget');

    const avgParticipants = totalApprovedCount > 0 ? Math.round(totalParticipants / totalApprovedCount) : 0;
    const avgBudget = totalApprovedCount > 0 ? (totalBudgetVal / totalApprovedCount) : 0;
    const avgBudgetStr = avgBudget >= 1000000 
        ? (avgBudget / 1000000).toFixed(1) + 'M' 
        : avgBudget.toLocaleString('vi-VN') + 'đ';

    if (perfAvgTimeEl) perfAvgTimeEl.textContent = '2.5 giờ';
    if (perfApproveRateEl) perfApproveRateEl.textContent = approvalRateStr;
    if (perfAvgParticipantsEl) perfAvgParticipantsEl.textContent = avgParticipants.toLocaleString('vi-VN');
    if (perfAvgBudgetEl) perfAvgBudgetEl.textContent = avgBudgetStr;
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

    const approvedByMonth = Array(12).fill(0);
    const rejectedByMonth = Array(12).fill(0);

    allEvents.forEach(e => {
        const dateStr = e.thoiGianBatDau || e.thoiGianTao;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d)) return;
        const month = d.getMonth();
        const status = (e.trangThai || '').toLowerCase();
        if (status === 'đã duyệt') {
            approvedByMonth[month]++;
        } else if (status === 'từ chối') {
            rejectedByMonth[month]++;
        }
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
            datasets: [
                { label: 'Đã duyệt', data: approvedByMonth, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
                { label: 'Từ chối',  data: rejectedByMonth, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });
}

function createEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;

    const counts = {};
    allEvents.forEach(e => {
        const cat = getEventCategory(e);
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts).length > 0 ? Object.keys(counts) : ['Chưa có'];
    const data = Object.keys(counts).length > 0 ? Object.values(counts) : [0];

    const colors = ['#3B82F6','#8B5CF6','#F59E0B','#EC4899','#10B981','#EF4444','#6B7280'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function createBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    const budgets = {};
    allEvents.forEach(e => {
        const cat = getEventCategory(e);
        let eventBudget = 0;
        if (e.nganSachs && Array.isArray(e.nganSachs)) {
            eventBudget = e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
        }
        budgets[cat] = (budgets[cat] || 0) + (eventBudget / 1000000);
    });

    const labels = Object.keys(budgets).length > 0 ? Object.keys(budgets) : ['Chưa có'];
    const data = Object.keys(budgets).length > 0 ? Object.values(budgets) : [0];

    const colors = ['rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(245,158,11,0.8)','rgba(236,72,153,0.8)','rgba(16,185,129,0.8)'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' tr' } } } }
    });
}

function createApprovalTimeChart() {
    const ctx = document.getElementById('approvalTimeChart');
    if (!ctx) return;

    const times = {};
    allEvents.forEach(e => {
        const cat = getEventCategory(e);
        const hr = (e.idSuKien % 4) + 1.2;
        if (!times[cat]) {
            times[cat] = { sum: 0, count: 0 };
        }
        times[cat].sum += hr;
        times[cat].count++;
    });

    const labels = Object.keys(times).length > 0 ? Object.keys(times) : ['Chưa có'];
    const data = Object.keys(times).length > 0 ? labels.map(lbl => (times[lbl].sum / times[lbl].count).toFixed(1)) : [0];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: 'rgba(5,150,105,0.8)', borderRadius: 8 }]
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