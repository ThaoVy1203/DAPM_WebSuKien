// My Tickets Page - API Integration
let currentUser = null;
let currentTicket = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('My tickets page loaded');
    
    // Get user from localStorage
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem vé');
        window.location.href = 'login.html';
        return;
    }
    
    // Get ticket ID from URL (if viewing specific ticket)
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');
    
    if (ticketId) {
        await loadTicketDetail(ticketId);
    } else {
        await loadMyTickets();
    }
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load all user's tickets
async function loadMyTickets() {
    try {
        console.log('Loading tickets for user:', currentUser.idNguoiDung);
        
        // Fetch user's registrations
        const registrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY_BY_NGUOIDUNG(currentUser.idNguoiDung));
        
        console.log('My registrations:', registrations);
        
        if (registrations.length > 0) {
            // Load first ticket detail
            await loadTicketDetailByRegistration(registrations[0]);
            
            // Render upcoming tickets list
            renderUpcomingTickets(registrations);
        } else {
            showNoTickets();
        }
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Không thể tải danh sách vé. Vui lòng thử lại sau.');
    }
}

// Load specific ticket detail by registration object
async function loadTicketDetailByRegistration(registration) {
    try {
        console.log('Loading ticket detail:', registration);
        
        // Fetch event detail
        const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(registration.idSuKien));
        
        currentTicket = { registration, event };
        
        // Render ticket detail
        renderTicketDetail(registration, event);
        
        // Generate QR code
        generateQRCode(registration);
        
    } catch (error) {
        console.error('Error loading ticket:', error);
        showError('Không thể tải thông tin vé.');
    }
}

// Render ticket detail
function renderTicketDetail(registration, event) {
    // Update event title
    const titleElement = document.querySelector('.ticket-info h2');
    if (titleElement) {
        titleElement.textContent = event.tenSuKien;
    }
    
    // Update event date
    const startDate = new Date(event.thoiGianBatDau);
    const dateStr = startDate.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const dateElement = document.querySelector('.info-grid .info-item:nth-child(1) .info-value');
    if (dateElement) {
        dateElement.textContent = dateStr;
    }
    
    // Update event time
    const endDate = new Date(event.thoiGianKetThuc);
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    const timeElement = document.querySelector('.info-grid .info-item:nth-child(2) .info-value');
    if (timeElement) {
        timeElement.textContent = timeStr;
    }
    
    // Update location
    const locationElement = document.querySelector('.info-item.full-width .info-value');
    if (locationElement) {
        locationElement.textContent = event.tenDiaDiem || 'Chưa xác định';
    }
    
    // Update status badge
    const statusBadge = document.querySelector('.ticket-badge');
    if (statusBadge) {
        statusBadge.textContent = getStatusText(registration.trangThai);
        statusBadge.className = 'ticket-badge ' + getStatusClass(registration.trangThai);
    }
}

// Render upcoming tickets list
function renderUpcomingTickets(registrations) {
    const container = document.querySelector('.upcoming-tickets');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filter upcoming events (not current ticket)
    const upcoming = registrations.filter(r => 
        r.idDangKy !== (currentTicket?.registration.idDangKy)
    ).slice(0, 2); // Show max 2
    
    upcoming.forEach(async (reg) => {
        try {
            const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(reg.idSuKien));
            const ticketItem = createUpcomingTicketItem(reg, event);
            container.appendChild(ticketItem);
        } catch (error) {
            console.error('Error loading event:', error);
        }
    });
}

// Create upcoming ticket item
function createUpcomingTicketItem(registration, event) {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'upcoming-ticket-item';
    
    // Add click handler to load this ticket
    item.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadTicketDetailByRegistration(registration);
    });
    
    const startDate = new Date(event.thoiGianBatDau);
    const dateStr = `${startDate.getDate()} THÁNG ${startDate.getMonth() + 1}`;
    
    item.innerHTML = `
        <img src="../images/event${event.idSuKien}.png" alt="Event" onerror="this.src='https://via.placeholder.com/80x80/1976D2/FFFFFF?text=Event'">
        <div class="upcoming-ticket-info">
            <div class="upcoming-date">${dateStr}</div>
            <h4>${event.tenSuKien}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</p>
        </div>
        <i class="fas fa-chevron-right"></i>
    `;
    
    return item;
}

