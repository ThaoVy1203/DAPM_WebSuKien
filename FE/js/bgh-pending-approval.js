// bgh-pending-approval.js
const API_BASE = 'http://localhost:5103/api';
let allBghPendingItems = [];
let currentBghFilter = 'all';
let currentBghApprovalId = null;

document.addEventListener('DOMContentLoaded', async function () {
    loadBghUserInfo();
    initBghFilterTabs();
    await loadBghPendingApprovals();
    setupBghBulkModal();
});

function loadBghUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('userData') || '{}');
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar');
        if (nameEl && user.hoTen) nameEl.textContent = user.hoTen;
        if (roleEl) roleEl.textContent = 'Cán bộ phê duyệt cấp 2';
        if (avatarEl && user.hoTen) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=dc2626&color=fff`;
    } catch(e) {}
}

async function loadBghPendingApprovals() {
    showBghLoading();
    try {
        const skRes = await fetch(`${API_BASE}/SuKien`);
        const skData = await skRes.json();
        const dsSuKien = Array.isArray(skData) ? skData : (skData.data || skData.items || []);

        const allHoSo = [];
        await Promise.allSettled(dsSuKien.map(async sk => {
            try {
                const res = await fetch(`${API_BASE}/PheDuyet/su-kien/${sk.idSuKien || sk.id}`);
                if (!res.ok) return;
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.data || data.items || []);
                list.forEach(hs => allHoSo.push({ ...hs, tenSuKien: sk.tenSuKien || 'Không rõ' }));
            } catch {}
        }));

        // BGH chỉ xem hồ sơ đã qua CTSV (approved ở cấp 1) — tức là "approved" từ CTSV
        // Vì API dùng chung PheDuyet, lấy tất cả approved để BGH duyệt tiếp
        // Thực tế: lấy tất cả hồ sơ có trangThai = "pending" (chờ BGH)
        allBghPendingItems = allHoSo.filter(hs => (hs.trangThai || '').toLowerCase() === 'pending');

        updateBghStats(allHoSo);
        renderBghPendingList(allBghPendingItems);
        updateBghFilterTabCounts(allBghPendingItems);
    } catch(err) {
        console.error(err);
        const el = document.getElementById('bghPendingList');
        if (el) el.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;"><i class="fas fa-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i><p>Không thể tải dữ liệu. <button onclick="loadBghPendingApprovals()" style="color:#dc2626;background:none;border:none;cursor:pointer;text-decoration:underline;">Thử lại</button></p></div>`;
    }
}

function renderBghPendingList(items) {
    const el = document.getElementById('bghPendingList');
    if (!el) return;
    const filtered = currentBghFilter === 'all' ? items : items.filter(i => (i.priority || 'normal') === currentBghFilter);
    if (!filtered.length) {
        el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;"><i class="fas fa-inbox" style="font-size:48px;display:block;margin-bottom:12px;color:#d1d5db;"></i><h3>Không có hồ sơ chờ duyệt cấp cao</h3><p>Tất cả hồ sơ đã được xử lý.</p></div>`;
        return;
    }
    el.innerHTML = filtered.map(item => buildBghPendingHTML(item)).join('');
}

