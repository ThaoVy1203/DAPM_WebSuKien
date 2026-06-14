// CTSV Pending Approval JavaScript
// Cán bộ phê duyệt cấp 1 - Quản lý hồ sơ chờ duyệt

const API_BASE = 'http://localhost:5103/api';

let allPendingItems = [];
let currentFilter = 'all';
let currentApprovalId = null;

// ==================== KHỞI TẠO ====================

document.addEventListener('DOMContentLoaded', async function () {
    loadUserInfo();
    initializeFilterTabs();
    initializeSearch();
    await loadPendingApprovals();
});

// ==================== USER INFO ====================

function loadUserInfo() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            const nameEl = document.querySelector('.user-name');
            const roleEl = document.querySelector('.user-role');
            const avatarEl = document.querySelector('.user-avatar');
            if (nameEl && user.hoTen) nameEl.textContent = user.hoTen;
            if (roleEl && user.vaiTro) roleEl.textContent = user.vaiTro;
            if (avatarEl && user.hoTen) {
                avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=059669&color=fff`;
                avatarEl.alt = `Avatar ${user.hoTen}`;
            }
        }
    } catch (e) {
        console.warn('Không thể tải thông tin người dùng:', e);
    }
}

// ==================== LOAD DATA ====================

async function loadPendingApprovals() {
    try {
        showLoading();

        // Bước 1: Lấy tất cả sự kiện
        const suKienRes = await fetch(`${API_BASE}/SuKien`);
        if (!suKienRes.ok) throw new Error('Không thể tải danh sách sự kiện');
        const suKienData = await suKienRes.json();
        const dsSuKien = Array.isArray(suKienData) ? suKienData : (suKienData.data || suKienData.items || []);

        // Bước 2: Với mỗi sự kiện, lấy danh sách hồ sơ phê duyệt
        const allHoSo = [];
        await Promise.allSettled(dsSuKien.map(async (sk) => {
            try {
                const res = await fetch(`${API_BASE}/PheDuyet/su-kien/${sk.idSuKien || sk.id}`);
                if (!res.ok) return;
                const data = await res.json();
                const hoSoList = Array.isArray(data) ? data : (data.data || data.items || []);
                hoSoList.forEach(hs => {
                    allHoSo.push({ ...hs, tenSuKien: sk.tenSuKien || sk.ten || 'Không rõ' });
                });
            } catch (err) {
                // Sự kiện không có hồ sơ hoặc lỗi - bỏ qua
            }
        }));

        // Bước 3: Lọc chỉ lấy hồ sơ pending
        allPendingItems = allHoSo.filter(hs =>
            (hs.trangThai || '').toLowerCase() === 'pending'
        );

        // Render
        updateStats(allHoSo);
        renderPendingList(allPendingItems);
        updateFilterTabCounts(allPendingItems);

    } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        showError('Không thể tải danh sách hồ sơ. Vui lòng thử lại.');
    }
}

// ==================== RENDER DANH SÁCH ====================

function renderPendingList(items) {
    const container = document.getElementById('pendingList');
    if (!container) return;

    // Áp dụng bộ lọc hiện tại
    const filtered = filterItems(items, currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:48px 24px; color:#6b7280;">
                <i class="fas fa-inbox" style="font-size:48px; margin-bottom:16px; display:block; color:#d1d5db;"></i>
                <h3 style="margin:0 0 8px; color:#374151;">Không có hồ sơ chờ duyệt</h3>
                <p style="margin:0;">Tất cả hồ sơ đã được xử lý hoặc chưa có hồ sơ mới.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(item => buildApprovalItemHTML(item)).join('');
}

function buildApprovalItemHTML(item) {
    const id = item.idHoSo || item.id || item.idPheDuyet || 0;
    const tieuDe = item.tieuDe || item.tenHoSo || `Hồ sơ #${id}`;
    const tenSuKien = item.tenSuKien || 'Không rõ';
    const nguoiGui = item.nguoiGui || item.tenNguoiGui || item.hoTenNguoiGui || 'Không rõ';
    const ngayGui = formatDate(item.ngayGui || item.ngayTao || item.createdAt);
    const moTa = item.moTa || item.ghiChu || item.noiDung || '';

    return `
        <div class="approval-item normal" data-id="${id}" data-priority="normal">
            <div class="approval-header">
                <div class="approval-info">
                    <span class="approval-badge normal">CHỜ DUYỆT</span>
                    <span class="approval-id">#HS-${id}</span>
                    <span class="approval-date">
                        <i class="fas fa-calendar" aria-hidden="true"></i>
                        Gửi: ${ngayGui}
                    </span>
                </div>
                <div class="approval-deadline">
                    <i class="fas fa-clock" aria-hidden="true"></i>
                    <span class="deadline-text">Đang chờ xử lý</span>
                </div>
            </div>
            <div class="approval-body">
                <h3>${escapeHTML(tieuDe)}</h3>
                <div class="approval-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                        <span>Sự kiện: <strong>${escapeHTML(tenSuKien)}</strong></span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user" aria-hidden="true"></i>
                        <span>Người gửi: <strong>${escapeHTML(nguoiGui)}</strong></span>
                    </div>
                </div>
                ${moTa ? `<div class="approval-description"><p>${escapeHTML(moTa)}</p></div>` : ''}
                <div style="margin-top:8px;">
                    <span class="approval-badge normal" style="font-size:11px; padding:3px 10px;">BÌNH THƯỜNG</span>
                </div>
            </div>
            <div class="approval-footer">
                <button type="button" class="btn-view" onclick="viewApprovalDetail(${id})" aria-label="Xem chi tiết hồ sơ">
                    <i class="fas fa-eye" aria-hidden="true"></i>
                    Xem chi tiết
                </button>
                <button type="button" class="btn-reject" onclick="openRejectModal(${id})" aria-label="Từ chối hồ sơ">
                    <i class="fas fa-times" aria-hidden="true"></i>
                    Từ chối
                </button>
                <button type="button" class="btn-approve" onclick="openApproveModal(${id})" aria-label="Phê duyệt hồ sơ">
                    <i class="fas fa-check" aria-hidden="true"></i>
                    Phê duyệt
                </button>
            </div>
        </div>`;
}

