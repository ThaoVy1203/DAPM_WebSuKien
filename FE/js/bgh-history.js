// bgh-history.js - Lịch sử phê duyệt cấp BGH

const API_BASE_BGH_HIST = 'http://localhost:5103/api';
let allBghHistoryItems = [];
let currentBghHistFilter = 'all';
let bghHistSearchQuery = '';

document.addEventListener('DOMContentLoaded', async function () {
    loadBghHistUserInfo();
    initBghHistFilterTabs();
    initBghHistSearch();
    await loadBghHistory();
});

function loadBghHistUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar');
        if (nameEl && user.hoTen) nameEl.textContent = user.hoTen;
        if (roleEl) roleEl.textContent = 'Cán bộ phê duyệt cấp 2';
        if (avatarEl && user.hoTen) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=dc2626&color=fff`;
    } catch(e) {}
}

async function loadBghHistory() {
    showBghHistLoading();
    try {
        const skRes = await fetch(`${API_BASE_BGH_HIST}/SuKien`);
        const skData = await skRes.json();
        const dsSuKien = Array.isArray(skData) ? skData : (skData.Data || skData.data || skData.items || []);

        const allHoSo = [];
        await Promise.allSettled(dsSuKien.map(async sk => {
            try {
                const res = await fetch(`${API_BASE_BGH_HIST}/PheDuyet/su-kien/${sk.idSuKien || sk.id}`);
                if (!res.ok) return;
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
                list.forEach(hs => allHoSo.push({ ...hs, tenSuKien: sk.tenSuKien || 'Không rõ' }));
            } catch {}
        }));

        // Lịch sử BGH: các hồ sơ đã được xử lý (approved hoặc rejected)
        allBghHistoryItems = allHoSo.filter(hs => {
            const ts = (hs.trangThai || '').toLowerCase();
            return ts === 'approved' || ts === 'rejected';
        });

        updateBghHistStats(allBghHistoryItems);
        renderBghHistoryList();
        updateBghHistFilterTabCounts(allBghHistoryItems);
    } catch(err) {
        console.error(err);
        const el = document.getElementById('bghHistoryList');
        if (el) el.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;"><i class="fas fa-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i><p>Không thể tải dữ liệu. <button onclick="loadBghHistory()" style="color:#dc2626;background:none;border:none;cursor:pointer;text-decoration:underline;">Thử lại</button></p></div>`;
    }
}

let currentBghHistPage = 1;
const ITEMS_PER_PAGE = 5;