function buildBghPendingHTML(item) {
    const id = item.idHoSo || item.id || 0;
    const tieuDe = item.tieuDe || `Hồ sơ #${id}`;
    const tenSuKien = item.tenSuKien || 'Không rõ';
    const nguoiGui = item.nguoiGui || 'Trưởng BTC';
    const ngayGui = formatBghDate(item.ngayGui || item.ngayTao);
    const moTa = item.moTa || '';
    return `
        <div class="approval-item normal" data-id="${id}" data-priority="normal">
            <div class="approval-header">
                <div class="approval-info">
                    <span class="approval-badge normal">BÌNH THƯỜNG</span>
                    <span class="approval-badge approved" style="background:#059669;">✓ ĐÃ QUA CTSV</span>
                    <span class="approval-id">#HS-${id}</span>
                    <span class="approval-date"><i class="fas fa-calendar"></i> Gửi: ${ngayGui}</span>
                </div>
                <div class="approval-deadline"><i class="fas fa-clock"></i><span class="deadline-text">Đang chờ xử lý</span></div>
            </div>
            <div class="approval-body">
                <h3>${escBgh(tieuDe)}</h3>
                <div class="approval-meta">
                    <div class="meta-item"><i class="fas fa-calendar-alt"></i><span>Sự kiện: <strong>${escBgh(tenSuKien)}</strong></span></div>
                    <div class="meta-item"><i class="fas fa-user"></i><span>BTC: <strong>${escBgh(nguoiGui)}</strong></span></div>
                </div>
                ${moTa ? `<div class="approval-description"><p>${escBgh(moTa)}</p></div>` : ''}
                <div class="approval-comment" style="background:#ecfdf5;border-left:4px solid #059669;padding:12px;margin-top:12px;border-radius:6px;">
                    <div class="comment-label" style="color:#059669;font-weight:600;margin-bottom:4px;"><i class="fas fa-check-circle"></i> Ý kiến CTSV:</div>
                    <p style="margin:0;color:#065f46;">Hồ sơ đã được CTSV phê duyệt, trình BGH xét duyệt cấp cao.</p>
                </div>
            </div>
            <div class="approval-footer">
                <button class="btn-view" onclick="viewBghDetail(${id})"><i class="fas fa-eye"></i> Xem chi tiết</button>
                <button class="btn-reject" onclick="openBghRejectModal(${id})"><i class="fas fa-times"></i> Từ chối</button>
                <button class="btn-approve" onclick="openBghApproveModal(${id})"><i class="fas fa-check"></i> Phê duyệt cuối</button>
            </div>
        </div>`;
}

function updateBghStats(all) {
    const pending = all.filter(h => (h.trangThai||'').toLowerCase() === 'pending').length;
    const approved = all.filter(h => (h.trangThai||'').toLowerCase() === 'approved').length;
    const rejected = all.filter(h => (h.trangThai||'').toLowerCase() === 'rejected').length;
    document.querySelectorAll('.stat-card').forEach(card => {
        const lbl = card.querySelector('.stat-label')?.textContent?.trim();
        const num = card.querySelector('.stat-number');
        if (!num) return;
        if (lbl === 'CHỜ DUYỆT') num.textContent = pending;
        if (lbl === 'ƯU TIÊN') num.textContent = 0;
        if (lbl === 'ĐÃ DUYỆT') num.textContent = approved;
        if (lbl === 'TỪ CHỐI') num.textContent = rejected;
    });
}

function updateBghFilterTabCounts(items) {
    const total = items.length;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const f = btn.getAttribute('data-filter');
        if (f === 'all') btn.textContent = `Tất cả (${total})`;
        if (f === 'urgent') btn.textContent = `Ưu tiên (0)`;
        if (f === 'normal') btn.textContent = `Bình thường (${total})`;
    });
}

function initBghFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentBghFilter = this.getAttribute('data-filter');
            renderBghPendingList(allBghPendingItems);
        });
    });
}

