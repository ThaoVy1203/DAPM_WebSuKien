// Budget Management JavaScript
let currentBudgetId = null;

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    initializeBudgetCalculation();
    initializeFilterSelect();

    await loadBudgets();
    await loadEvents();
});

// ==========================
// LOAD DATA FROM API
// ==========================
async function loadBudgets() {
    try {
        const res = await fetch(`${API_BASE}/NganSach`);
        const budgets = await res.json();

        renderBudgetTable(budgets);
    } catch (error) {
        console.error("Lỗi load ngân sách:", error);
        alert("Không kết nối được backend!");
    }
}

async function loadEvents() {
    try {
        const res = await fetch(`${API_BASE}/SuKien`);
        const events = await res.json();

        const eventSelect = document.getElementById('eventSelect');
        if (!eventSelect) return;

        eventSelect.innerHTML = '<option value="">-- Chọn sự kiện --</option>';

        events.forEach(event => {
            eventSelect.innerHTML += `
                <option value="${event.id}">
                    ${event.tenSuKien}
                </option>
            `;
        });

    } catch (error) {
        console.error("Lỗi load sự kiện:", error);
    }
}

// ==========================
// RENDER TABLE
// ==========================
function renderBudgetTable(budgets) {
    const tbody = document.querySelector('.budget-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    budgets.forEach(budget => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${budget.tenSuKien}</td>
            <td>${formatCurrency(budget.tongNganSach)} đ</td>
            <td>${formatCurrency(budget.daChi)} đ</td>
            <td>${formatCurrency(budget.conLai)} đ</td>
            <td>
                <span class="status-badge ${budget.trangThai}">
                    ${getStatusText(budget.trangThai)}
                </span>
            </td>
            <td>
                <button onclick="viewBudgetDetail(${budget.id})">Chi tiết</button>
                <button onclick="editBudget(${budget.id})">Sửa</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function getStatusText(status) {
    const map = {
        approved: "Đã duyệt",
        pending: "Chờ duyệt",
        rejected: "Từ chối"
    };

    return map[status] || status;
}

// ==========================
// CREATE / UPDATE
// ==========================
async function saveBudget(formData) {
    try {
        let method = currentBudgetId ? "PUT" : "POST";
        let url = currentBudgetId
            ? `${API_BASE}/NganSach/${currentBudgetId}`
            : `${API_BASE}/NganSach`;

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error("Save failed");

        alert(currentBudgetId
            ? "Cập nhật ngân sách thành công"
            : "Tạo ngân sách thành công");

        closeBudgetModal();
        await loadBudgets();

    } catch (error) {
        console.error("Lỗi lưu ngân sách:", error);
        alert("Lưu thất bại!");
    }
}

// ==========================
// LOAD DETAIL
// ==========================
async function viewBudgetDetail(budgetId) {
    try {
        const res = await fetch(`${API_BASE}/NganSach/${budgetId}`);
        const data = await res.json();

        currentBudgetId = budgetId;

        document.getElementById('detailEventName').textContent = data.tenSuKien;
        document.getElementById('detailTotalBudget').textContent =
            formatCurrency(data.tongNganSach) + ' đ';

        document.getElementById('detailSpent').textContent =
            formatCurrency(data.daChi) + ' đ';

        document.getElementById('detailRemaining').textContent =
            formatCurrency(data.conLai) + ' đ';

        document.getElementById('detailNotes').textContent = data.ghiChu || '';

        const tbody = document.getElementById('detailItemsBody');
        tbody.innerHTML = '';

        data.items.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.tenHangMuc}</td>
                    <td>${item.soLuong}</td>
                    <td>${formatCurrency(item.donGia)} đ</td>
                    <td>${formatCurrency(item.thanhTien)} đ</td>
                </tr>
            `;
        });

        document.getElementById('budgetDetailModal').classList.add('active');

    } catch (error) {
        console.error("Lỗi load chi tiết:", error);
    }
}

// ==========================
// EDIT
// ==========================
async function editBudget(budgetId) {
    try {
        const res = await fetch(`${API_BASE}/NganSach/${budgetId}`);
        const data = await res.json();

        currentBudgetId = budgetId;

        document.getElementById('eventSelect').value = data.suKienId;
        document.getElementById('budgetNotes').value = data.ghiChu || '';

        const tbody = document.getElementById('budgetItemsBody');
        tbody.innerHTML = '';

        data.items.forEach(item => {
            tbody.appendChild(createBudgetItemRow({
                name: item.tenHangMuc,
                category: item.loai,
                quantity: item.soLuong,
                price: item.donGia
            }));
        });

        calculateTotal();

        document.getElementById('budgetModal').classList.add('active');

    } catch (error) {
        console.error("Lỗi load sửa ngân sách:", error);
    }
}

// ==========================
// SUBMIT FORM
// ==========================
document.getElementById('budgetForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const items = [];

    document.querySelectorAll('#budgetItemsBody tr').forEach(row => {
        items.push({
            tenHangMuc: row.querySelector('.item-name').value,
            loai: row.querySelector('.item-category').value,
            soLuong: parseInt(row.querySelector('.item-quantity').value),
            donGia: parseFloat(row.querySelector('.item-price').value)
        });
    });

    const formData = {
        suKienId: document.getElementById('eventSelect').value,
        ghiChu: document.getElementById('budgetNotes').value,
        items: items
    };

    await saveBudget(formData);
});

// ==========================
// UTIL
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