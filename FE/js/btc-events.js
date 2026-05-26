// BTC Events Management

// ── State ──────────────────────────────────────────────────────────────────
let currentEventId = null;
let allBtcEvents   = [];   // cache tất cả .event-card trong DOM

// ── Khởi tạo ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // Cache cards SAU khi DOM render xong
    allBtcEvents = [...document.querySelectorAll('.event-card')];

    initializeFilterTabs();
    initializeSearch();
    initializeBudgetCalculation();
});

// ── Tìm kiếm realtime ──────────────────────────────────────────────────────
function initializeSearch() {
    const input    = document.querySelector('.search-bar input');
    const clearBtn = document.getElementById('btnClearSearch');
    if (!input) return;

    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
        timer = setTimeout(applyBtcSearch, 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { clearTimeout(timer); applyBtcSearch(); }
        if (e.key === 'Escape') { input.value = ''; if (clearBtn) clearBtn.style.display = 'none'; applyBtcSearch(); }
    });
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            applyBtcSearch();
            input.focus();
        });
    }
}

// ── Hàm lọc chính ──────────────────────────────────────────────────────────
function applyBtcSearch() {
    // Re-cache nếu cần (trường hợp cards được render sau)
    if (allBtcEvents.length === 0) {
        allBtcEvents = [...document.querySelectorAll('.event-card')];
    }

    const keyword      = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const activeTab    = document.querySelector('.tab-btn.active');
    const activeStatus = activeTab?.dataset.status || 'all';

    let visible = 0;
    allBtcEvents.forEach(card => {
        const title    = (card.querySelector('.event-title')?.textContent    || '').toLowerCase();
        const location = (card.querySelector('.event-location span')?.textContent || '').toLowerCase();
        const date     = (card.querySelector('.event-date span')?.textContent || '').toLowerCase();
        const status   = card.dataset.status || '';

        const matchKw     = !keyword || title.includes(keyword) || location.includes(keyword) || date.includes(keyword);
        const matchStatus = activeStatus === 'all' || status === activeStatus;

        const show = matchKw && matchStatus;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    updateBtcResultCount(visible);
}

// ── Filter Tabs ─────────────────────────────────────────────────────────────
function initializeFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyBtcSearch();
        });
    });
}

// ── Toggle Filter Panel ─────────────────────────────────────────────────────
function toggleBtcFilterPanel() {
    const panel = document.getElementById('btcFilterPanel');
    const btn   = document.getElementById('btnToggleFilter');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    if (btn) btn.classList.toggle('active', !isOpen);
}
window.toggleBtcFilterPanel = toggleBtcFilterPanel;

