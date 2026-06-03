// Budget Management JavaScript
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "https://localhost:7160/api";
}

let budgetPageData = {
    events: [],
    selectedEventId: null,
    currentBudget: null
};

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    initializeBudgetCalculation();
<<<<<<< HEAD
    setupModals();
    await loadEventsSelector();
    await loadBudgetForSelectedEvent();
});

// ==========================
// SETUP MODALS
// ==========================
function setupModals() {
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBudgetModal();
            closeBudgetDetailModal();
        }
    });

    // Close on click outside
    window.addEventListener('click', function(e) {
        const budgetModal = document.getElementById('budgetModal');
        const budgetDetailModal = document.getElementById('budgetDetailModal');
        if (e.target === budgetModal) closeBudgetModal();
        if (e.target === budgetDetailModal) closeBudgetDetailModal();
    });
}

// ==========================
// LOAD EVENTS SELECTOR
// ==========================
async function loadEventsSelector() {
    const selector = document.getElementById("eventSelector");
    if (!selector) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
=======
    initializeFilterSelect();
    initializeSearch();
});

// ── Tìm kiếm header ────────────────────────────────────────────────────────
function initializeSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(applyBudgetSearch, 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { clearTimeout(timer); applyBudgetSearch(); }
        if (e.key === 'Escape') { input.value = ''; applyBudgetSearch(); }
    });
}

function applyBudgetSearch() {
    const kw = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const currentFilter = document.querySelector('.filter-select')?.value || 'all';
    applyBudgetFilter(currentFilter, kw);
}

// Filter Select — lọc bảng theo trạng thái + từ khóa
function initializeFilterSelect() {
    const sel = document.querySelector('.filter-select');
    if (sel) {
        sel.addEventListener('change', function () {
            const kw = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
            applyBudgetFilter(this.value, kw);
>>>>>>> origin/Nguyen
        });

        if (!res.ok) throw new Error("Lỗi tải sự kiện");

        const events = await res.json();
        budgetPageData.events = events;

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Initialize eventSelect in the modal form too
        const formEventSelect = document.getElementById("eventSelect");
        if (formEventSelect) {
            formEventSelect.innerHTML = '<option value="">Chọn sự kiện</option>';
            events.forEach(e => {
                formEventSelect.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
            });
        }

        // Get saved selected event
        let savedId = localStorage.getItem("btc_budget_selected_event_id");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            budgetPageData.selectedEventId = savedId;
        } else if (events.length > 0) {
            selector.value = events[0].idSuKien;
            budgetPageData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_budget_selected_event_id", events[0].idSuKien);
        }

        // Add change listener
        selector.addEventListener("change", function () {
            budgetPageData.selectedEventId = this.value;
            localStorage.setItem("btc_budget_selected_event_id", this.value);
            loadBudgetForSelectedEvent();
        });

    } catch (error) {
        console.error("Lỗi tải selector:", error);
    }
}

<<<<<<< HEAD
// ==========================
// LOAD BUDGET FOR SELECTED EVENT
// ==========================
async function loadBudgetForSelectedEvent() {
    const eventId = budgetPageData.selectedEventId;
    if (!eventId) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/NganSach/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải ngân sách");

        const budgetData = await res.json();
        budgetPageData.currentBudget = budgetData;

        // Update Overview Cards
        const totalEl = document.querySelector(".overview-card.total .amount");
        if (totalEl) totalEl.textContent = formatCurrency(budgetData.tongNganSach) + " đ";

        const spentEl = document.querySelector(".overview-card.spent .amount");
        if (spentEl) spentEl.textContent = formatCurrency(budgetData.daChi) + " đ";
        const spentPctSub = document.querySelector(".overview-card.spent .sub-text");
        if (spentPctSub && budgetData.tongNganSach > 0) {
            spentPctSub.textContent = ((budgetData.daChi / budgetData.tongNganSach) * 100).toFixed(1) + "% tổng ngân sách";
        }

        const remainingEl = document.querySelector(".overview-card.remaining .amount");
        if (remainingEl) remainingEl.textContent = formatCurrency(budgetData.conLai) + " đ";
        const remainingPctSub = document.querySelector(".overview-card.remaining .sub-text");
        if (remainingPctSub && budgetData.tongNganSach > 0) {
            remainingPctSub.textContent = ((budgetData.conLai / budgetData.tongNganSach) * 100).toFixed(1) + "% tổng ngân sách";
        }

        // Render event budget table row (only showing the selected event's budget)
        renderBudgetTable([budgetData]);

    } catch (error) {
        console.error("Lỗi load ngân sách:", error);
    }
}

