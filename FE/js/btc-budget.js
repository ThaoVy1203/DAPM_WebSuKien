// Budget Management JavaScript
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
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

window.openCreateBudgetModal = openCreateBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.closeBudgetDetailModal = closeBudgetDetailModal;
window.viewBudgetDetail = viewBudgetDetail;
window.editBudget = editBudget;
window.editFromDetail = editFromDetail;
window.removeBudgetItem = removeBudgetItem;
window.addBudgetItem = addBudgetItem;
