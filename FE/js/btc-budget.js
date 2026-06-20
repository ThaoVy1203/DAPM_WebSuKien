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

    // Hide Create Budget button for Member
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const vaiTros = userData.vaiTros || [];
    const isTruongBan = vaiTros.includes("TruongBanToChuc");
    if (!isTruongBan) {
        const btnCreate = document.querySelector(".btn-primary[onclick='openCreateBudgetModal()']");
        if (btnCreate) btnCreate.style.display = "none";
    }

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
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const vaiTros = userData.vaiTros || [];
        const isTruong = vaiTros.includes("TruongBanToChuc");

        const url = `${window.API_BASE}/SuKien`;

        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải sự kiện");

        const events = await res.json();
        budgetPageData.events = events;

        selector.innerHTML = `<option value="all">Tất cả sự kiện</option>`;
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
        if (savedId && (savedId === "all" || events.some(e => e.idSuKien == savedId))) {
            selector.value = savedId;
            budgetPageData.selectedEventId = savedId;
        } else {
            selector.value = "all";
            budgetPageData.selectedEventId = "all";
            localStorage.setItem("btc_budget_selected_event_id", "all");
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

        if (eventId === "all") {
            const fetchPromises = budgetPageData.events.map(e => 
                fetch(`${window.API_BASE}/NganSach/su-kien/${e.idSuKien}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null)
            );
            const budgets = (await Promise.all(fetchPromises)).filter(b => b !== null);

            let totalBudget = 0;
            let totalSpent = 0;
            let totalRemaining = 0;

            budgets.forEach(b => {
                totalBudget += b.tongNganSach;
                totalSpent += b.daChi;
                totalRemaining += b.conLai;
            });

            // Update Overview Cards
            const totalEl = document.querySelector(".overview-card.total .amount");
            if (totalEl) totalEl.textContent = formatCurrency(totalBudget) + " đ";

            const spentEl = document.querySelector(".overview-card.spent .amount");
            if (spentEl) spentEl.textContent = formatCurrency(totalSpent) + " đ";
            
            const spentPctSub = document.querySelector(".overview-card.spent .sub-text");
            if (spentPctSub && totalBudget > 0) {
                spentPctSub.textContent = ((totalSpent / totalBudget) * 100).toFixed(1) + "% tổng ngân sách";
            } else if (spentPctSub) {
                spentPctSub.textContent = "0% tổng ngân sách";
            }

            const remainingEl = document.querySelector(".overview-card.remaining .amount");
            if (remainingEl) remainingEl.textContent = formatCurrency(totalRemaining) + " đ";
            
            const remainingPctSub = document.querySelector(".overview-card.remaining .sub-text");
            if (remainingPctSub && totalBudget > 0) {
                remainingPctSub.textContent = ((totalRemaining / totalBudget) * 100).toFixed(1) + "% tổng ngân sách";
            } else if (remainingPctSub) {
                remainingPctSub.textContent = "0% tổng ngân sách";
            }

            // Update pending status card
            let pendingCount = budgets.filter(b => b.trangThai === "pending" || b.trangThai === "Chờ duyệt").length;
            let pendingAmount = budgets.filter(b => b.trangThai === "pending" || b.trangThai === "Chờ duyệt").reduce((sum, b) => sum + b.tongNganSach, 0);
            
            const pendingEl = document.querySelector(".overview-card.pending .amount");
            if (pendingEl) pendingEl.textContent = formatCurrency(pendingAmount) + " đ";
            const pendingSub = document.querySelector(".overview-card.pending .sub-text");
            if (pendingSub) pendingSub.textContent = pendingCount + " yêu cầu";

            // Render all budgets
            renderBudgetTable(budgets);
            return;
        }

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

        const isPending = budgetData.trangThai === "pending" || budgetData.trangThai === "Chờ duyệt";
        const pendingEl = document.querySelector(".overview-card.pending .amount");
        if (pendingEl) pendingEl.textContent = formatCurrency(isPending ? budgetData.tongNganSach : 0) + " đ";
        const pendingSub = document.querySelector(".overview-card.pending .sub-text");
        if (pendingSub) pendingSub.textContent = (isPending ? 1 : 0) + " yêu cầu";

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
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Không có dữ liệu ngân sách cho sự kiện này</td></tr>';
        return;
    }

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const vaiTros = userData.vaiTros || [];
    const isTruongBan = vaiTros.includes("TruongBanToChuc");

    budgets.forEach(budget => {
        const row = document.createElement('tr');
        const progressPct = budget.tongNganSach > 0 ? ((budget.daChi / budget.tongNganSach) * 100).toFixed(1) : 0;
        
        const eventObj = budgetPageData.events.find(e => e.idSuKien === budget.idSuKien);
        const eventDateStr = eventObj ? new Date(eventObj.thoiGianBatDau).toLocaleDateString('vi-VN') : '';

        row.innerHTML = `
            <td>
                <div class="event-info">
                    <h4>${budget.tenSuKien}</h4>
                    <span class="event-date">${eventDateStr}</span>
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
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="viewBudgetDetail(${budget.idSuKien})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isTruongBan && budget.trangThai === "Nháp" ? `
                    <button class="btn-action" onclick="editBudget(${budget.idSuKien})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
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
        const category = "other";
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
    await saveBudget("approved"); 
});

// ==========================
// LOAD DETAILS FOR MODAL
// ==========================
async function viewBudgetDetail(idSuKien = null) {
    let data = budgetPageData.currentBudget;
    if (idSuKien) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/NganSach/su-kien/${idSuKien}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            data = await res.json();
            budgetPageData.currentBudget = data;
        } else {
            return;
        }
    }
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
        const items = data.items || data.Items || [];
        items.forEach(item => {
            const name = item.tenHangMuc || item.TenHangMuc || '';
            const qty = item.soLuong !== undefined ? item.soLuong : (item.SoLuong !== undefined ? item.SoLuong : 0);
            const price = item.donGia !== undefined ? item.donGia : (item.DonGia !== undefined ? item.DonGia : 0);
            const total = item.thanhTien !== undefined ? item.thanhTien : (item.ThanhTien !== undefined ? item.ThanhTien : qty * price);
            tbody.innerHTML += `
                <tr>
                    <td>${name}</td>
                    <td>${qty}</td>
                    <td>${formatCurrency(price)} đ</td>
                    <td><strong>${formatCurrency(total)} đ</strong></td>
                </tr>
            `;
        });
    }

    const editBtn = document.getElementById('btnEditFromDetail');
    if (editBtn) {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const vaiTros = userData.vaiTros || [];
        const isTruongBan = vaiTros.includes("TruongBanToChuc");
        if (isTruongBan && data.trangThai === "Nháp") {
            editBtn.style.display = 'inline-block';
        } else {
            editBtn.style.display = 'none';
        }
    }

    document.getElementById('budgetDetailModal').classList.add('active');
}