function renderBghHistoryList() {
    const el = document.getElementById('bghHistoryList');
    if (!el) return;

    let filtered = allBghHistoryItems;

    // Lọc theo tab
    if (currentBghHistFilter !== 'all') {
        filtered = filtered.filter(i => (i.trangThai || '').toLowerCase() === currentBghHistFilter);
    }

    // Tìm kiếm
    if (bghHistSearchQuery) {
        const q = bghHistSearchQuery.toLowerCase();
        filtered = filtered.filter(i =>
            (i.tieuDe || '').toLowerCase().includes(q) ||
            (i.tenSuKien || '').toLowerCase().includes(q) ||
            (i.nguoiGui || '').toLowerCase().includes(q)
        );
    }

    // Dynamic pagination calculation
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Ensure page index is valid
    if (currentBghHistPage > totalPages) currentBghHistPage = Math.max(1, totalPages);

    const paginationEl = document.querySelector('.pagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
        } else {
            paginationEl.style.display = 'flex';
            let html = `
                <button type="button" class="page-btn" ${currentBghHistPage === 1 ? 'disabled' : ''} onclick="changeBghHistPage(${currentBghHistPage - 1})" aria-label="Trang trước">
                    <i class="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
            `;
            for (let i = 1; i <= totalPages; i++) {
                html += `
                    <button type="button" class="page-btn ${currentBghHistPage === i ? 'active' : ''}" onclick="changeBghHistPage(${i})" aria-label="Trang ${i}">${i}</button>
                `;
            }
            html += `
                <button type="button" class="page-btn" ${currentBghHistPage === totalPages ? 'disabled' : ''} onclick="changeBghHistPage(${currentBghHistPage + 1})" aria-label="Trang sau">
                    <i class="fas fa-chevron-right" aria-hidden="true"></i>
                </button>
            `;
            paginationEl.innerHTML = html;
        }
    }

    if (!filtered.length) {
        el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;">
            <i class="fas fa-history" style="font-size:48px;display:block;margin-bottom:12px;color:#d1d5db;"></i>
            <h3 style="margin:0 0 8px;">Chưa có lịch sử phê duyệt cấp cao nào.</h3>
            <p style="margin:0;">Dữ liệu sẽ xuất hiện sau khi BGH xử lý hồ sơ.</p>
        </div>`;
        return;
    }

    // Slice items for current page
    const start = (currentBghHistPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, end);

    el.innerHTML = pageItems.map(item => buildBghHistoryHTML(item)).join('');
}

function buildBghHistoryHTML(item) {
    const id = item.idHoSo || item.id || 0;
    const tieuDe = item.tieuDe || `Hồ sơ #${id}`;
    const tenSuKien = item.tenSuKien || 'Không rõ';
    const nguoiGui = item.nguoiGui || 'Không rõ';
    const nguoiDuyet = item.nguoiDuyet || 'BGH';
    const trangThai = (item.trangThai || '').toLowerCase();
    const isApproved = trangThai === 'approved';
    const ngayXuLy = formatBghHistDate(item.ngayDuyet || item.updatedAt || item.ngayTao);
    const ngayGui = formatBghHistDate(item.ngayGui || item.ngayTao);
    const moTa = item.moTa || '';
    const ghiChu = item.ghiChu || item.lyDoTuChoi || '';

    const badgeClass = isApproved ? 'approved' : 'rejected';
    const badgeText = isApproved ? 'ĐÃ DUYỆT' : 'TỪ CHỐI';
    const approverIcon = isApproved ? 'fa-user-check' : 'fa-user-times';
    const actionDateLabel = isApproved ? 'Duyệt' : 'Từ chối';
    const commentIcon = isApproved ? 'fa-comment-dots' : 'fa-exclamation-circle';
    const commentLabel = isApproved ? 'Ý kiến phê duyệt BGH:' : 'Lý do từ chối:';
    const commentClass = isApproved ? 'history-comment' : 'history-comment reject-comment';

    return `
        <div class="history-item ${badgeClass}" data-status="${trangThai}">
            <div class="history-header">
                <div class="history-info">
                    <span class="history-badge ${badgeClass}">${badgeText}</span>
                    <span class="history-id">#HS-${id}</span>
                    <span class="history-date">
                        <i class="fas fa-calendar"></i>
                        ${actionDateLabel}: ${ngayXuLy}
                    </span>
                </div>
                <div class="history-approver">
                    <i class="fas ${approverIcon}"></i>
                    <span>Bởi: <strong>${escBghHist(nguoiDuyet)}</strong></span>
                </div>
            </div>
            <div class="history-body">
                <h3>${escBghHist(tieuDe)}</h3>
                <div class="history-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Sự kiện: <strong>${escBghHist(tenSuKien)}</strong></span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>BTC: <strong>${escBghHist(nguoiGui)}</strong></span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-paper-plane"></i>
                        <span>Ngày gửi: <strong>${ngayGui}</strong></span>
                    </div>
                </div>
                ${moTa ? `<div class="history-description" style="margin-top:8px;font-size:14px;color:#6b7280;"><p style="margin:0;">${escBghHist(moTa)}</p></div>` : ''}
                ${ghiChu ? `
                <div class="${commentClass}">
                    <div class="comment-label">
                        <i class="fas ${commentIcon}"></i>
                        ${commentLabel}
                    </div>
                    <p>${escBghHist(ghiChu)}</p>
                </div>` : ''}
            </div>
            <div class="history-footer">
                <button class="btn-view-history" onclick="viewHistoryDetail(${id})">
                    <i class="fas fa-eye"></i>
                    Xem chi tiết
                </button>
                <div class="history-timeline">
                    <span class="timeline-item">
                        <i class="fas fa-paper-plane"></i>
                        BTC gửi: ${ngayGui}
                    </span>
                    <span class="timeline-arrow">→</span>
                    <span class="timeline-item">
                        <i class="fas ${isApproved ? 'fa-check-double' : 'fa-times'}"></i>
                        BGH: ${ngayXuLy}
                    </span>
                </div>
            </div>
        </div>`;
}

