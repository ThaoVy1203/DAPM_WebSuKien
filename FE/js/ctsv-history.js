// CTSV Approval History JavaScript
const API_BASE = 'http://localhost:5103/api';
let allHistoryItems = [];
let currentFilter = 'all';
let histSearchQuery = '';

document.addEventListener('DOMContentLoaded', async function () {
    loadCtsvHistUserInfo();
    initCtsvHistFilterTabs();
    initCtsvHistSearch();
    await loadHistory();
});

function loadCtsvHistUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        if (nameEl && user.hoTen) nameEl.textContent = user.hoTen;
        if (roleEl) roleEl.textContent = 'Cán bộ phê duyệt cấp 1';
    } catch(e) {}
}

async function loadHistory() {
    showHistLoading();
    try {
        const skRes = await fetch(`${API_BASE}/SuKien`);
        const skData = await skRes.json();
        const dsSuKien = Array.isArray(skData) ? skData : (skData.Data || skData.data || skData.items || []);

        const allHoSo = [];
        await Promise.allSettled(dsSuKien.map(async sk => {
            try {
                const res = await fetch(`${API_BASE}/PheDuyet/su-kien/${sk.idSuKien || sk.id}`);
                if (!res.ok) return;
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
                list.forEach(hs => allHoSo.push({ ...hs, tenSuKien: sk.tenSuKien || 'Không rõ' }));
            } catch {}
        }));

        allHistoryItems = allHoSo.filter(hs => {
            const tt = (hs.trangThai || '').toLowerCase();
            return tt === 'approved' || tt === 'rejected';
        });

        updateHistStats(allHistoryItems);
        renderHistoryList();
        updateHistFilterTabCounts(allHistoryItems);
    } catch(err) {
        console.error(err);
        const el = document.getElementById('historyList');
        if (el) el.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
            <p>Không thể tải dữ liệu.</p>
            <button onclick="loadHistory()" style="margin-top:12px;padding:8px 16px;background:#059669;color:white;border:none;border-radius:6px;cursor:pointer;">Thử lại</button>
        </div>`;
    }
}

let currentHistPage = 1;
const ITEMS_PER_PAGE = 5;

function renderHistoryList() {
    const el = document.getElementById('historyList');
    if (!el) return;

    let filtered = allHistoryItems;
    if (currentFilter !== 'all') filtered = filtered.filter(i => (i.trangThai||'').toLowerCase() === currentFilter);
    if (histSearchQuery) {
        const q = histSearchQuery.toLowerCase();
        filtered = filtered.filter(i =>
            (i.tieuDe||'').toLowerCase().includes(q) ||
            (i.tenSuKien||'').toLowerCase().includes(q) ||
            (i.nguoiGui||'').toLowerCase().includes(q)
        );
    }

    // Dynamic pagination calculation
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Ensure page index is valid
    if (currentHistPage > totalPages) currentHistPage = Math.max(1, totalPages);

    const paginationEl = document.querySelector('.pagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
        } else {
            paginationEl.style.display = 'flex';
            let html = `
                <button type="button" class="page-btn" ${currentHistPage === 1 ? 'disabled' : ''} onclick="changeHistPage(${currentHistPage - 1})" aria-label="Trang trước">
                    <i class="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
            `;
            for (let i = 1; i <= totalPages; i++) {
                html += `
                    <button type="button" class="page-btn ${currentHistPage === i ? 'active' : ''}" onclick="changeHistPage(${i})" aria-label="Trang ${i}">${i}</button>
                `;
            }
            html += `
                <button type="button" class="page-btn" ${currentHistPage === totalPages ? 'disabled' : ''} onclick="changeHistPage(${currentHistPage + 1})" aria-label="Trang sau">
                    <i class="fas fa-chevron-right" aria-hidden="true"></i>
                </button>
            `;
            paginationEl.innerHTML = html;
        }
    }

    if (!filtered.length) {
        el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;">
            <i class="fas fa-history" style="font-size:48px;display:block;margin-bottom:12px;color:#d1d5db;"></i>
            <h3 style="margin:0 0 8px;">Chưa có lịch sử phê duyệt nào.</h3>
            <p style="margin:0;">Dữ liệu sẽ xuất hiện sau khi xử lý hồ sơ.</p>
        </div>`;
        return;
    }

    // Slice items for current page
    const start = (currentHistPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, end);

    el.innerHTML = pageItems.map(item => {
        const id = item.idHoSo || item.id || 0;
        const trangThai = (item.trangThai||'').toLowerCase();
        const isApproved = trangThai === 'approved';
        const tieuDe = item.tieuDe || `Hồ sơ #${id}`;
        const tenSuKien = item.tenSuKien || 'Không rõ';
        const nguoiGui = item.nguoiGui || 'Không rõ';
        const ngayGui = fmtDate(item.ngayGui || item.ngayTao);
        const moTa = item.moTa || '';
        const ghiChu = item.ghiChu || item.lyDoTuChoi || '';
        const badgeClass = isApproved ? 'approved' : 'rejected';
        const badgeText = isApproved ? 'ĐÃ DUYỆT' : 'TỪ CHỐI';
        const commentClass = isApproved ? 'history-comment' : 'history-comment reject-comment';
        const commentIcon = isApproved ? 'fa-comment-dots' : 'fa-exclamation-circle';
        const commentLabel = isApproved ? 'Ý kiến phê duyệt:' : 'Lý do từ chối:';

        return `
        <div class="history-item ${badgeClass}" data-status="${trangThai}">
            <div class="history-header">
                <div class="history-info">
                    <span class="history-badge ${badgeClass}">${badgeText}</span>
                    <span class="history-id">#HS-${id}</span>
                    <span class="history-date"><i class="fas fa-calendar"></i> ${ngayGui}</span>
                </div>
            </div>
            <div class="history-body">
                <h3>${escH(tieuDe)}</h3>
                <div class="history-meta">
                    <div class="meta-item"><i class="fas fa-calendar-alt"></i><span>Sự kiện: <strong>${escH(tenSuKien)}</strong></span></div>
                    <div class="meta-item"><i class="fas fa-user"></i><span>Người gửi: <strong>${escH(nguoiGui)}</strong></span></div>
                </div>
                ${moTa ? `<div class="history-description" style="margin-top:8px;font-size:14px;color:#6b7280;"><p style="margin:0;">${escH(moTa)}</p></div>` : ''}
                ${ghiChu ? `<div class="${commentClass}"><div class="comment-label"><i class="fas ${commentIcon}"></i> ${commentLabel}</div><p>${escH(ghiChu)}</p></div>` : ''}
            </div>
            <div class="history-footer">
                <button class="btn-view-history" onclick="viewHistoryDetail(${id})">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
            </div>
        </div>`;
    }).join('');
}