// ==================== STATS ====================

function updateStats(allHoSo) {
    const pending = allHoSo.filter(hs => (hs.trangThai || '').toLowerCase() === 'pending').length;
    const approved = allHoSo.filter(hs => (hs.trangThai || '').toLowerCase() === 'approved').length;
    const rejected = allHoSo.filter(hs => (hs.trangThai || '').toLowerCase() === 'rejected').length;

    // Cập nhật stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const label = card.querySelector('.stat-label')?.textContent?.trim();
        const numEl = card.querySelector('.stat-number');
        if (!numEl) return;
        if (label === 'CHỜ DUYỆT') numEl.textContent = pending;
        if (label === 'KHẨN CẤP') numEl.textContent = 0;
        if (label === 'ĐÃ DUYỆT') numEl.textContent = approved;
        if (label === 'TỪ CHỐI') numEl.textContent = rejected;
    });
}

function updateFilterTabCounts(pendingItems) {
    const total = pendingItems.length;
    // Đơn giản: tất cả pending đều là "bình thường", urgent=0, low=0
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        if (filter === 'all') btn.textContent = `Tất cả (${total})`;
        if (filter === 'urgent') btn.textContent = `Khẩn cấp (0)`;
        if (filter === 'normal') btn.textContent = `Bình thường (${total})`;
        if (filter === 'low') btn.textContent = `Không khẩn (0)`;
    });
}

// ==================== FILTER ====================

function filterItems(items, filter) {
    if (filter === 'all') return items;
    if (filter === 'urgent') return []; // Không có urgent từ API cơ bản
    if (filter === 'normal') return items;
    if (filter === 'low') return [];
    return items;
}

function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            currentFilter = this.getAttribute('data-filter');
            renderPendingList(allPendingItems);
        });
    });
}

function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            const query = this.value.toLowerCase();
            const filtered = allPendingItems.filter(item => {
                const tieuDe = (item.tieuDe || item.tenHoSo || '').toLowerCase();
                const tenSuKien = (item.tenSuKien || '').toLowerCase();
                const nguoiGui = (item.nguoiGui || item.tenNguoiGui || '').toLowerCase();
                return tieuDe.includes(query) || tenSuKien.includes(query) || nguoiGui.includes(query);
            });
            renderPendingList(filtered);
        }, 400));
    }
}

