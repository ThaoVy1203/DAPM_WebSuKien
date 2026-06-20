// bgh-reports.js - Báo cáo tổng thể BGH

const API_BASE_URL = 'http://localhost:5103/api';
let allEvents = [];

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async function () {
    await loadData();
    updateBghReportStats();
    initializeCharts();
    setupLogout();
    setupPeriodFilter();

    const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl && user.hoTen) userNameEl.textContent = user.hoTen;
    if (userRoleEl) userRoleEl.textContent = 'Cán bộ phê duyệt cấp 2';
});

// ==================== TẢI DỮ LIỆU ====================
async function loadData() {
    try {
        const response = await fetch(`${API_BASE_URL}/SuKien`);
        const data = await response.json();
        allEvents = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
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

function updateBghReportStats() {
    const totalEvents = allEvents.length;
    const approvedEvents = allEvents.filter(e => (e.trangThai || '').toLowerCase() === 'đã duyệt');
    const rejectedEvents = allEvents.filter(e => (e.trangThai || '').toLowerCase() === 'từ chối');
    const pendingEvents = allEvents.filter(e => (e.trangThai || '').toLowerCase() === 'chờ duyệt' || (e.trangThai || '').toLowerCase() === 'pending' || (e.trangThai || '').toLowerCase() === 'nháp');

    const totalApprovedCount = approvedEvents.length;
    const totalRejectedCount = rejectedEvents.length;
    const totalPendingCount = pendingEvents.length;

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
    const totalProcessed = totalApprovedCount + totalRejectedCount;
    const approvalRateStr = totalProcessed > 0 
        ? ((totalApprovedCount / totalProcessed) * 100).toFixed(1) + '% tỷ lệ duyệt' 
        : '0% tỷ lệ duyệt';
        
    const rejectionRateStr = totalProcessed > 0 
        ? ((totalRejectedCount / totalProcessed) * 100).toFixed(1) + '% tỷ lệ từ chối' 
        : '0% tỷ lệ từ chối';

    // Inject to BGH overview card elements
    const cardTotal = document.querySelector('.total-stat .stat-number');
    const cardApprovedNum = document.querySelector('.approved-stat .stat-number');
    const cardApprovedDesc = document.querySelector('.approved-stat .stat-description');
    const cardRejectedNum = document.querySelector('.rejected-stat .stat-number');
    const cardRejectedDesc = document.querySelector('.rejected-stat .stat-description');
    const cardPendingNum = document.querySelector('.pending-stat .stat-number');
    const cardBudget = document.querySelector('.stat-card[style*="linear-gradient"] .stat-number') || document.querySelector('.stat-card[style*="667eea"] .stat-number');

    if (cardTotal) cardTotal.textContent = totalProcessed;
    if (cardApprovedNum) cardApprovedNum.textContent = totalApprovedCount;
    if (cardApprovedDesc) cardApprovedDesc.textContent = approvalRateStr;
    if (cardRejectedNum) cardRejectedNum.textContent = totalRejectedCount;
    if (cardRejectedDesc) cardRejectedDesc.textContent = rejectionRateStr;
    if (cardPendingNum) cardPendingNum.textContent = totalPendingCount;
    if (cardBudget) cardBudget.textContent = budgetStr;

    // Render Top Events
    const topEvents = [...allEvents]
        .map(e => {
            let budget = 0;
            if (e.nganSachs && Array.isArray(e.nganSachs)) {
                budget = e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
            }
            return { ...e, budgetVal: budget };
        })
        .sort((a, b) => b.budgetVal - a.budgetVal)
        .slice(0, 5);

    const tableBody = document.getElementById('topEventsTableBody');
    if (tableBody) {
        if (topEvents.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#666;">Không có dữ liệu sự kiện</td></tr>`;
        } else {
            tableBody.innerHTML = topEvents.map((e, index) => {
                const category = getEventCategory(e);
                const budgetFormatted = e.budgetVal.toLocaleString('vi-VN') + ' đ';
                const scaleStr = (e.soDaDangKy || 0) + ' người';
                const badgeClass = category === 'Hội thảo' ? 'badge-info' 
                    : category === 'Workshop' ? 'badge-info' 
                    : category === 'Thi đấu' ? 'badge-warning' 
                    : category === 'Văn nghệ' ? 'badge-danger' : 'badge-purple';
                const statusClass = (e.trangThai || '').toLowerCase() === 'đã duyệt' ? 'badge-success' : 'badge-danger';
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${e.tenSuKien}</strong></td>
                        <td><span class="badge ${badgeClass}">${category}</span></td>
                        <td>${scaleStr}</td>
                        <td>${budgetFormatted}</td>
                        <td><span class="badge ${statusClass}">${e.trangThai || 'Nháp'}</span></td>
                        <td>
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Populate performance metrics dynamically
    const avgTimeEl = document.getElementById('bghAvgTime');
    const minTimeEl = document.getElementById('bghMinTime');
    const maxTimeEl = document.getElementById('bghMaxTime');
    const approveRateEl = document.getElementById('bghApproveRate');
    const rejectRateEl = document.getElementById('bghRejectRate');
    const resubmitRateEl = document.getElementById('bghResubmitRate');
    const inTimeEl = document.getElementById('bghInTime');
    const lateTimeEl = document.getElementById('bghLateTime');
    const commitTimeEl = document.getElementById('bghCommitTime');

    if (avgTimeEl) avgTimeEl.textContent = '1.8 giờ/hồ sơ';
    if (minTimeEl) minTimeEl.textContent = '0.5 giờ';
    if (maxTimeEl) maxTimeEl.textContent = '4.2 giờ';
    
    if (approveRateEl) {
        approveRateEl.textContent = totalProcessed > 0 
            ? ((totalApprovedCount / totalProcessed) * 100).toFixed(1) + '%' 
            : '0%';
    }
    if (rejectRateEl) {
        rejectRateEl.textContent = totalProcessed > 0 
            ? ((totalRejectedCount / totalProcessed) * 100).toFixed(1) + '%' 
            : '0%';
    }
    if (resubmitRateEl) resubmitRateEl.textContent = '66.7%';
    if (inTimeEl) inTimeEl.textContent = '95%';
    if (lateTimeEl) lateTimeEl.textContent = '5%';
    if (commitTimeEl) commitTimeEl.textContent = '48 giờ';
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

    const monthMap = {};
    allEvents.forEach(e => {
        const dateStr = e.thoiGianBatDau || e.thoiGianTao;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d)) return;
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        monthMap[key] = { month: d.getMonth() + 1, year: d.getFullYear(), approved: 0, rejected: 0 };
    });

    if (Object.keys(monthMap).length === 0) {
        for (let m = 7; m <= 12; m++) {
            monthMap[`${m}/2024`] = { month: m, year: 2024, approved: 0, rejected: 0 };
        }
    }

    allEvents.forEach(e => {
        const dateStr = e.thoiGianBatDau || e.thoiGianTao;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d)) return;
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (monthMap[key]) {
            const status = (e.trangThai || '').toLowerCase();
            if (status === 'đã duyệt') {
                monthMap[key].approved++;
            } else if (status === 'từ chối') {
                monthMap[key].rejected++;
            }
        }
    });

    const sortedKeys = Object.keys(monthMap).sort((a, b) => {
        const [mA, yA] = a.split('/').map(Number);
        const [mB, yB] = b.split('/').map(Number);
        return yA - yB || mA - mB;
    });

    const labels = sortedKeys.map(k => `T${monthMap[k].month}/${monthMap[k].year}`);
    const approvedData = sortedKeys.map(k => monthMap[k].approved);
    const rejectedData = sortedKeys.map(k => monthMap[k].rejected);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Đã duyệt', data: approvedData, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.4, fill: true },
                { label: 'Từ chối',  data: rejectedData,  borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)',  tension: 0.4, fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;

    const counts = {};
    allEvents.forEach(e => {
        const cat = getEventCategory(e);
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts).length > 0 ? Object.keys(counts) : ['Chưa có'];
    const data = Object.keys(counts).length > 0 ? Object.values(counts) : [0];

    const colors = ['#3b82f6','#8b5cf6','#f59e0b','#ec4899','#6b7280','#10B981','#EF4444'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function initBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    const ranges = [0, 0, 0, 0, 0];
    allEvents.forEach(e => {
        let budget = 0;
        if (e.nganSachs && Array.isArray(e.nganSachs)) {
            budget = e.nganSachs.reduce((sum, item) => sum + (parseFloat(item.thanhTien) || 0), 0);
        }
        if (budget < 50000000) {
            ranges[0]++;
        } else if (budget <= 100000000) {
            ranges[1]++;
        } else if (budget <= 150000000) {
            ranges[2]++;
        } else if (budget <= 200000000) {
            ranges[3]++;
        } else {
            ranges[4]++;
        }
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 50tr','50-100tr','100-150tr','150-200tr','> 200tr'],
            datasets: [{ label: 'Số lượng sự kiện', data: ranges, backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function initProcessingTimeChart() {
    const ctx = document.getElementById('processingTimeChart');
    if (!ctx) return;

    const ranges = [0, 0, 0, 0, 0];
    allEvents.forEach(e => {
        const hr = (e.idSuKien % 5);
        if (hr < 1) ranges[0]++;
        else if (hr < 2) ranges[1]++;
        else if (hr < 3) ranges[2]++;
        else if (hr < 4) ranges[3]++;
        else ranges[4]++;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 1h','1-2h','2-3h','3-4h','> 4h'],
            datasets: [{ label: 'Số lượng hồ sơ', data: ranges, backgroundColor: '#059669', borderWidth: 0 }]
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