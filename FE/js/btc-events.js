// Events Management JavaScript

// Global variables
let currentEventId = null;
let allBtcEvents = [];      // Cache toàn bộ event cards

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Cache tất cả event cards ban đầu
    allBtcEvents = [...document.querySelectorAll('.event-card')];

    initializeFilterTabs();
    initializeBudgetCalculation();
    initializeSearch();
});

// ===== Tìm kiếm & Lọc cho BTC =====

function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const clearBtn = document.getElementById('btnClearSearch');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        // Hiện/ẩn nút xóa
        if (clearBtn) clearBtn.style.display = searchInput.value ? 'flex' : 'none';
        debounceTimer = setTimeout(applyBtcSearch, 300);
    });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { clearTimeout(debounceTimer); applyBtcSearch(); }
    });

    // Nút xóa tìm kiếm
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            applyBtcSearch();
            searchInput.focus();
        });
    }
}

function applyBtcSearch() {
    const keyword = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const activeTab = document.querySelector('.tab-btn.active');
    const activeStatus = activeTab ? activeTab.dataset.status : 'all';

    allBtcEvents.forEach(card => {
        const title = (card.querySelector('.event-title')?.textContent || '').toLowerCase();
        const location = (card.querySelector('.event-location span')?.textContent || '').toLowerCase();
        const date = (card.querySelector('.event-date span')?.textContent || '').toLowerCase();

        const matchKeyword = !keyword || title.includes(keyword) || location.includes(keyword) || date.includes(keyword);
        const matchStatus = activeStatus === 'all' || card.dataset.status === activeStatus;

        card.style.display = matchKeyword && matchStatus ? 'block' : 'none';
    });

    updateBtcResultCount();
}

function updateBtcResultCount() {
    const visible = allBtcEvents.filter(c => c.style.display !== 'none').length;
    let counter = document.querySelector('.btc-result-count');
    if (!counter) {
        counter = document.createElement('p');
        counter.className = 'btc-result-count';
        const grid = document.querySelector('.events-grid');
        if (grid) grid.before(counter);
    }
    counter.textContent = `Hiển thị ${visible} / ${allBtcEvents.length} sự kiện`;
    counter.style.cssText = 'font-size:13px;color:#6B7280;margin-bottom:12px;';
}

// Filter Tabs — cập nhật để kết hợp với tìm kiếm
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            applyBtcSearch(); // Áp dụng cả tìm kiếm + tab
        });
    });
}

// Modal Functions
function openCreateEventModal() {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'Tạo sự kiện mới';
    document.getElementById('eventForm').reset();
    currentEventId = null;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openEditEventModal(eventId) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'Chỉnh sửa sự kiện';
    currentEventId = eventId;
    
    // Enable all form fields
    enableFormFields();
    
    // Load event data (mock data for now)
    loadEventData(eventId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openViewEventModal(eventId) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'Chi tiết sự kiện';
    currentEventId = eventId;
    
    // Load event data
    loadEventData(eventId);
    
    // Disable all form fields for view mode
    disableFormFields();
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function enableFormFields() {
    const form = document.getElementById('eventForm');
    const inputs = form.querySelectorAll('input, select, textarea, button[type="button"]');
    inputs.forEach(input => {
        input.disabled = false;
        input.style.pointerEvents = 'auto';
    });
    
    // Show action buttons
    document.querySelector('.btn-save-draft').style.display = 'inline-block';
    document.querySelector('.btn-submit').style.display = 'inline-block';
}

function disableFormFields() {
    const form = document.getElementById('eventForm');
    const inputs = form.querySelectorAll('input, select, textarea, button[type="button"]');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
    });
    
    // Hide action buttons
    document.querySelector('.btn-save-draft').style.display = 'none';
    document.querySelector('.btn-submit').style.display = 'none';
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function loadEventData(eventId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            name: 'Hội thảo Công nghệ Thường niên 2024',
            category: 'seminar',
            location: 'a1-101',
            date: '2024-12-15',
            time: '09:00',
            description: 'Hội thảo về các xu hướng công nghệ mới nhất'
        }
    };

    const data = mockData[eventId];
    if (data) {
        document.getElementById('eventName').value = data.name;
        document.getElementById('eventCategory').value = data.category;
        document.getElementById('eventLocation').value = data.location;
        document.getElementById('eventDate').value = data.date;
        document.getElementById('eventTime').value = data.time;
        document.getElementById('eventDescription').value = data.description;
    }
}

// Confirm Cancel Modal
function confirmCancelEvent(eventId) {
    const modal = document.getElementById('confirmModal');
    currentEventId = eventId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('cancelReason').value = '';
}

function cancelEvent() {
    const reason = document.getElementById('cancelReason').value;
    
    if (!reason.trim()) {
        alert('Vui lòng nhập lý do hủy sự kiện');
        return;
    }

    // Call API to cancel event
    console.log('Canceling event:', currentEventId, 'Reason:', reason);
    
    // Show success message
    alert('Đã hủy sự kiện thành công');
    
    // Close modal and reload
    closeConfirmModal();
    
    // Remove event card from UI
    const eventCard = document.querySelector(`.event-card[data-event-id="${currentEventId}"]`);
    if (eventCard) {
        eventCard.remove();
    }
}

// Budget Table Functions
function initializeBudgetCalculation() {
    const budgetTableBody = document.getElementById('budgetTableBody');
    
    if (budgetTableBody) {
        budgetTableBody.addEventListener('input', function(e) {
            if (e.target.type === 'number') {
                calculateRowTotal(e.target.closest('tr'));
                calculateGrandTotal();
            }
        });

        budgetTableBody.addEventListener('click', function(e) {
            if (e.target.closest('.btn-remove')) {
                e.target.closest('tr').remove();
                calculateGrandTotal();
            }
        });
    }
}

function calculateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
    const unitPrice = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
    const total = quantity * unitPrice;
    
    row.querySelector('.total-cell').textContent = formatCurrency(total);
}

function calculateGrandTotal() {
    const rows = document.querySelectorAll('#budgetTableBody tr');
    let grandTotal = 0;
    
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
        const unitPrice = parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
        grandTotal += quantity * unitPrice;
    });
    
    document.querySelector('.total-amount').textContent = formatCurrency(grandTotal) + ' VNĐ';
}

function addBudgetRow() {
    const tbody = document.getElementById('budgetTableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" placeholder="Tên hạng mục"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td class="total-cell">0</td>
        <td><button type="button" class="btn-remove"><i class="fas fa-trash"></i></button></td>
    `;
    
    tbody.appendChild(newRow);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Form Submission
document.getElementById('eventForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        name: document.getElementById('eventName').value,
        category: document.getElementById('eventCategory').value,
        location: document.getElementById('eventLocation').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        description: document.getElementById('eventDescription').value
    };

    // Collect budget data
    const budgetItems = [];
    document.querySelectorAll('#budgetTableBody tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        budgetItems.push({
            name: inputs[0].value,
            quantity: inputs[1].value,
            unitPrice: inputs[2].value
        });
    });
    formData.budget = budgetItems;

    console.log('Form data:', formData);

    // Call API to save event
    if (currentEventId) {
        // Update existing event
        alert('Đã cập nhật sự kiện thành công');
    } else {
        // Create new event
        alert('Đã tạo sự kiện mới và gửi phê duyệt');
    }

    closeEventModal();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const eventModal = document.getElementById('eventModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (e.target === eventModal) {
        closeEventModal();
    }
    
    if (e.target === confirmModal) {
        closeConfirmModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEventModal();
        closeConfirmModal();
    }
});