// ==================== PHÊ DUYỆT ====================

function openApproveModal(id) {
    currentApprovalId = id;
    const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == id);
    const tieuDe = item ? (item.tieuDe || item.tenHoSo || `Hồ sơ #${id}`) : `Hồ sơ #${id}`;
    const nameEl = document.getElementById('approveEventName');
    if (nameEl) nameEl.textContent = tieuDe;
    const modal = document.getElementById('approveModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    const commentEl = document.getElementById('approveComment');
    if (commentEl) commentEl.value = '';
}

function closeApproveModal() {
    const modal = document.getElementById('approveModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    currentApprovalId = null;
}

async function confirmApprove() {
    if (!currentApprovalId) return;
    const comment = document.getElementById('approveComment')?.value || '';
    const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == currentApprovalId);

    // Dùng API /api/SuKien/{idSuKien}/duyet để cập nhật đồng thời SuKien + HoSo + LichSu
    const idSuKien = item?.eventId || item?.EventId || item?.idSuKien || item?.IdSuKien;
    if (!idSuKien) {
        showToast('Không tìm thấy mã sự kiện để phê duyệt.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${idSuKien}/duyet`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CapDuyet: 'Cấp 1 - P.CTSV',
                KetQua: 'Đồng ý',
                GhiChu: comment || 'Phê duyệt cấp 1',
                GuiThongBao: true
            })
        });

        if (!res.ok) throw new Error('Phê duyệt thất bại');

        closeApproveModal();
        showToast('Đã phê duyệt hồ sơ thành công! Trạng thái sự kiện đã cập nhật.', 'success');
        await loadPendingApprovals();

    } catch (error) {
        console.error('Lỗi phê duyệt:', error);
        showToast('Có lỗi xảy ra khi phê duyệt. Vui lòng thử lại.', 'error');
    }
}

// ==================== TỪ CHỐI ====================

function openRejectModal(id) {
    currentApprovalId = id;
    const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == id);
    const tieuDe = item ? (item.tieuDe || item.tenHoSo || `Hồ sơ #${id}`) : `Hồ sơ #${id}`;
    const nameEl = document.getElementById('rejectEventName');
    if (nameEl) nameEl.textContent = tieuDe;
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    const reasonEl = document.getElementById('rejectReason');
    if (reasonEl) reasonEl.value = '';
    const suggEl = document.getElementById('rejectSuggestion');
    if (suggEl) suggEl.value = '';
}

function closeRejectModal() {
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    currentApprovalId = null;
}

async function confirmReject() {
    if (!currentApprovalId) return;
    const reason = document.getElementById('rejectReason')?.value?.trim() || '';
    if (!reason) {
        showToast('Vui lòng nhập lý do từ chối.', 'warning');
        document.getElementById('rejectReason')?.focus();
        return;
    }

    const suggestion = document.getElementById('rejectSuggestion')?.value || '';
    const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == currentApprovalId);

    const idSuKien = item?.eventId || item?.EventId || item?.idSuKien || item?.IdSuKien;
    if (!idSuKien) {
        showToast('Không tìm thấy mã sự kiện để từ chối.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${idSuKien}/duyet`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CapDuyet: 'Cấp 1 - P.CTSV',
                KetQua: 'Từ chối',
                GhiChu: reason + (suggestion ? `\nYêu cầu chỉnh sửa: ${suggestion}` : ''),
                GuiThongBao: true
            })
        });

        if (!res.ok) throw new Error('Từ chối thất bại');

        closeRejectModal();
        showToast('Đã từ chối hồ sơ. Trạng thái sự kiện đã cập nhật.', 'info');
        await loadPendingApprovals();

    } catch (error) {
        console.error('Lỗi từ chối:', error);
        showToast('Có lỗi xảy ra khi từ chối. Vui lòng thử lại.', 'error');
    }
}

// ==================== XEM CHI TIẾT ====================