// ==========================
// RENDER TABLE
// ==========================
function renderBudgetTable(budgets) {
    const tbody = document.querySelector('.budget-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (budgets.length === 0 || !budgets[0]) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Không có dữ liệu ngân sách cho sự kiện này</td></tr>';
        return;
    }

    budgets.forEach(budget => {
        const row = document.createElement('tr');
        const progressPct = budget.tongNganSach > 0 ? ((budget.daChi / budget.tongNganSach) * 100).toFixed(1) : 0;
        
        row.innerHTML = `
            <td>
                <div class="event-info">
                    <h4>${budget.tenSuKien}</h4>
                    <span class="event-date">Sự kiện đang chọn</span>
                </div>
            </td>
            <td><strong>${formatCurrency(budget.tongNganSach)} đ</strong></td>
            <td>${formatCurrency(budget.daChi)} đ</td>
            <td>${formatCurrency(budget.conLai)} đ</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPct}%"></div>
                    </div>
                    <span class="progress-text">${progressPct}%</span>
                </div>
            </td>
            <td><span class="status-badge ${budget.trangThai}">${getStatusText(budget.trangThai)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="viewBudgetDetail()" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editBudget()" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function getStatusText(status) {
    const map = {
        approved: "Đã duyệt",
        pending: "Chờ duyệt",
        rejected: "Từ chối",
        "Đã duyệt": "Đã duyệt",
        "Chờ duyệt": "Chờ duyệt",
        "Từ chối": "Từ chối"
    };
    return map[status] || status;
}

// ==========================
// MODAL CONTROLS
// ==========================
=======
function applyBudgetFilter(filterValue, keyword) {
    const rows = document.querySelectorAll('.budget-table tbody tr');
    let visible = 0;

    rows.forEach(row => {
        const status  = row.dataset.status || '';
        const text    = row.textContent.toLowerCase();

        const matchStatus  = filterValue === 'all' || status === filterValue;
        const matchKeyword = !keyword || text.includes(keyword);

        const show = matchStatus && matchKeyword;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    // Hiện số kết quả
    let counter = document.getElementById('budgetResultCount');
    if (!counter) {
        counter = document.createElement('p');
        counter.id = 'budgetResultCount';
        counter.style.cssText = 'font-size:13px;color:#6B7280;margin:8px 0 4px;';
        document.querySelector('.budget-table-wrapper')?.before(counter);
    }
    const total = document.querySelectorAll('.budget-table tbody tr').length;
    counter.textContent = (filterValue !== 'all' || keyword)
        ? `Hiển thị ${visible} / ${total} kế hoạch`
        : '';
}

// Modal Functions
>>>>>>> origin/Nguyen
function openCreateBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const modalTitle = document.getElementById('budgetModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Lập kế hoạch chi phí';
    document.getElementById('budgetForm').reset();
    
    // Clear and pre-populate item rows
    const tbody = document.getElementById('budgetItemsBody');
    if (tbody) {
        tbody.innerHTML = "";
        addBudgetItem();
    }

    // Pre-select current event
    const formEventSelect = document.getElementById('eventSelect');
    if (formEventSelect && budgetPageData.selectedEventId) {
        formEventSelect.value = budgetPageData.selectedEventId;
    }

    modal.classList.add('active');
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.classList.remove('active');
}

function closeBudgetDetailModal() {
    const modal = document.getElementById('budgetDetailModal');
    if (modal) modal.classList.remove('active');
}

// ==========================
// SAVE BUDGET
// ==========================
async function saveBudget(trangThai = "approved") {
    const eventSelect = document.getElementById('eventSelect');
    const eventId = eventSelect.value;
    if (!eventId) {
        alert("Vui lòng chọn sự kiện!");
        return;
    }

    const items = [];
    let total = 0;

    document.querySelectorAll('#budgetItemsBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value;
        const category = row.querySelector('.item-category').value;
        const qty = parseInt(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const itemTotal = qty * price;

        if (name) {
            items.push({
                tenHangMuc: name,
                loai: category,
                soLuong: qty,
                donGia: price,
                thanhTien: itemTotal
            });
            total += itemTotal;
        }
    });

    const spent = Math.round(total * 0.65);

    const budgetData = {
        idSuKien: parseInt(eventId),
        tongNganSach: total,
        daChi: spent,
        trangThai: trangThai,
        ghiChu: document.getElementById('budgetNotes').value || "",
        items: items
    };

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/NganSach`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(budgetData)
        });

        if (!res.ok) throw new Error("Lưu ngân sách thất bại");

        if (budgetPageData.selectedEventId != eventId) {
            budgetPageData.selectedEventId = eventId;
            const selector = document.getElementById("eventSelector");
            if (selector) selector.value = eventId;
            localStorage.setItem("btc_budget_selected_event_id", eventId);
        }

        alert("Lưu kế hoạch ngân sách thành công!");
        closeBudgetModal();
        await loadBudgetForSelectedEvent();

    } catch (error) {
        console.error("Lỗi lưu ngân sách:", error);
        alert("Không thể lưu ngân sách lên máy chủ!");
    }
}