// Phê duyệt
function openBghApproveModal(id) {
    currentBghApprovalId = id;
    const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == id);
    const modal = document.getElementById('approveModal');
    if (modal) {
        const nameEl = document.getElementById('approveEventName');
        if (nameEl) nameEl.textContent = item?.tieuDe || `Hồ sơ #${id}`;
        const comment = document.getElementById('approveComment');
        if (comment) comment.value = '';
        modal.style.display = 'flex'; modal.classList.add('active');
    }
}
function closeApproveModal() {
    const m = document.getElementById('approveModal');
    if (m) { m.style.display='none'; m.classList.remove('active'); }
    currentBghApprovalId = null;
}
async function confirmApprove() {
    if (!currentBghApprovalId) return;
    const comment = document.getElementById('approveComment')?.value || '';
    const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == currentBghApprovalId);

    const idSuKien = item?.eventId || item?.EventId || item?.idSuKien || item?.IdSuKien;
    if (!idSuKien) { showBghToast('Không tìm thấy mã sự kiện.', 'error'); return; }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${idSuKien}/duyet`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CapDuyet: 'Cấp 2 - BGH',
                KetQua: 'Đồng ý',
                GhiChu: comment || 'Phê duyệt cấp BGH',
                GuiThongBao: true
            })
        });
        if (!res.ok) throw new Error();
        closeApproveModal();
        showBghToast('Đã phê duyệt cuối! Trạng thái sự kiện đã cập nhật.', 'success');
        await loadBghPendingApprovals();
    } catch { showBghToast('Phê duyệt thất bại.', 'error'); }
}

// Từ chối
function openBghRejectModal(id) {
    currentBghApprovalId = id;
    const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == id);
    const modal = document.getElementById('rejectModal');
    if (modal) {
        const nameEl = document.getElementById('rejectEventName');
        if (nameEl) nameEl.textContent = item?.tieuDe || `Hồ sơ #${id}`;
        const reason = document.getElementById('rejectReason');
        if (reason) reason.value = '';
        modal.style.display = 'flex'; modal.classList.add('active');
    }
}
function closeRejectModal() {
    const m = document.getElementById('rejectModal');
    if (m) { m.style.display='none'; m.classList.remove('active'); }
    currentBghApprovalId = null;
}
async function confirmReject() {
    if (!currentBghApprovalId) return;
    const reason = document.getElementById('rejectReason')?.value?.trim() || '';
    if (!reason) { showBghToast('Vui lòng nhập lý do từ chối.', 'warning'); return; }
    const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == currentBghApprovalId);

    const idSuKien = item?.eventId || item?.EventId || item?.idSuKien || item?.IdSuKien;
    if (!idSuKien) { showBghToast('Không tìm thấy mã sự kiện.', 'error'); return; }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${idSuKien}/duyet`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CapDuyet: 'Cấp 2 - BGH',
                KetQua: 'Từ chối',
                GhiChu: reason,
                GuiThongBao: true
            })
        });
        if (!res.ok) throw new Error();
        closeRejectModal();
        showBghToast('Đã từ chối hồ sơ. Trạng thái sự kiện đã cập nhật.', 'info');
        await loadBghPendingApprovals();
    } catch { showBghToast('Từ chối thất bại.', 'error'); }
}

// Xem chi tiết
function viewBghDetail(id) {
    const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == id);
    if (!item) return;
    const modal = document.getElementById('viewDetailModal');
    if (modal) {
        const el = s => document.getElementById(s);
        if (el('detailEventName')) el('detailEventName').textContent = item.tieuDe || `Hồ sơ #${id}`;
        if (el('detailId')) el('detailId').textContent = `#HS-${id}`;
        if (el('detailSender')) el('detailSender').textContent = item.nguoiGui || 'Không rõ';
        if (el('detailSubmitDate')) el('detailSubmitDate').textContent = formatBghDate(item.ngayGui || item.ngayTao);
        if (el('detailDescription')) el('detailDescription').innerHTML = `<p>${escBgh(item.moTa || 'Không có mô tả.')}</p>`;
        modal.style.display = 'flex'; modal.classList.add('active');
    }
}
function closeViewDetailModal() {
    const m = document.getElementById('viewDetailModal');
    if (m) { m.style.display='none'; m.classList.remove('active'); }
}
function approveFromDetail() {
    const id = document.getElementById('detailId')?.textContent?.replace('#HS-','');
    closeViewDetailModal();
    if (id) openBghApproveModal(parseInt(id));
}
function rejectFromDetail() {
    const id = document.getElementById('detailId')?.textContent?.replace('#HS-','');
    closeViewDetailModal();
    if (id) openBghRejectModal(parseInt(id));
}

// Duyệt hàng loạt
function setupBghBulkModal() {
    const modal = document.getElementById('bghBulkModal');
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) closeBghBulkModal(); });
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBghBulkModal(); });
}