function updateBghHistStats(items) {
    const total = items.length;
    const approved = items.filter(h => (h.trangThai||'').toLowerCase() === 'approved').length;
    const rejected = items.filter(h => (h.trangThai||'').toLowerCase() === 'rejected').length;

    let sumHours = 0;
    let countHours = 0;
    items.forEach(h => {
        const start = h.ngayGui || h.ngayTao || h.createdAt;
        const end = h.ngayDuyet || h.updatedAt;
        if (start && end) {
            const diffMs = new Date(end) - new Date(start);
            if (diffMs > 0) {
                sumHours += (diffMs / (1000 * 60 * 60));
                countHours++;
            }
        }
    });
    const avgHoursStr = countHours > 0 ? (sumHours / countHours).toFixed(1) + 'h' : '1.8h';

    document.querySelectorAll('.stat-card').forEach(card => {
        const lbl = card.querySelector('.stat-label')?.textContent?.trim();
        const num = card.querySelector('.stat-number');
        const desc = card.querySelector('.stat-description');
        if (!num) return;
        if (lbl === 'TỔNG SỐ') { num.textContent = total; if (desc) desc.textContent = `Đã xử lý`; }
        if (lbl === 'ĐÃ DUYỆT') {
            num.textContent = approved;
            const rate = total > 0 ? ((approved/total)*100).toFixed(1) : 0;
            if (desc) desc.textContent = `${rate}% tỷ lệ duyệt`;
        }
        if (lbl === 'TỪ CHỐI') {
            num.textContent = rejected;
            const rate = total > 0 ? ((rejected/total)*100).toFixed(1) : 0;
            if (desc) desc.textContent = `${rate}% tỷ lệ từ chối`;
        }
        if (lbl === 'THỜI GIAN TB') {
            num.textContent = avgHoursStr;
            if (desc) desc.textContent = `Xử lý mỗi hồ sơ`;
        }
    });
}

function updateBghHistFilterTabCounts(items) {
    const total = items.length;
    const approved = items.filter(i => (i.trangThai||'').toLowerCase() === 'approved').length;
    const rejected = items.filter(i => (i.trangThai||'').toLowerCase() === 'rejected').length;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const f = btn.getAttribute('data-filter');
        if (f === 'all') btn.textContent = `Tất cả (${total})`;
        if (f === 'approved') btn.textContent = `Đã duyệt (${approved})`;
        if (f === 'rejected') btn.textContent = `Từ chối (${rejected})`;
    });
}

function initBghHistFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentBghHistFilter = this.getAttribute('data-filter');
            renderBghHistoryList();
        });
    });
}

function initBghHistSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            bghHistSearchQuery = this.value.trim();
            renderBghHistoryList();
        });
    }
}

function viewHistoryDetail(id) {
    const item = allBghHistoryItems.find(i => (i.idHoSo||i.id) == id);
    if (!item) { alert(`Không tìm thấy hồ sơ #${id}`); return; }
    const trangThai = (item.trangThai || '').toLowerCase();
    const isApproved = trangThai === 'approved';
    const lines = [
        `📋 Hồ sơ #HS-${id}`,
        `📌 Tiêu đề: ${item.tieuDe || 'Không rõ'}`,
        `📅 Sự kiện: ${item.tenSuKien || 'Không rõ'}`,
        `👤 Ban Tổ Chức: ${item.nguoiGui || 'Không rõ'}`,
        `🗓️ Ngày gửi: ${formatBghHistDate(item.ngayGui || item.ngayTao)}`,
        `✅ Trạng thái: ${isApproved ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}`,
        `👨‍💼 Người xử lý: ${item.nguoiDuyet || 'BGH'}`,
        `📝 ${isApproved ? 'Ghi chú' : 'Lý do từ chối'}: ${item.ghiChu || item.lyDoTuChoi || 'Không có'}`,
        `📄 Mô tả: ${item.moTa || 'Không có mô tả'}`,
    ];
    alert(lines.join('\n'));
}

function applyFilters() {
    renderBghHistoryList();
}

// Helpers
function showBghHistLoading() {
    const el = document.getElementById('bghHistoryList');
    if (el) el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;"><i class="fas fa-spinner fa-spin" style="font-size:32px;display:block;margin-bottom:12px;"></i><p>Đang tải lịch sử phê duyệt...</p></div>`;
}

function formatBghHistDate(d) {
    if (!d) return 'N/A';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
}

function escBghHist(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function changeBghHistPage(page) {
    currentBghHistPage = page;
    renderBghHistoryList();
}

window.changeBghHistPage = changeBghHistPage;
window.viewHistoryDetail = viewHistoryDetail;
window.applyFilters = applyFilters;
window.loadBghHistory = loadBghHistory;