// Bind Submit buttons
document.getElementById('budgetForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    await saveBudget("pending"); // Gửi phê duyệt => Chờ duyệt
});

document.querySelector('.btn-save-draft')?.addEventListener('click', async function () {
    await saveBudget("Nháp");
});

// ==========================
// LOAD DETAILS FOR MODAL
// ==========================
function viewBudgetDetail() {
    const data = budgetPageData.currentBudget;
    if (!data) return;

    document.getElementById('detailEventName').textContent = data.tenSuKien;
    document.getElementById('detailStatus').textContent = getStatusText(data.trangThai);
    document.getElementById('detailStatus').className = `status-badge ${data.trangThai}`;

    document.getElementById('detailTotalBudget').textContent = formatCurrency(data.tongNganSach) + ' đ';
    document.getElementById('detailSpent').textContent = formatCurrency(data.daChi) + ' đ';
    document.getElementById('detailRemaining').textContent = formatCurrency(data.conLai) + ' đ';
    document.getElementById('detailNotes').textContent = data.ghiChu || 'Không có ghi chú';

    const tbody = document.getElementById('detailItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        data.items.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.tenHangMuc}</td>
                    <td><span class="category-badge ${item.loai}">${item.loai}</span></td>
                    <td>${item.soLuong}</td>
                    <td>${formatCurrency(item.donGia)} đ</td>
                    <td><strong>${formatCurrency(item.thanhTien)} đ</strong></td>
                </tr>
            `;
        });
    }

    document.getElementById('budgetDetailModal').classList.add('active');
}

// ==========================
// EDIT BUDGET
// ==========================
function editBudget() {
    const data = budgetPageData.currentBudget;
    if (!data) return;

    closeBudgetDetailModal();

    const modal = document.getElementById('budgetModal');
    const modalTitle = document.getElementById('budgetModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Chỉnh sửa kế hoạch chi phí';
    
    document.getElementById('eventSelect').value = data.eventId;
    document.getElementById('budgetNotes').value = data.ghiChu || '';

    const tbody = document.getElementById('budgetItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        data.items.forEach(item => {
            tbody.appendChild(createBudgetItemRow({
                name: item.tenHangMuc,
                category: item.loai,
                quantity: item.soLuong,
                price: item.donGia
            }));
        });
    }

    calculateTotal();
    modal.classList.add('active');
}

function editFromDetail() {
    editBudget();
}

// ==========================
// UTILITIES FOR CALCULATIONS
// ==========================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

function initializeBudgetCalculation() {
    const tbody = document.getElementById('budgetItemsBody');
    if (!tbody) return;

    tbody.addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            calculateTotal();
        }
    });
}

function calculateTotal() {
    let total = 0;
    document.querySelectorAll('#budgetItemsBody tr').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
        const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
        const itemTotal = qty * price;
        
        const itemTotalCell = row.querySelector('.item-total');
        if (itemTotalCell) {
            itemTotalCell.textContent = formatCurrency(itemTotal) + ' đ';
        }
        total += itemTotal;
    });

    const totalEl = document.getElementById('budgetTotal');
    if (totalEl) {
        totalEl.textContent = formatCurrency(total) + ' đ';
    }
}

function removeBudgetItem(btn) {
    const row = btn.closest('tr');
    if (row) {
        row.remove();
        calculateTotal();
    }
}

function addBudgetItem() {
    const tbody = document.getElementById('budgetItemsBody');
    if (!tbody) return;
    
    tbody.appendChild(createBudgetItemRow({ name: '', category: 'other', quantity: 1, price: 0 }));
    calculateTotal();
}

function createBudgetItemRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'budget-item-row';
    tr.innerHTML = `
        <td><input type="text" class="item-name" value="${item.name || ''}" required></td>
        <td>
            <select class="item-category">
                <option value="venue" ${item.category === 'venue' ? 'selected' : ''}>Địa điểm</option>
                <option value="food" ${item.category === 'food' ? 'selected' : ''}>Ăn uống</option>
                <option value="decoration" ${item.category === 'decoration' ? 'selected' : ''}>Trang trí</option>
                <option value="equipment" ${item.category === 'equipment' ? 'selected' : ''}>Thiết bị</option>
                <option value="marketing" ${item.category === 'marketing' ? 'selected' : ''}>Marketing</option>
                <option value="staff" ${item.category === 'staff' ? 'selected' : ''}>Nhân sự</option>
                <option value="other" ${item.category === 'other' ? 'selected' : ''}>Khác</option>
            </select>
        </td>
        <td><input type="number" class="item-quantity" value="${item.quantity || 1}" min="1" required></td>
        <td><input type="number" class="item-price" value="${item.price || 0}" min="0" required></td>
        <td class="item-total">${formatCurrency((item.quantity || 1) * (item.price || 0))} đ</td>
        <td>
            <button type="button" class="btn-remove-item" onclick="removeBudgetItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    return tr;
}

<<<<<<< HEAD
window.openCreateBudgetModal = openCreateBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.closeBudgetDetailModal = closeBudgetDetailModal;
window.viewBudgetDetail = viewBudgetDetail;
window.editBudget = editBudget;
window.editFromDetail = editFromDetail;
window.removeBudgetItem = removeBudgetItem;
window.addBudgetItem = addBudgetItem;
=======
// Budget Items Functions
function addBudgetItem() {
    const tbody = document.getElementById('budgetItemsBody');
    const row = createBudgetItemRow();
    tbody.appendChild(row);
}

function removeBudgetItem(button) {
    const tbody = document.getElementById('budgetItemsBody');
    const rows = tbody.querySelectorAll('tr');
    
    // Keep at least one row
    if (rows.length > 1) {
        button.closest('tr').remove();
        calculateTotal();
    } else {
        alert('Phải có ít nhất một hạng mục chi phí');
    }
}

// Budget Calculation
function initializeBudgetCalculation() {
    const tbody = document.getElementById('budgetItemsBody');
    
    if (tbody) {
        tbody.addEventListener('input', function(e) {
            if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
                const row = e.target.closest('tr');
                calculateRowTotal(row);
                calculateTotal();
            }
        });
    }
}

function calculateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.item-total').textContent = formatCurrency(total) + ' đ';
}

function calculateTotal() {
    const rows = document.querySelectorAll('#budgetItemsBody tr');
    let grandTotal = 0;
    
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        grandTotal += quantity * price;
    });
    
    const totalElement = document.getElementById('budgetTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(grandTotal) + ' đ';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Budget Detail Modal
function viewBudgetDetail(budgetId) {
    const modal = document.getElementById('budgetDetailModal');
    currentBudgetId = budgetId;
    
    // Load budget detail data (mock data for now)
    loadBudgetDetailData(budgetId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBudgetDetailModal() {
    const modal = document.getElementById('budgetDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function editFromDetail() {
    closeBudgetDetailModal();
    editBudget(currentBudgetId);
}

function loadBudgetDetailData(budgetId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            eventName: 'Hội thảo Công nghệ Thường niên 2024',
            status: 'approved',
            totalBudget: 150000000,
            spent: 92450000,
            remaining: 57550000,
            items: [
                { name: 'Văn phòng phẩm & In ấn', category: 'marketing', quantity: 100, price: 15000, total: 1500000 },
                { name: 'Tiệc trà khách mời', category: 'food', quantity: 10, price: 250000, total: 2500000 },
                { name: 'Thuê âm thanh ánh sáng', category: 'equipment', quantity: 1, price: 15000000, total: 15000000 },
                { name: 'Backdrop & Standee', category: 'decoration', quantity: 5, price: 2000000, total: 10000000 }
            ],
            notes: 'Kế hoạch chi phí đã được phê duyệt bởi Ban Giám hiệu'
        },
        2: {
            eventName: 'Workshop Khởi nghiệp Sinh viên',
            status: 'pending',
            totalBudget: 75000000,
            spent: 45000000,
            remaining: 30000000,
            items: [
                { name: 'Thuê hội trường', category: 'venue', quantity: 1, price: 10000000, total: 10000000 },
                { name: 'Ăn uống cho 200 người', category: 'food', quantity: 200, price: 100000, total: 20000000 }
            ],
            notes: 'Đang chờ phê duyệt từ Ban Giám hiệu'
        },
        3: {
            eventName: 'Ngày hội Việc làm 2024',
            status: 'approved',
            totalBudget: 200000000,
            spent: 125000000,
            remaining: 75000000,
            items: [
                { name: 'Thuê địa điểm', category: 'venue', quantity: 1, price: 50000000, total: 50000000 },
                { name: 'Booth cho doanh nghiệp', category: 'equipment', quantity: 30, price: 2000000, total: 60000000 },
                { name: 'Marketing & Truyền thông', category: 'marketing', quantity: 1, price: 30000000, total: 30000000 }
            ],
            notes: 'Ngân sách đã được phê duyệt và đang triển khai'
        },
        4: {
            eventName: 'Đêm nhạc Acoustic',
            status: 'approved',
            totalBudget: 25000000,
            spent: 23050000,
            remaining: 1950000,
            items: [
                { name: 'Thuê ban nhạc', category: 'staff', quantity: 1, price: 15000000, total: 15000000 },
                { name: 'Âm thanh ánh sáng', category: 'equipment', quantity: 1, price: 5000000, total: 5000000 },
                { name: 'Trang trí sân khấu', category: 'decoration', quantity: 1, price: 3000000, total: 3000000 }
            ],
            notes: 'Sự kiện đã hoàn thành, đang tổng hợp báo cáo chi tiết'
        }
    };

    const data = mockData[budgetId];
    if (data) {
        // Update header
        document.getElementById('detailEventName').textContent = data.eventName;
        
        const statusBadge = document.getElementById('detailStatus');
        statusBadge.className = 'status-badge ' + data.status;
        statusBadge.textContent = data.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';
        
        // Update stats
        document.getElementById('detailTotalBudget').textContent = formatCurrency(data.totalBudget) + ' đ';
        document.getElementById('detailSpent').textContent = formatCurrency(data.spent) + ' đ';
        document.getElementById('detailRemaining').textContent = formatCurrency(data.remaining) + ' đ';
        
        // Update items table
        const tbody = document.getElementById('detailItemsBody');
        tbody.innerHTML = '';
        
        data.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td><span class="category-badge ${item.category}">${getCategoryName(item.category)}</span></td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)} đ</td>
                <td><strong>${formatCurrency(item.total)} đ</strong></td>
            `;
            tbody.appendChild(row);
        });
        
        // Update notes
        document.getElementById('detailNotes').textContent = data.notes;
    }
}

function getCategoryName(category) {
    const categoryNames = {
        'venue': 'Địa điểm',
        'food': 'Ăn uống',
        'decoration': 'Trang trí',
        'equipment': 'Thiết bị',
        'marketing': 'Marketing',
        'staff': 'Nhân sự',
        'other': 'Khác'
    };
    return categoryNames[category] || category;
}

// Form Submission
document.getElementById('budgetForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('eventSelect').value;
    if (!eventId) {
        alert('Vui lòng chọn sự kiện');
        return;
    }
    
    // Collect budget items
    const items = [];
    document.querySelectorAll('#budgetItemsBody tr').forEach(row => {
        const name = row.querySelector('.item-name').value;
        const category = row.querySelector('.item-category').value;
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        
        if (name && quantity && price) {
            items.push({
                name: name,
                category: category,
                quantity: parseInt(quantity),
                price: parseFloat(price)
            });
        }
    });
    
    if (items.length === 0) {
        alert('Vui lòng thêm ít nhất một hạng mục chi phí');
        return;
    }
    
    const formData = {
        eventId: eventId,
        items: items,
        notes: document.getElementById('budgetNotes').value
    };

    console.log('Budget data:', formData);

    // Call API to save budget
    if (currentBudgetId) {
        // Update existing budget
        alert('Đã cập nhật kế hoạch chi phí thành công');
    } else {
        // Create new budget
        alert('Đã tạo kế hoạch chi phí và gửi phê duyệt');
    }

    closeBudgetModal();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const budgetModal = document.getElementById('budgetModal');
    const detailModal = document.getElementById('budgetDetailModal');
    
    if (e.target === budgetModal) {
        closeBudgetModal();
    }
    
    if (e.target === detailModal) {
        closeBudgetDetailModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBudgetModal();
        closeBudgetDetailModal();
    }
});

// Export global functions cho onclick handlers
window.openCreateBudgetModal  = openCreateBudgetModal;
window.closeBudgetModal        = closeBudgetModal;
window.editBudget              = editBudget;
window.viewBudgetDetail        = viewBudgetDetail;
window.closeBudgetDetailModal  = closeBudgetDetailModal;
window.editFromDetail          = editFromDetail;
window.addBudgetItem           = addBudgetItem;
window.removeBudgetItem        = removeBudgetItem;
>>>>>>> origin/Nguyen