function openBulkApprovalModal() {
    if (!allBghPendingItems.length) { showBghToast('Không có hồ sơ nào chờ duyệt.','info'); return; }
    const modal = document.getElementById('bghBulkModal');
    if (!modal) return;
    document.getElementById('bghBulkComment').value = '';
    document.getElementById('bghBulkSelectAll').checked = false;
    document.getElementById('bghBulkSelectedCount').textContent = 'Đã chọn: 0';
    document.getElementById('bghBulkTotalCount').textContent = allBghPendingItems.length;
    const list = document.getElementById('bghBulkItemList');
    list.innerHTML = allBghPendingItems.map(item => {
        const id = item.idHoSo || item.id || 0;
        const tieuDe = item.tieuDe || `Hồ sơ #${id}`;
        const tenSuKien = item.tenSuKien || 'Không rõ';
        return `
            <label style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;cursor:pointer;"
                   onmouseover="this.style.borderColor='#dc2626'" onmouseout="this.style.borderColor='#fecaca'">
                <input type="checkbox" class="bgh-bulk-check" value="${id}" onchange="updateBghBulkCount()" style="width:16px;height:16px;accent-color:#dc2626;margin-top:2px;">
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:4px;">${escBgh(tieuDe)}</div>
                    <div style="font-size:12px;color:#6b7280;"><i class="fas fa-calendar-alt" style="margin-right:4px;color:#dc2626;"></i>${escBgh(tenSuKien)}</div>
                </div>
                <span style="padding:3px 10px;background:#fef2f2;color:#dc2626;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap;">CHỜ DUYỆT</span>
            </label>`;
    }).join('');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBghBulkModal() {
    const m = document.getElementById('bghBulkModal');
    if (m) { m.style.display='none'; document.body.style.overflow='auto'; }
}

function toggleBghSelectAll(cb) {
    document.querySelectorAll('.bgh-bulk-check').forEach(c => c.checked = cb.checked);
    updateBghBulkCount();
}

function updateBghBulkCount() {
    const checked = document.querySelectorAll('.bgh-bulk-check:checked').length;
    const total = document.querySelectorAll('.bgh-bulk-check').length;
    document.getElementById('bghBulkSelectedCount').textContent = `Đã chọn: ${checked}`;
    const sa = document.getElementById('bghBulkSelectAll');
    if (sa) { sa.checked = checked === total && total > 0; sa.indeterminate = checked > 0 && checked < total; }
}

async function confirmBghBulkApproval() {
    const ids = Array.from(document.querySelectorAll('.bgh-bulk-check:checked')).map(c => parseInt(c.value));
    if (!ids.length) { showBghToast('Vui lòng chọn ít nhất một hồ sơ.','warning'); return; }
    const comment = document.getElementById('bghBulkComment')?.value?.trim() || '';
    const btn = document.getElementById('btnBghBulkConfirm');
    btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý ${ids.length} hồ sơ...`;
    let ok = 0, fail = 0;
    await Promise.allSettled(ids.map(async id => {
        try {
            const item = allBghPendingItems.find(i => (i.idHoSo||i.id) == id);
            const res = await fetch(`${API_BASE}/PheDuyet/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...(item||{}), trangThai: 'approved', ghiChu: comment || 'Phê duyệt hàng loạt cấp BGH' })
            });
            if (res.ok) ok++; else fail++;
        } catch { fail++; }
    }));
    btn.disabled = false; btn.innerHTML = `<i class="fas fa-check-double"></i> Phê duyệt tất cả đã chọn`;
    closeBghBulkModal();
    if (ok > 0 && !fail) showBghToast(`✅ Đã phê duyệt ${ok} hồ sơ thành công!`, 'success');
    else if (ok > 0) showBghToast(`Phê duyệt ${ok} thành công, ${fail} thất bại.`, 'warning');
    else showBghToast('Phê duyệt thất bại.', 'error');
    await loadBghPendingApprovals();
}

function applyFilters() { renderBghPendingList(allBghPendingItems); }
function exportPendingList() { showBghToast('Chức năng đang phát triển.','info'); }

// Helpers
function showBghLoading() {
    const el = document.getElementById('bghPendingList');
    if (el) el.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;"><i class="fas fa-spinner fa-spin" style="font-size:32px;display:block;margin-bottom:12px;"></i><p>Đang tải dữ liệu...</p></div>`;
}
function showBghToast(msg, type='info') {
    const colors = {success:'#059669',error:'#ef4444',warning:'#f59e0b',info:'#3b82f6'};
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${colors[type]||colors.info};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:320px;`;
    t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3500);
}
function formatBghDate(d) {
    if (!d) return 'N/A';
    try { const dt=new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); } catch { return d; }
}
function escBgh(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Export globals
window.openBulkApprovalModal = openBulkApprovalModal;
window.closeBghBulkModal = closeBghBulkModal;
window.toggleBghSelectAll = toggleBghSelectAll;
window.updateBghBulkCount = updateBghBulkCount;
window.confirmBghBulkApproval = confirmBghBulkApproval;
window.closeApproveModal = closeApproveModal;
window.confirmApprove = confirmApprove;
window.closeRejectModal = closeRejectModal;
window.confirmReject = confirmReject;
window.viewBghDetail = viewBghDetail;
window.closeViewDetailModal = closeViewDetailModal;
window.approveFromDetail = approveFromDetail;
window.rejectFromDetail = rejectFromDetail;
window.applyFilters = applyFilters;
window.exportPendingList = exportPendingList;
