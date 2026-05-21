// Calendar Page - API Integration
let currentUserId = 'ND001'; // Mock user ID - should come from session/auth
let currentDate = new Date();
let myRegistrations = [];
let allEvents = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Calendar page loaded');
    
    // Load user data
    await loadUserData();
    
    // Load events
    await loadEvents();
    
    // Initialize calendar
    initializeCalendar();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load user data
async function loadUserData() {
    try {
        // Fetch user detail
        const user = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(currentUserId));
        
        // Update welcome message
        const welcomeElement = document.querySelector('.welcome-content h2');
        if (welcomeElement) {
            welcomeElement.textContent = `Xin chào sinh viên ${user.hoTen}`;
        }
        
        // Fetch user's registrations
        const registrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY);
        myRegistrations = registrations.filter(r => r.idNguoiDung === currentUserId);
        
        // Update statistics
        updateStatistics(myRegistrations);
        
        // Load upcoming tickets
        await loadUpcomingTickets(myRegistrations);
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load all events
async function loadEvents() {
    try {
        allEvents = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        console.log('Events loaded:', allEvents);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Update statistics
function updateStatistics(registrations) {
    // Count attended events
    const attendedCount = registrations.filter(r => r.trangThai === 'Đã tham gia').length;
    
    const statValue = document.querySelector('.stat-value');
    if (statValue) {
        statValue.textContent = attendedCount;
    }
    
    // Calculate mock training points
    const trainingPoints = Math.min(100, attendedCount * 5);
    const progressValue = document.querySelector('.progress-value');
    if (progressValue) {
        progressValue.textContent = `${trainingPoints} / 100`;
    }
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${trainingPoints}%`;
    }
}

// Load upcoming tickets
async function loadUpcomingTickets(registrations) {
    const container = document.querySelector('.events-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filter upcoming events
    const upcoming = registrations.filter(r => 
        r.trangThai === 'Đã xác nhận' || r.trangThai === 'Chờ xác nhận'
    ).slice(0, 2);
    
    // Update welcome message with count
    const welcomeDesc = document.querySelector('.welcome-content p');
    if (welcomeDesc) {
        welcomeDesc.textContent = `Hôm nay bạn có ${upcoming.length} sự kiện sắp diễn ra.`;
    }
    
    // Load event details
    for (const reg of upcoming) {
        try {
            const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(reg.idSuKien));
            const eventItem = createEventItem(event);
            container.appendChild(eventItem);
        } catch (error) {
            console.error('Error loading event:', error);
        }
    }
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-calendar-times" style="font-size: 48px; display: block; margin-bottom: 16px; color: #ddd;"></i>
                Bạn chưa có sự kiện nào sắp tới
            </div>
        `;
    }
}

// Create event item
function createEventItem(event) {
    const item = document.createElement('div');
    item.className = 'event-item';
    
    const startDate = new Date(event.thoiGianBatDau);
    const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = startDate.getDate();
    
    item.innerHTML = `
        <div class="event-date-box">
            <div class="date-month">${month}</div>
            <div class="date-day">${day}</div>
        </div>
        <div class="event-info">
            <h4>${event.tenSuKien}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</p>
        </div>
        <a href="my-tickets.html" class="btn-view">Xem vé</a>
    `;
    
    return item;
}

// Initialize calendar
function initializeCalendar() {
    renderCalendar(currentDate);
}

// Render calendar
function renderCalendar(date) {
    const calendarBody = document.querySelector('.calendar-body');
    if (!calendarBody) return;
    
    calendarBody.innerHTML = '';
    
    // Get first day of month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add previous month's days
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-date inactive';
        dayDiv.textContent = prevMonthLastDay - i;
        calendarBody.appendChild(dayDiv);
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-date';
        
        // Check if this day has events
        const currentDay = new Date(date.getFullYear(), date.getMonth(), day);
        if (hasEventOnDate(currentDay)) {
            dayDiv.classList.add('has-event');
        }
        
        dayDiv.textContent = day;
        calendarBody.appendChild(dayDiv);
    }
    
    // Add next month's days to fill the grid
    const totalCells = calendarBody.children.length;
    const remainingCells = 35 - totalCells; // 5 weeks * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-date inactive';
        dayDiv.textContent = i;
        calendarBody.appendChild(dayDiv);
    }
    
    // Update month/year display
    const monthDisplay = document.querySelector('.calendar-nav span');
    if (monthDisplay) {
        const monthName = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
        monthDisplay.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
}

// Check if date has events
function hasEventOnDate(date) {
    return allEvents.some(event => {
        const eventDate = new Date(event.thoiGianBatDau);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
    });
}

// Initialize event handlers
function initializeEventHandlers() {
    // Calendar navigation
    const navButtons = document.querySelectorAll('.btn-nav');
    if (navButtons.length >= 2) {
        // Previous month
        navButtons[0].addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
        
        // Next month
        navButtons[1].addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }
    
    // Download report button
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            alert('Tính năng tải báo cáo đang được phát triển');
        });
    }
    
    // Help button
    const helpBtn = document.querySelector('.btn-help');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('Chức năng gửi yêu cầu hỗ trợ đang được phát triển.');
        });
    }
    
    // View all notifications
    const viewAllLink = document.querySelector('.view-all-link');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'notifications.html';
        });
    }
}