function updateHistStats(items) {
    const total = items.length;
    const approved = items.filter(h => (h.trangThai||'').toLowerCase() === 'approved').length;
    const rejected = items.filter(h => (h.trangThai||'').toLowerCase() === 'rejected').length;
    const appRate = total > 0 ? ((approved/total)*100).toFixed(1) : 0;
    const rejRate = total > 0 ? ((rejected/total)*100).toFixed(1) : 0;

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
    const avgHoursStr = countHours > 0 ? (sumHours / countHours).toFixed(1) + 'h' : '2.5h';

    document.querySelectorAll('.stat-card').forEach(card => {
        const lbl = card.querySelector('.stat-label')?.textContent?.trim();
        const num = card.querySelector('.stat-number');
        const desc = card.querySelector('.stat-description');
        if (!num) return;
        if (lbl === 'TỔNG SỐ') { num.textContent = total; if (desc) desc.textContent = `Đã xử lý`; }
        if (lbl === 'ĐÃ DUYỆT') { num.textContent = approved; if (desc) desc.textContent = `${appRate}% tỷ lệ duyệt`; }
        if (lbl === 'TỪ CHỐI') { num.textContent = rejected; if (desc) desc.textContent = `${rejRate}% tỷ lệ từ chối`; }
        if (lbl === 'THỜI GIAN TB') {
            num.textContent = avgHoursStr;
            if (desc) desc.textContent = `Xử lý mỗi hồ sơ`;
        }
    });
}

function updateHistFilterTabCounts(items) {
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

function initCtsvHistFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderHistoryList();
        });
    });
}

function initCtsvHistSearch() {
    const input = document.querySelector('.search-bar input');
    if (input) input.addEventListener('input', function() { histSearchQuery = this.value.trim(); renderHistoryList(); });
}

function viewHistoryDetail(id) {
    const item = allHistoryItems.find(i => (i.idHoSo||i.id) == id);
    if (!item) return;
    const isApproved = (item.trangThai||'').toLowerCase() === 'approved';
    alert(
        `Chi tiết hồ sơ #HS-${id}\n` +
        `──────────────────────────\n` +
        `Tiêu đề: ${item.tieuDe||'—'}\n` +
        `Sự kiện: ${item.tenSuKien||'—'}\n` +
        `Người gửi: ${item.nguoiGui||'—'}\n` +
        `Ngày gửi: ${fmtDate(item.ngayGui||item.ngayTao)}\n` +
        `Trạng thái: ${isApproved?'ĐÃ DUYỆT':'TỪ CHỐI'}\n` +
        `${isApproved?'Ghi chú':'Lý do từ chối'}: ${item.moTa||item.ghiChu||'—'}`
    );
}

function applyFilters() { renderHistoryList(); }
function exportHistory() {}

function showHistLoading() {
    const el = document.getElementById('historyList');
    if (el) el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;">
        <i class="fas fa-spinner fa-spin" style="font-size:32px;display:block;margin-bottom:12px;"></i>
        <p>Đang tải dữ liệu...</p>
    </div>`;
}

function fmtDate(d) {
    if (!d) return 'N/A';
    try { const dt=new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); } catch { return d; }
}

function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function changeHistPage(page) {
    currentHistPage = page;
    renderHistoryList();
}

window.changeHistPage = changeHistPage;
window.viewHistoryDetail = viewHistoryDetail;
window.applyFilters = applyFilters;
window.loadHistory = loadHistory;
window.exportHistory = exportHistory;