function applyBtcPanelFilter() {
    if (allBtcEvents.length === 0) allBtcEvents = [...document.querySelectorAll('.event-card')];

    const trangThai = document.getElementById('btcFilterTrangThai')?.value || '';
    const tuNgay    = document.getElementById('btcFilterTuNgay')?.value    || '';
    const denNgay   = document.getElementById('btcFilterDenNgay')?.value   || '';
    const keyword   = (document.querySelector('.search-bar input')?.value  || '').trim().toLowerCase();

    let visible = 0;
    allBtcEvents.forEach(card => {
        const title    = (card.querySelector('.event-title')?.textContent    || '').toLowerCase();
        const location = (card.querySelector('.event-location span')?.textContent || '').toLowerCase();
        const dateText = (card.querySelector('.event-date span')?.textContent || '');
        const status   = card.dataset.status || '';

        const matchKw     = !keyword   || title.includes(keyword) || location.includes(keyword);
        const matchStatus = !trangThai || status === trangThai;

        let matchDate = true;
        if (tuNgay || denNgay) {
            const m = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (m) {
                const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
                if (tuNgay  && d < new Date(tuNgay))  matchDate = false;
                if (denNgay && d > new Date(denNgay)) matchDate = false;
            }
        }

        const show = matchKw && matchStatus && matchDate;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    updateBtcResultCount(visible);
}
window.applyBtcPanelFilter = applyBtcPanelFilter;

function resetBtcPanelFilter() {
    ['btcFilterTrangThai','btcFilterTuNgay','btcFilterDenNgay'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const inp = document.querySelector('.search-bar input');
    if (inp) inp.value = '';
    const clearBtn = document.getElementById('btnClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    allBtcEvents.forEach(c => c.style.display = '');
    updateBtcResultCount(allBtcEvents.length);
}
window.resetBtcPanelFilter = resetBtcPanelFilter;

// ── Số kết quả ──────────────────────────────────────────────────────────────
function updateBtcResultCount(count) {
    let el = document.querySelector('.btc-result-count');
    if (!el) {
        el = document.createElement('p');
        el.className = 'btc-result-count';
        el.style.cssText = 'font-size:13px;color:#6B7280;margin-bottom:12px;';
        document.querySelector('.events-grid')?.before(el);
    }
    const total = allBtcEvents.length;
    el.textContent = `Hiển thị ${count} / ${total} sự kiện`;
}

// ── Modal Tạo / Sửa / Xem ──────────────────────────────────────────────────
function openCreateEventModal() {
    document.getElementById('modalTitle').textContent = 'Tạo sự kiện mới';
    document.getElementById('eventForm').reset();
    currentEventId = null;
    enableFormFields();
    document.getElementById('eventModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openCreateEventModal = openCreateEventModal;

function openEditEventModal(eventId) {
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sự kiện';
    currentEventId = eventId;
    enableFormFields();
    loadEventData(eventId);
    document.getElementById('eventModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openEditEventModal = openEditEventModal;

function openViewEventModal(eventId) {
    document.getElementById('modalTitle').textContent = 'Chi tiết sự kiện';
    currentEventId = eventId;
    loadEventData(eventId);
    disableFormFields();
    document.getElementById('eventModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openViewEventModal = openViewEventModal;

function enableFormFields() {
    document.getElementById('eventForm').querySelectorAll('input,select,textarea,button[type="button"]')
        .forEach(el => { el.disabled = false; el.style.pointerEvents = 'auto'; });
    document.querySelector('.btn-save-draft').style.display = 'inline-block';
    document.querySelector('.btn-submit').style.display     = 'inline-block';
}

function disableFormFields() {
    document.getElementById('eventForm').querySelectorAll('input,select,textarea,button[type="button"]')
        .forEach(el => { el.disabled = true; el.style.pointerEvents = 'none'; });
    document.querySelector('.btn-save-draft').style.display = 'none';
    document.querySelector('.btn-submit').style.display     = 'none';
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
window.closeEventModal = closeEventModal;

function loadEventData(eventId) {
    const mock = {
        1: { name:'Hội thảo Công nghệ Thường niên 2024', category:'seminar', location:'a1-101', date:'2024-12-15', time:'09:00', description:'Hội thảo về các xu hướng công nghệ mới nhất' }
    };
    const d = mock[eventId];
    if (!d) return;
    document.getElementById('eventName').value        = d.name;
    document.getElementById('eventCategory').value    = d.category;
    document.getElementById('eventLocation').value    = d.location;
    document.getElementById('eventDate').value        = d.date;
    document.getElementById('eventTime').value        = d.time;
    document.getElementById('eventDescription').value = d.description;
}

// ── Hủy sự kiện ────────────────────────────────────────────────────────────
function confirmCancelEvent(eventId) {
    currentEventId = eventId;
    document.getElementById('confirmModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.confirmCancelEvent = confirmCancelEvent;

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('cancelReason').value = '';
}
window.closeConfirmModal = closeConfirmModal;

function cancelEvent() {
    const reason = document.getElementById('cancelReason').value.trim();
    if (!reason) { alert('Vui lòng nhập lý do hủy sự kiện'); return; }
    alert('Đã hủy sự kiện thành công');
    closeConfirmModal();
    const card = document.querySelector(`.event-card[data-event-id="${currentEventId}"]`);
    if (card) { card.remove(); allBtcEvents = allBtcEvents.filter(c => c !== card); }
}
window.cancelEvent = cancelEvent;

// ── Budget Table ────────────────────────────────────────────────────────────
function initializeBudgetCalculation() {
    const tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;
    tbody.addEventListener('input', e => {
        if (e.target.type === 'number') { calculateRowTotal(e.target.closest('tr')); calculateGrandTotal(); }
    });
    tbody.addEventListener('click', e => {
        if (e.target.closest('.btn-remove')) { e.target.closest('tr').remove(); calculateGrandTotal(); }
    });
}

function calculateRowTotal(row) {
    const q = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
    const p = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
    row.querySelector('.total-cell').textContent = formatCurrency(q * p);
}

function calculateGrandTotal() {
    let total = 0;
    document.querySelectorAll('#budgetTableBody tr').forEach(row => {
        const q = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
        const p = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
        total += q * p;
    });
    const el = document.querySelector('.total-amount');
    if (el) el.textContent = formatCurrency(total) + ' VNĐ';
}

function addBudgetRow() {
    const tbody = document.getElementById('budgetTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="Tên hạng mục"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td class="total-cell">0</td>
        <td><button type="button" class="btn-remove"><i class="fas fa-trash"></i></button></td>`;
    tbody.appendChild(row);
}
window.addBudgetRow = addBudgetRow;

function formatCurrency(n) { return new Intl.NumberFormat('vi-VN').format(n); }

// ── Form submit ─────────────────────────────────────────────────────────────
document.getElementById('eventForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    alert(currentEventId ? 'Đã cập nhật sự kiện thành công' : 'Đã tạo sự kiện mới và gửi phê duyệt');
    closeEventModal();
});

// ── Đóng modal khi click ngoài / Escape ────────────────────────────────────
window.addEventListener('click', e => {
    if (e.target === document.getElementById('eventModal'))   closeEventModal();
    if (e.target === document.getElementById('confirmModal')) closeConfirmModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEventModal(); closeConfirmModal(); }
});
