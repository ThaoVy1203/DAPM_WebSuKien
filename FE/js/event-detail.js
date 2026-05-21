// Event Detail Page - API Integration
let currentEvent = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Event detail page loaded');
    
    // Get user from localStorage
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem chi tiết sự kiện');
        window.location.href = 'login.html';
        return;
    }
    
    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        await loadEventDetail(eventId);
    } else {
        showError('Không tìm thấy ID sự kiện');
    }
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load event detail from API
async function loadEventDetail(eventId) {
    try {
        console.log('Loading event detail for ID:', eventId);
        
        // Show loading state
        showLoading();
        
        // Fetch event detail
        const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(eventId));
        console.log('Event loaded:', event);
        
        currentEvent = event;
        
        // Render event detail
        renderEventDetail(event);
        
        // Check registration status
        await checkRegistrationStatus(eventId);
        
    } catch (error) {
        console.error('Error loading event:', error);
        showError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.');
    }
}

// Render event detail
function renderEventDetail(event) {
    // Update page title
    document.title = event.tenSuKien + ' - UTE Events';
    
    // Update event title
    const titleElement = document.querySelector('.event-detail-header h1');
    if (titleElement) {
        titleElement.textContent = event.tenSuKien;
    }
    
    // Update event status badge
    const statusBadge = document.querySelector('.event-status');
    if (statusBadge) {
        statusBadge.textContent = event.trangThai;
        statusBadge.className = 'event-status ' + getStatusClass(event.trangThai);
    }
    
    // Update event meta info
    updateEventMeta(event);
    
    // Update event description
    const descElement = document.querySelector('.event-description');
    if (descElement) {
        descElement.textContent = event.moTa || 'Không có mô tả';
    }
    
    // Update registration info
    updateRegistrationInfo(event);
    
    // Hide loading
    hideLoading();
}