// ==========================
// EDIT BUDGET
// ==========================
async function editBudget(idSuKien = null) {
    let data = budgetPageData.currentBudget;
    if (idSuKien) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/NganSach/su-kien/${idSuKien}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            data = await res.json();
            budgetPageData.currentBudget = data;
        } else {
            return;
        }
    }
    if (!data) return;

    if (data.trangThai !== "Nháp") {
        alert("Chỉ được chỉnh sửa ngân sách của sự kiện đang ở trạng thái Nháp.");
        return;
    }

    closeBudgetDetailModal();

    const modal = document.getElementById('budgetModal');
    const modalTitle = document.getElementById('budgetModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Chỉnh sửa kế hoạch chi phí';
    
    document.getElementById('eventSelect').value = data.idSuKien;
    document.getElementById('budgetNotes').value = data.ghiChu || '';

    const tbody = document.getElementById('budgetItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        const items = data.items || data.Items || [];
        items.forEach(item => {
            const name = item.tenHangMuc || item.TenHangMuc || '';
            const qty = item.soLuong !== undefined ? item.soLuong : (item.SoLuong !== undefined ? item.SoLuong : 1);
            const price = item.donGia !== undefined ? item.donGia : (item.DonGia !== undefined ? item.DonGia : 0);
            tbody.appendChild(createBudgetItemRow({
                name: name,
                quantity: qty,
                price: price
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
