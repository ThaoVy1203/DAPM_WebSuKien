// Events page functionality

// Global state
let allEvents = [];         // Toàn bộ sự kiện từ API
let filteredEvents = [];    // Sự kiện sau khi lọc
let allCategories = [];     // Danh mục từ API
let allDiaDiems = [];       // Địa điểm từ API
const PAGE_SIZE = 5;        // Số sự kiện mỗi trang
let currentPage = 1;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Events page loaded');
    
    // Load danh mục và địa điểm song song
    await Promise.all([loadCategories(), loadDiaDiems()]);
    
    // Load events from API
    await loadEvents();
    
    // Initialize filter functionality
    initializeFilters();
});

// Load danh mục từ API để điền vào checkbox lọc
async function loadCategories() {
    try {
        const categories = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        if (categories && categories.length > 0) {
            allCategories = categories;
            renderCategoryFilters(categories);
        }
    } catch (error) {
        console.warn('Không thể tải danh mục, dùng danh mục mặc định:', error);
    }
}

// Load địa điểm từ API để điền vào dropdown lọc
async function loadDiaDiems() {
    try {
        const diaDiems = await API.get(API_CONFIG.ENDPOINTS.DIADIEM);
        if (diaDiems && diaDiems.length > 0) {
            allDiaDiems = diaDiems;
            renderDiaDiemFilter(diaDiems);
        }
    } catch (error) {
        console.warn('Không thể tải địa điểm:', error);
    }
}

// Render dropdown địa điểm động
function renderDiaDiemFilter(diaDiems) {
    const select = document.getElementById('filterDiaDiem');
    if (!select) return;
    // Giữ option đầu "Tất cả địa điểm"
    select.innerHTML = '<option value="">Tất cả địa điểm</option>';
    diaDiems.forEach(dd => {
        const opt = document.createElement('option');
        opt.value = dd.idDiaDiem;
        opt.textContent = dd.tenDiaDiem;
        select.appendChild(opt);
    });
}