function viewApprovalDetail(id) {
    const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == id);
    if (!item) return;

    const tieuDe = item.tieuDe || item.tenHoSo || `Hồ sơ #${id}`;
    const tenSuKien = item.tenSuKien || 'Không rõ';
    const nguoiGui = item.nguoiGui || item.tenNguoiGui || 'Không rõ';
    const ngayGui = formatDate(item.ngayGui || item.ngayTao || item.createdAt);
    const moTa = item.moTa || item.ghiChu || item.noiDung || 'Không có mô tả.';

    // Cập nhật modal chi tiết nếu có
    const modal = document.getElementById('viewDetailModal');
    if (modal) {
        const el = (sel) => document.getElementById(sel);
        if (el('detailEventName')) el('detailEventName').textContent = tieuDe;
        if (el('detailId')) el('detailId').textContent = `#HS-${id}`;
        if (el('detailSender')) el('detailSender').textContent = nguoiGui;
        if (el('detailSubmitDate')) el('detailSubmitDate').textContent = ngayGui;
        if (el('detailDescription')) el('detailDescription').innerHTML = `<p>${escapeHTML(moTa)}</p>`;
        if (el('detailPriority')) el('detailPriority').textContent = 'CHỜ DUYỆT';

        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeViewDetailModal() {
    const modal = document.getElementById('viewDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Dùng lại từ modal detail
function approveFromDetail() {
    const detailId = document.getElementById('detailId')?.textContent?.replace('#HS-', '');
    closeViewDetailModal();
    if (detailId) openApproveModal(parseInt(detailId));
}

function rejectFromDetail() {
    const detailId = document.getElementById('detailId')?.textContent?.replace('#HS-', '');
    closeViewDetailModal();
    if (detailId) openRejectModal(parseInt(detailId));
}

// ==================== XUẤT DANH SÁCH ====================

function exportPendingList() {
    showToast('Chức năng xuất danh sách đang được phát triển.', 'info');
}

// ==================== DUYỆT HÀNG LOẠT ====================

function openBulkApprovalModal() {
    if (allPendingItems.length === 0) {
        showToast('Không có hồ sơ nào đang chờ duyệt.', 'info');
        return;
    }

    // Reset
    document.getElementById('bulkComment').value = '';
    document.getElementById('bulkSelectAll').checked = false;
    document.getElementById('bulkSelectedCount').textContent = 'Đã chọn: 0';
    document.getElementById('bulkTotalCount').textContent = allPendingItems.length;

    // Render danh sách checkbox
    const list = document.getElementById('bulkItemList');
    list.innerHTML = allPendingItems.map(item => {
        const id = item.idHoSo || item.id || item.idPheDuyet || 0;
        const tieuDe = item.tieuDe || item.tenHoSo || `Hồ sơ #${id}`;
        const tenSuKien = item.tenSuKien || 'Không rõ';
        const nguoiGui = item.nguoiGui || item.tenNguoiGui || 'Không rõ';
        const ngayGui = formatDate(item.ngayGui || item.ngayTao || item.createdAt);

        return `
            <label style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; cursor:pointer; transition:border-color .2s;" 
                   onmouseover="this.style.borderColor='#059669'" onmouseout="this.style.borderColor='#e5e7eb'">
                <input type="checkbox" class="bulk-item-check" value="${id}" onchange="updateBulkCount()"
                    style="width:16px; height:16px; accent-color:#059669; margin-top:2px; flex-shrink:0;">
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14px; font-weight:700; color:#1a1a2e; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                         title="${escapeHTML(tieuDe)}">${escapeHTML(tieuDe)}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color:#6b7280;">
                        <span><i class="fas fa-calendar-alt" style="margin-right:4px; color:#059669;"></i>${escapeHTML(tenSuKien)}</span>
                        <span><i class="fas fa-user" style="margin-right:4px; color:#059669;"></i>${escapeHTML(nguoiGui)}</span>
                        <span><i class="fas fa-clock" style="margin-right:4px; color:#059669;"></i>${ngayGui}</span>
                    </div>
                </div>
                <span style="padding:3px 10px; background:#fef3c7; color:#d97706; border-radius:10px; font-size:11px; font-weight:700; white-space:nowrap; flex-shrink:0;">CHỜ DUYỆT</span>
            </label>`;
    }).join('');

    const modal = document.getElementById('bulkApprovalModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBulkApprovalModal() {
    const modal = document.getElementById('bulkApprovalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleSelectAll(checkbox) {
    document.querySelectorAll('.bulk-item-check').forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateBulkCount();
}

function updateBulkCount() {
    const checked = document.querySelectorAll('.bulk-item-check:checked').length;
    const total = document.querySelectorAll('.bulk-item-check').length;
    document.getElementById('bulkSelectedCount').textContent = `Đã chọn: ${checked}`;
    // Cập nhật trạng thái "chọn tất cả"
    const selectAll = document.getElementById('bulkSelectAll');
    if (selectAll) {
        selectAll.checked = checked === total && total > 0;
        selectAll.indeterminate = checked > 0 && checked < total;
    }
}

async function confirmBulkApproval() {
    const selectedIds = Array.from(document.querySelectorAll('.bulk-item-check:checked')).map(cb => parseInt(cb.value));
    if (selectedIds.length === 0) {
        showToast('Vui lòng chọn ít nhất một hồ sơ để duyệt.', 'warning');
        return;
    }

    const comment = document.getElementById('bulkComment')?.value?.trim() || '';
    const btn = document.getElementById('btnConfirmBulk');

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý ${selectedIds.length} hồ sơ...`;

    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(selectedIds.map(async id => {
        try {
            const item = allPendingItems.find(i => (i.idHoSo || i.id || i.idPheDuyet) == id);
            const idSuKien = item?.eventId || item?.EventId || item?.idSuKien || item?.IdSuKien;
            if (!idSuKien) { failCount++; return; }

            const res = await fetch(`${API_BASE}/SuKien/${idSuKien}/duyet`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CapDuyet: 'Cấp 1 - P.CTSV',
                    KetQua: 'Đồng ý',
                    GhiChu: comment || 'Phê duyệt hàng loạt cấp 1',
                    GuiThongBao: true
                })
            });
            if (res.ok) successCount++;
            else failCount++;
        } catch {
            failCount++;
        }
    }));

    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-check-double"></i> Phê duyệt tất cả đã chọn`;

    closeBulkApprovalModal();

    if (successCount > 0 && failCount === 0) {
        showToast(`✅ Đã phê duyệt thành công ${successCount} hồ sơ! Trạng thái sự kiện đã cập nhật.`, 'success');
    } else if (successCount > 0) {
        showToast(`Phê duyệt ${successCount} hồ sơ thành công, ${failCount} hồ sơ thất bại.`, 'warning');
    } else {
        showToast('Phê duyệt thất bại. Vui lòng thử lại.', 'error');
    }

    await loadPendingApprovals();
}

// Đóng modal khi click ngoài
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bulkApprovalModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeBulkApprovalModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeBulkApprovalModal();
    });
});

window.openBulkApprovalModal = openBulkApprovalModal;
window.closeBulkApprovalModal = closeBulkApprovalModal;
window.toggleSelectAll = toggleSelectAll;
window.updateBulkCount = updateBulkCount;
window.confirmBulkApproval = confirmBulkApproval;

// ==================== FILTER CONTROLS ====================

function applyFilters() {
    const eventType = document.getElementById('eventTypeFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';

    let filtered = [...allPendingItems];

    if (eventType !== 'all') {
        filtered = filtered.filter(item => {
            const loai = (item.loaiSuKien || item.danhMuc || '').toLowerCase();
            return loai.includes(eventType);
        });
    }

    renderPendingList(filtered);
}

// ==================== HELPERS ====================

function showLoading() {
    const container = document.getElementById('pendingList');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:48px 24px; color:#6b7280;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; margin-bottom:12px; display:block;"></i>
                <p>Đang tải dữ liệu...</p>
            </div>`;
    }
}

function showError(message) {
    const container = document.getElementById('pendingList');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:48px 24px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:32px; margin-bottom:12px; display:block;"></i>
                <p>${escapeHTML(message)}</p>
                <button onclick="loadPendingApprovals()" style="margin-top:12px; padding:8px 16px; background:#059669; color:white; border:none; border-radius:6px; cursor:pointer;">
                    Thử lại
                </button>
            </div>`;
    }
}

function showToast(message, type = 'info') {
    // Tạo toast đơn giản
    const toast = document.createElement('div');
    const colors = { success: '#059669', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: ${colors[type] || colors.info}; color: white;
        padding: 12px 20px; border-radius: 8px; font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 320px;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
