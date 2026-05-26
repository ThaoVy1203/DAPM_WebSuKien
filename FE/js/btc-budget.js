// Budget Management JavaScript

// Global variables
let currentBudgetId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeBudgetCalculation();
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
        });
    }
}

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
function openCreateBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const modalTitle = document.getElementById('budgetModalTitle');
    
    modalTitle.textContent = 'Lập kế hoạch chi phí';
    document.getElementById('budgetForm').reset();
    currentBudgetId = null;
    
    // Reset budget items table to one row
    const tbody = document.getElementById('budgetItemsBody');
    tbody.innerHTML = `
        <tr class="budget-item-row">
            <td>
                <input type="text" class="item-name" placeholder="Ví dụ: Văn phòng phẩm & In ấn" required>
            </td>
            <td>
                <select class="item-category">
                    <option value="venue">Địa điểm</option>
                    <option value="food">Ăn uống</option>
                    <option value="decoration">Trang trí</option>
                    <option value="equipment">Thiết bị</option>
                    <option value="marketing">Marketing</option>
                    <option value="staff">Nhân sự</option>
                    <option value="other">Khác</option>
                </select>
            </td>
            <td>
                <input type="number" class="item-quantity" value="1" min="1" required>
            </td>
            <td>
                <input type="number" class="item-price" value="0" min="0" required>
            </td>
            <td class="item-total">0 đ</td>
            <td>
                <button type="button" class="btn-remove-item" onclick="removeBudgetItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    
    calculateTotal();
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function editBudget(budgetId) {
    const modal = document.getElementById('budgetModal');
    const modalTitle = document.getElementById('budgetModalTitle');
    
    modalTitle.textContent = 'Chỉnh sửa kế hoạch chi phí';
    currentBudgetId = budgetId;
    
    // Load budget data (mock data for now)
    loadBudgetData(budgetId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loadBudgetData(budgetId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            eventId: '1',
            items: [
                { name: 'Văn phòng phẩm & In ấn', category: 'marketing', quantity: 100, price: 15000 },
                { name: 'Tiệc trà khách mời', category: 'food', quantity: 10, price: 250000 }
            ],
            notes: 'Kế hoạch chi phí đã được phê duyệt bởi Ban Giám hiệu'
        }
    };

    const data = mockData[budgetId];
    if (data) {
        document.getElementById('eventSelect').value = data.eventId;
        document.getElementById('budgetNotes').value = data.notes;
        
        // Load budget items
        const tbody = document.getElementById('budgetItemsBody');
        tbody.innerHTML = '';
        
        data.items.forEach(item => {
            const row = createBudgetItemRow(item);
            tbody.appendChild(row);
        });
        
        calculateTotal();
    }
}

function createBudgetItemRow(data = null) {
    const row = document.createElement('tr');
    row.className = 'budget-item-row';
    
    const name = data ? data.name : '';
    const category = data ? data.category : 'venue';
    const quantity = data ? data.quantity : 1;
    const price = data ? data.price : 0;
    const total = quantity * price;
    
    row.innerHTML = `
        <td>
            <input type="text" class="item-name" placeholder="Ví dụ: Văn phòng phẩm & In ấn" value="${name}" required>
        </td>
        <td>
            <select class="item-category">
                <option value="venue" ${category === 'venue' ? 'selected' : ''}>Địa điểm</option>
                <option value="food" ${category === 'food' ? 'selected' : ''}>Ăn uống</option>
                <option value="decoration" ${category === 'decoration' ? 'selected' : ''}>Trang trí</option>
                <option value="equipment" ${category === 'equipment' ? 'selected' : ''}>Thiết bị</option>
                <option value="marketing" ${category === 'marketing' ? 'selected' : ''}>Marketing</option>
                <option value="staff" ${category === 'staff' ? 'selected' : ''}>Nhân sự</option>
                <option value="other" ${category === 'other' ? 'selected' : ''}>Khác</option>
            </select>
        </td>
        <td>
            <input type="number" class="item-quantity" value="${quantity}" min="1" required>
        </td>
        <td>
            <input type="number" class="item-price" value="${price}" min="0" required>
        </td>
        <td class="item-total">${formatCurrency(total)} đ</td>
        <td>
            <button type="button" class="btn-remove-item" onclick="removeBudgetItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

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