// Render checkbox danh mục động
function renderCategoryFilters(categories) {
    const container = document.querySelector('.filter-section .category-checkboxes');
    if (!container) return;

    container.innerHTML = '';
    categories.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="category-filter" value="${cat.idDanhMuc}" checked>
            <span>${cat.tenDanhMuc}</span>
        `;
        container.appendChild(label);
    });
}

// Load events from API
async function loadEvents() {
    try {
        console.log('Fetching events from API...');
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        console.log('Events loaded:', events);
        
        if (events && events.length > 0) {
            allEvents = events;
            filteredEvents = [...allEvents];
            currentPage = 1;
            renderPage();
        } else {
            showNoEventsMessage();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showErrorMessage('Không thể tải danh sách sự kiện. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render trang hiện tại (có phân trang)
function renderPage() {
    const eventsSection = document.querySelector('.events-section');
    // Xóa card cũ
    eventsSection.querySelectorAll('.event-card, .no-events-message, .error-message').forEach(el => el.remove());

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageEvents = filteredEvents.slice(start, start + PAGE_SIZE);
    const pagination = eventsSection.querySelector('.pagination');

    if (pageEvents.length === 0) {
        showNoEventsMessage();
    } else {
        pageEvents.forEach(event => {
            const card = createEventCard(event);
            eventsSection.insertBefore(card, pagination);
        });
    }

    updateResultsCount(filteredEvents.length);
    renderPagination(filteredEvents.length);
}

// Render phân trang động
function renderPagination(total) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    pagination.innerHTML = '';

    // Nút prev
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pagination.appendChild(prevBtn);

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => { currentPage = i; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        pagination.appendChild(btn);
    }

    // Nút next
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pagination.appendChild(nextBtn);
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

// Initialize filters — kết nối tất cả bộ lọc với logic applyFilters()
function initializeFilters() {
    // Nút "Áp dụng bộ lọc"
    const applyFilterBtn = document.querySelector('.btn-apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }

    // Nút "Đặt lại"
    const resetFilterBtn = document.querySelector('.btn-reset-filter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }

    // Tìm kiếm realtime khi gõ (debounce 400ms)
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 400);
        });
        // Tìm kiếm khi nhấn Enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { clearTimeout(debounceTimer); applyFilters(); }
        });
    }

    // Nút trạng thái (Sắp diễn ra / Đã đóng / Tất cả)
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            statusButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });

    // Lọc theo ngày — áp dụng ngay khi thay đổi
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) dateFrom.addEventListener('change', applyFilters);
    if (dateTo) dateTo.addEventListener('change', applyFilters);

    // Dropdown địa điểm — áp dụng ngay khi thay đổi
    const diaDiemSelect = document.getElementById('filterDiaDiem');
    if (diaDiemSelect) diaDiemSelect.addEventListener('change', applyFilters);

    // Checkbox danh mục — áp dụng ngay
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('category-filter')) applyFilters();
    });
}

// Hàm lọc chính — gọi API server-side search
async function applyFilters() {
    const keyword = (document.querySelector('.search-box input')?.value || '').trim();
    const activeStatusBtn = document.querySelector('.status-btn.active');
    const selectedStatus = activeStatusBtn ? activeStatusBtn.dataset.status : 'all';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const idDiaDiem = document.getElementById('filterDiaDiem')?.value || '';

    // Lấy danh mục được chọn (nếu không chọn hết thì lọc theo cái đầu tiên được chọn)
    const checkedCategories = [...document.querySelectorAll('.category-filter:checked')].map(cb => parseInt(cb.value));
    const allCatIds = allCategories.map(c => c.idDanhMuc);
    // Nếu chọn tất cả hoặc không có danh mục nào → không lọc theo danh mục
    const idDanhMuc = (allCategories.length > 0 && checkedCategories.length === 1)
        ? checkedCategories[0]
        : '';

    // Xây dựng params cho API search
    const params = {
        keyword: keyword || undefined,
        idDanhMuc: idDanhMuc || undefined,
        idDiaDiem: idDiaDiem || undefined,
        trangThai: (selectedStatus && selectedStatus !== 'all') ? mapStatusToTrangThai(selectedStatus) : undefined,
        tuNgay: dateFrom || undefined,
        denNgay: dateTo || undefined,
    };

    try {
        showLoadingState();
        const results = await API.getWithParams(API_CONFIG.ENDPOINTS.SUKIEN_SEARCH, params);
        filteredEvents = results || [];

        // Lọc thêm phía client theo danh mục nếu nhiều checkbox được chọn (nhưng không phải tất cả)
        if (allCategories.length > 0 && checkedCategories.length > 0 && checkedCategories.length < allCatIds.length) {
            filteredEvents = filteredEvents.filter(event => {
                if (!event.danhMucIds || event.danhMucIds.length === 0) return false;
                return event.danhMucIds.some(id => checkedCategories.includes(id));
            });
        }

        currentPage = 1;
        renderPage();
        showSearchFeedback(keyword, filteredEvents.length);
    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        // Fallback: lọc client-side từ allEvents
        applyFiltersClientSide(keyword, selectedStatus, dateFrom, dateTo, checkedCategories);
    }
}

// Map trạng thái button → giá trị TrangThai trong DB
function mapStatusToTrangThai(status) {
    const map = {
        'upcoming': 'Đã duyệt',
        'closed': 'Đã kết thúc',
        'pending': 'Chờ duyệt',
    };
    return map[status] || '';
}

// Fallback lọc client-side (dùng khi API lỗi)
function applyFiltersClientSide(keyword, selectedStatus, dateFrom, dateTo, checkedCategories) {
    filteredEvents = allEvents.filter(event => {
        if (keyword) {
            const searchTarget = [event.tenSuKien || '', event.moTa || '', event.tenDiaDiem || ''].join(' ').toLowerCase();
            if (!searchTarget.includes(keyword.toLowerCase())) return false;
        }
        if (selectedStatus && selectedStatus !== 'all') {
            const trangThai = mapStatusToTrangThai(selectedStatus);
            if (trangThai && event.trangThai !== trangThai) return false;
        }
        if (dateFrom && new Date(event.thoiGianBatDau) < new Date(dateFrom)) return false;
        if (dateTo && new Date(event.thoiGianBatDau) > new Date(dateTo + 'T23:59:59')) return false;
        if (checkedCategories.length > 0 && allCategories.length > 0) {
            const eventCatIds = event.danhMucIds || [];
            if (eventCatIds.length > 0 && !eventCatIds.some(id => checkedCategories.includes(id))) return false;
        }
        return true;
    });
    currentPage = 1;
    renderPage();
    showSearchFeedback(keyword, filteredEvents.length);
}

// Hiển thị trạng thái đang tải
function showLoadingState() {
    const eventsSection = document.querySelector('.events-section');
    eventsSection.querySelectorAll('.event-card, .no-events-message, .error-message, .loading-state').forEach(el => el.remove());
    const pagination = eventsSection.querySelector('.pagination');
    const loading = document.createElement('div');
    loading.className = 'loading-state';
    loading.style.cssText = 'text-align:center;padding:40px;color:#6B7280;';
    loading.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:32px;margin-bottom:12px;display:block;color:#0D5A9C"></i><p>Đang tìm kiếm...</p>';
    eventsSection.insertBefore(loading, pagination);
}

// Đặt lại tất cả bộ lọc
function resetFilters() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) searchInput.value = '';

    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach((btn, i) => btn.classList.toggle('active', i === 0));

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    const diaDiemSelect = document.getElementById('filterDiaDiem');
    if (diaDiemSelect) diaDiemSelect.value = '';

    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = true);

    filteredEvents = [...allEvents];
    currentPage = 1;
    renderPage();

    const feedback = document.querySelector('.search-feedback');
    if (feedback) feedback.remove();
}

// Hiển thị phản hồi tìm kiếm
function showSearchFeedback(keyword, count) {
    let feedback = document.querySelector('.search-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'search-feedback';
        const header = document.querySelector('.section-header');
        if (header) header.after(feedback);
    }
    if (keyword) {
        feedback.innerHTML = `<i class="fas fa-search"></i> Tìm kiếm "<strong>${keyword}</strong>": tìm thấy <strong>${count}</strong> sự kiện`;
        feedback.style.display = 'flex';
    } else {
        feedback.style.display = 'none';
    }
}
