// Events page functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Events page loaded');
    
    // Load events from API
    await loadEvents();
    
    // Initialize filter functionality
    initializeFilters();
    
    // Initialize pagination
    initializePagination();
});

// Load events from API
async function loadEvents() {
    try {
        console.log('Fetching events from API...');
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        console.log('Events loaded:', events);
        
        if (events && events.length > 0) {
            renderEvents(events);
            updateResultsCount(events.length);
        } else {
            showNoEventsMessage();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showErrorMessage('Không thể tải danh sách sự kiện. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render events to the page
function renderEvents(events) {
    const eventsSection = document.querySelector('.events-section');
    const existingCards = eventsSection.querySelectorAll('.event-card');
    
    // Remove existing event cards
    existingCards.forEach(card => card.remove());
    
    // Get pagination element to insert before it
    const pagination = eventsSection.querySelector('.pagination');
    
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsSection.insertBefore(eventCard, pagination);
    });
}

// Create event card HTML
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Format dates
    const startDate = new Date(event.thoiGianBatDau);
    const endDate = new Date(event.thoiGianKetThuc);
    const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    // Determine badge class based on category
    let badgeClass = 'hoi-thao';
    let badgeText = 'SỰ KIỆN';
    
    // Calculate event status based on registration count
    const registered = event.soLuongDaDangKy || 0;
    const max = event.soLuongToiDa || 999999;
    const isFull = registered >= max;
    
    // Get status badge and button
    let statusBadge = '';
    let statusButton = '';
    
    if (event.trangThai === 'Đã duyệt') {
        if (isFull) {
            statusBadge = '<button class="btn-secondary">Hết chỗ</button>';
            statusButton = '<button class="btn-disabled" disabled>Hết chỗ</button>';
        } else {
            statusBadge = '<button class="btn-secondary">Sắp diễn ra</button>';
            statusButton = '<button class="btn-primary" onclick="goToEventDetail(' + event.idSuKien + ')">Đăng ký ngay</button>';
        }
    } else if (event.trangThai === 'Chờ duyệt') {
        statusBadge = '<button class="btn-secondary">Chờ duyệt</button>';
        statusButton = '<button class="btn-notify"><i class="fas fa-bell"></i> Nhận thông báo</button>';
    } else {
        statusBadge = '<button class="btn-secondary">' + event.trangThai + '</button>';
        statusButton = '<button class="btn-primary" onclick="goToEventDetail(' + event.idSuKien + ')">Xem chi tiết</button>';
    }
    
    card.innerHTML = `
        <div class="event-image">
            <img src="../images/event${event.idSuKien}.png" alt="Event" onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Event'">
            <span class="event-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="event-content">
            <div class="event-header">
                <h3>${event.tenSuKien}</h3>
                <span class="event-date-badge">${dateStr}</span>
            </div>
            <p class="event-description">${event.moTa || 'Không có mô tả'}</p>
            <div class="event-meta">
                <span><i class="far fa-clock"></i> ${timeStr}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</span>
                <span><i class="fas fa-users"></i> ${registered}/${max === 999999 ? 'Không giới hạn' : max}</span>
                <span><i class="fas fa-building"></i> ${isFull ? 'Hết chỗ' : 'Còn chỗ'}</span>
            </div>
            <div class="event-actions">
                ${statusBadge}
                ${statusButton}
            </div>
        </div>
    `;
    
    // Add click event to view details (except on buttons)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            goToEventDetail(event.idSuKien);
        }
    });
    
    // Add cursor pointer
    card.style.cursor = 'pointer';
    
    return card;
}

// Navigate to event detail page
function goToEventDetail(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

// Make function global for onclick handlers
window.goToEventDetail = goToEventDetail;

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `Kết quả: ${count} sự kiện`;
    }
}

// Show no events message
function showNoEventsMessage() {
    const eventsSection = document.querySelector('.events-section');
    const pagination = eventsSection.querySelector('.pagination');
    
    const message = document.createElement('div');
    message.className = 'no-events-message';
    message.style.cssText = 'text-align: center; padding: 40px; color: #666;';
    message.innerHTML = `
        <i class="fas fa-calendar-times" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
        <h3>Chưa có sự kiện nào</h3>
        <p>Hiện tại chưa có sự kiện nào được tổ chức. Vui lòng quay lại sau.</p>
    `;
    
    eventsSection.insertBefore(message, pagination);
}

// Show error message
function showErrorMessage(message) {
    const eventsSection = document.querySelector('.events-section');
    const pagination = eventsSection.querySelector('.pagination');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'text-align: center; padding: 40px; color: #dc2626; background: #fee2e2; border-radius: 8px; margin: 20px 0;';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
        <h3>Có lỗi xảy ra</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="location.reload()" style="margin-top: 16px;">Thử lại</button>
    `;
    
    eventsSection.insertBefore(errorDiv, pagination);
}

// Initialize filters
function initializeFilters() {
    // Apply filter button
    const applyFilterBtn = document.querySelector('.btn-apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            console.log('Applying filters...');
            // TODO: Add filter logic here
        });
    }

    // Status buttons
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            statusButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // TODO: Filter events by status
        });
    });
}

// Initialize pagination
function initializePagination() {
    const pageButtons = document.querySelectorAll('.page-btn:not(.active)');
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.querySelector('i')) {
                document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}