// Generate QR code
function generateQRCode(registration) {
    const qrContainer = document.querySelector('.qr-code img');
    if (qrContainer) {
        const qrData = `UTE-EVENT-${registration.idNguoiDung}-${registration.idSuKien}`;
        qrContainer.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    }
}

// Cancel ticket
async function cancelTicket() {
    if (!currentTicket) return;
    
    const confirmed = confirm('Bạn có chắc chắn muốn hủy đăng ký sự kiện này?');
    if (!confirmed) return;
    
    try {
        const cancelBtn = document.querySelector('.btn-cancel-ticket');
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';
        }
        
        // Call cancel API
        const response = await API.post(API_CONFIG.ENDPOINTS.DANGKY_CANCEL, {
            idSuKien: currentTicket.registration.idSuKien,
            idNguoiDung: currentUser.idNguoiDung
        });
        
        if (response.success) {
            alert('Đã hủy đăng ký thành công!');
            // Redirect to events page
            window.location.href = 'events.html';
        } else {
            alert(response.message || 'Không thể hủy đăng ký. Vui lòng thử lại sau.');
            if (cancelBtn) {
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
            }
        }
        
    } catch (error) {
        console.error('Error cancelling ticket:', error);
        alert('Không thể hủy đăng ký. Vui lòng thử lại sau.');
        
        const cancelBtn = document.querySelector('.btn-cancel-ticket');
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
        }
    }
}

// Initialize event handlers
function initializeEventHandlers() {
    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel-ticket');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelTicket);
    }
    
    // Share button
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareTicket);
    }
    
    // Add to wallet buttons
    const walletButtons = document.querySelectorAll('.btn-wallet');
    walletButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Tính năng này đang được phát triển');
        });
    });
}

// Share ticket
function shareTicket() {
    if (navigator.share && currentTicket) {
        navigator.share({
            title: 'Vé sự kiện: ' + currentTicket.event.tenSuKien,
            text: 'Tôi đã đăng ký tham gia sự kiện này!',
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép link vé!');
    }
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'Chờ xác nhận': 'CHỜ XÁC NHẬN',
        'Đã xác nhận': 'ĐÃ XÁC NHẬN',
        'Đã tham gia': 'ĐÃ THAM GIA',
        'Vắng mặt': 'VẮNG MẶT',
        'Đã hủy': 'ĐÃ HỦY'
    };
    return statusMap[status] || status.toUpperCase();
}

// Get status class
function getStatusClass(status) {
    const statusMap = {
        'Chờ xác nhận': 'pending',
        'Đã xác nhận': 'confirmed',
        'Đã tham gia': 'attended',
        'Vắng mặt': 'absent',
        'Đã hủy': 'cancelled'
    };
    return statusMap[status] || 'default';
}

// Show no tickets message
function showNoTickets() {
    const container = document.querySelector('.content-layout');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-ticket-alt" style="font-size: 64px; color: #ddd;"></i>
                <h3 style="margin-top: 20px; color: #333;">Bạn chưa có vé nào</h3>
                <p style="color: #666; margin-top: 10px;">Hãy đăng ký tham gia các sự kiện để nhận vé điện tử</p>
                <a href="events.html" class="btn-primary" style="margin-top: 20px; display: inline-block; text-decoration: none;">
                    Xem sự kiện
                </a>
            </div>
        `;
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.content-layout');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
                <h3 style="margin-top: 20px; color: #333;">${message}</h3>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    Thử lại
                </button>
            </div>
        `;
    }
}