// Update event meta information
function updateEventMeta(event) {
    const startDate = new Date(event.thoiGianBatDau);
    const endDate = new Date(event.thoiGianKetThuc);
    
    // Format date
    const dateStr = startDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Format time
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    // Update date
    const dateElement = document.querySelector('.event-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class="far fa-calendar"></i> ${dateStr}`;
    }
    
    // Update time
    const timeElement = document.querySelector('.event-time');
    if (timeElement) {
        timeElement.innerHTML = `<i class="far fa-clock"></i> ${timeStr}`;
    }
    
    // Update location
    const locationElement = document.querySelector('.event-location');
    if (locationElement) {
        locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}`;
    }
    
    // Update organizer
    const organizerElement = document.querySelector('.event-organizer');
    if (organizerElement) {
        organizerElement.innerHTML = `<i class="fas fa-user"></i> ${event.tenNguoiTao || 'Ban tổ chức'}`;
    }
}

// Update registration information
function updateRegistrationInfo(event) {
    const registered = event.soDaDangKy || 0;
    const max = event.soLuongToiDa || 0;
    const available = max - registered;
    
    // Update registered count
    const registeredElement = document.querySelector('.registered-count');
    if (registeredElement) {
        registeredElement.textContent = registered;
    }
    
    // Update max count
    const maxElement = document.querySelector('.max-count');
    if (maxElement) {
        maxElement.textContent = max || 'Không giới hạn';
    }
    
    // Update available count
    const availableElement = document.querySelector('.available-count');
    if (availableElement) {
        availableElement.textContent = max ? available : 'Không giới hạn';
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar && max > 0) {
        const percentage = (registered / max) * 100;
        progressBar.style.width = percentage + '%';
    }
}

// Check if user already registered
async function checkRegistrationStatus(eventId) {
    try {
        // Fetch user's registrations
        const registrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY_BY_NGUOIDUNG(currentUser.idNguoiDung));
        
        // Check if already registered for this event
        const isRegistered = registrations.some(r => 
            r.idSuKien === parseInt(eventId) && 
            (r.trangThai === 'Chờ xác nhận' || r.trangThai === 'Đã xác nhận')
        );
        
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            if (isRegistered) {
                registerBtn.textContent = 'Đã đăng ký';
                registerBtn.classList.add('registered');
                registerBtn.disabled = true;
            } else if (currentEvent.trangThai !== 'Đã duyệt') {
                registerBtn.textContent = 'Chưa mở đăng ký';
                registerBtn.disabled = true;
            } else {
                // Check if event is full
                const registered = currentEvent.soLuongDaDangKy || 0;
                const max = currentEvent.soLuongToiDa || 999999;
                if (registered >= max) {
                    registerBtn.textContent = 'Hết chỗ';
                    registerBtn.disabled = true;
                }
            }
        }
    } catch (error) {
        console.error('Error checking registration:', error);
    }
}

// Register for event
async function registerEvent() {
    if (!currentEvent || !currentUser) return;
    
    try {
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.textContent = 'Đang đăng ký...';
        }
        
        // Create registration
        const registrationData = {
            idSuKien: currentEvent.idSuKien,
            idNguoiDung: currentUser.idNguoiDung
        };
        
        const response = await API.post(API_CONFIG.ENDPOINTS.DANGKY_REGISTER, registrationData);
        
        if (response.success) {
            // Show success modal with QR code
            showSuccessModal();
        } else {
            alert(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Đăng ký ngay';
            }
        }
        
    } catch (error) {
        console.error('Error registering:', error);
        alert('Đăng ký thất bại. Vui lòng thử lại sau.');
        
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Đăng ký ngay';
        }
    }
}

// Show success modal with QR code
function showSuccessModal() {
    const qrData = `UTE-EVENT-${currentUser.idNguoiDung}-${currentEvent.idSuKien}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            animation: slideUp 0.3s ease;
        ">
            <div class="modal-header">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #10B981; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 10px;">Đăng ký thành công!</h2>
                <p style="color: #666;">Bạn đã đăng ký sự kiện thành công</p>
            </div>
            <div class="modal-body" style="margin: 30px 0;">
                <div class="qr-code" style="background: #f9fafb; padding: 20px; border-radius: 12px; display: inline-block;">
                    <img src="${qrUrl}" alt="QR Code" style="width: 250px; height: 250px;">
                </div>
                <p style="color: #666; margin-top: 20px; font-size: 14px;">
                    Vui lòng lưu mã QR này để check-in tại sự kiện
                </p>
            </div>
            <div class="modal-footer">
                <button onclick="goToMyTickets()" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    Xem vé của tôi
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto redirect after 5 seconds
    setTimeout(() => {
        goToMyTickets();
    }, 5000);
}

// Go to my tickets page
function goToMyTickets() {
    window.location.href = 'my-tickets.html';
}

// Make function global
window.goToMyTickets = goToMyTickets;

// Initialize event handlers
function initializeEventHandlers() {
    // Register button
    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', registerEvent);
    }
    
    // Share button
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareEvent);
    }
    
    // Back button
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
}

// Share event
function shareEvent() {
    if (navigator.share && currentEvent) {
        navigator.share({
            title: currentEvent.tenSuKien,
            text: currentEvent.moTa,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy link
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép link sự kiện!');
    }
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'Đã duyệt': 'approved',
        'Chờ duyệt': 'pending',
        'Từ chối': 'rejected',
        'Đang diễn ra': 'ongoing',
        'Kết thúc': 'ended'
    };
    return statusMap[status] || 'default';
}

// Show loading state
function showLoading() {
    const container = document.querySelector('.event-detail-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #0D5A9C;"></i>
                <p style="margin-top: 20px; color: #666;">Đang tải thông tin sự kiện...</p>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading() {
    // Loading is replaced by actual content
}

// Show error message
function showError(message) {
    const container = document.querySelector('.event-detail-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
                <h3 style="margin-top: 20px; color: #333;">${message}</h3>
                <button onclick="window.history.back()" class="btn-primary" style="margin-top: 20px;">
                    Quay lại
                </button>
            </div>
        `;
    }
}
