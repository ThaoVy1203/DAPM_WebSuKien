// Profile Page - API Integration
let currentUserId = 'ND001'; // Mock user ID - should come from session/auth
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Profile page loaded');
    
    // Load user profile
    await loadUserProfile();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load user profile from API
async function loadUserProfile() {
    try {
        console.log('Loading user profile for ID:', currentUserId);
        
        // Fetch user detail
        currentUser = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(currentUserId));
        console.log('User loaded:', currentUser);
        
        // Render user profile
        renderUserProfile(currentUser);
        
        // Load user statistics
        await loadUserStatistics();
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
    }
}

// Render user profile
function renderUserProfile(user) {
    // Update profile name
    const nameElements = document.querySelectorAll('.profile-name');
    nameElements.forEach(el => {
        el.textContent = user.hoTen || 'Người dùng';
    });
    
    // Update user ID
    const idElement = document.querySelector('.profile-meta span:first-child');
    if (idElement) {
        idElement.innerHTML = `<i class="fas fa-id-card"></i> ID: ${user.idNguoiDung}`;
    }
    
    // Update email
    const emailElement = document.querySelector('.info-item:nth-child(1) p');
    if (emailElement) {
        emailElement.textContent = user.email || 'Chưa cập nhật';
    }
    
    // Update phone
    const phoneElement = document.querySelector('.info-item:nth-child(2) p');
    if (phoneElement) {
        phoneElement.textContent = user.sdt || 'Chưa cập nhật';
    }
    
    // Update avatar
    const avatarElements = document.querySelectorAll('.profile-avatar, .user-avatar');
    avatarElements.forEach(el => {
        if (user.anhDaiDien) {
            el.src = user.anhDaiDien;
        } else {
            el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=0D5A9C&color=fff&size=150`;
        }
    });
}

// Load user statistics
async function loadUserStatistics() {
    try {
        // Fetch user's registrations
        const registrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY);
        
        // Filter by current user
        const myRegistrations = registrations.filter(r => r.idNguoiDung === currentUserId);
        
        // Count attended events
        const attendedCount = myRegistrations.filter(r => r.trangThai === 'Đã tham gia').length;
        
        // Count upcoming events
        const upcomingCount = myRegistrations.filter(r => 
            r.trangThai === 'Đã xác nhận' || r.trangThai === 'Chờ xác nhận'
        ).length;
        
        // Update stats
        updateStatistics(attendedCount, upcomingCount);
        
        // Load recent events
        await loadRecentEvents(myRegistrations);
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update statistics display
function updateStatistics(attended, upcoming) {
    // Update attended events count
    const attendedElement = document.querySelector('.activity-stat-item:nth-child(1) .stat-number');
    if (attendedElement) {
        attendedElement.textContent = attended;
    }
    
    // Update upcoming events count
    const upcomingElement = document.querySelector('.activity-stat-item:nth-child(2) .stat-number');
    if (upcomingElement) {
        upcomingElement.textContent = upcoming;
    }
}

// Load recent events
async function loadRecentEvents(registrations) {
    const container = document.querySelector('.recent-events');
    if (!container) return;
    
    // Get first 2 upcoming events
    const upcoming = registrations
        .filter(r => r.trangThai === 'Đã xác nhận' || r.trangThai === 'Chờ xác nhận')
        .slice(0, 2);
    
    // Clear existing events (keep title)
    const title = container.querySelector('h3');
    container.innerHTML = '';
    if (title) container.appendChild(title);
    
    // Load event details
    for (const reg of upcoming) {
        try {
            const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(reg.idSuKien));
            const eventItem = createRecentEventItem(event);
            container.appendChild(eventItem);
        } catch (error) {
            console.error('Error loading event:', error);
        }
    }
}

// Create recent event item
function createRecentEventItem(event) {
    const item = document.createElement('div');
    item.className = 'recent-event-item';
    
    const startDate = new Date(event.thoiGianBatDau);
    const day = startDate.getDate();
    const month = `T${startDate.getMonth() + 1}`;
    
    item.innerHTML = `
        <div class="event-date">
            <span class="date-day">${day}</span>
            <span class="date-month">${month}</span>
        </div>
        <div class="event-info">
            <h4>${event.tenSuKien}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</p>
        </div>
    `;
    
    return item;
}

// Initialize event handlers
function initializeEventHandlers() {
    // Edit personal info button
    const editPersonalBtn = document.getElementById('editPersonalInfo');
    if (editPersonalBtn) {
        editPersonalBtn.addEventListener('click', () => {
            alert('Tính năng chỉnh sửa thông tin đang được phát triển');
        });
    }
    
    // Edit interests button
    const editInterestsBtn = document.getElementById('editInterests');
    if (editInterestsBtn) {
        editInterestsBtn.addEventListener('click', saveInterests);
    }
    
    // Interest tags
    const interestTags = document.querySelectorAll('.interest-tag');
    interestTags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
        });
    });
    
    // Setting items
    const settingItems = document.querySelectorAll('.setting-item');
    settingItems.forEach(item => {
        if (item.classList.contains('danger')) {
            item.addEventListener('click', logout);
        } else {
            item.addEventListener('click', () => {
                alert('Tính năng này đang được phát triển');
            });
        }
    });
    
    // View details button
    const viewDetailsBtn = document.querySelector('.btn-view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
            window.location.href = 'history.html';
        });
    }
}

// Save interests
function saveInterests() {
    const activeInterests = document.querySelectorAll('.interest-tag.active');
    const interests = Array.from(activeInterests).map(tag => 
        tag.querySelector('span').textContent
    );
    
    console.log('Saving interests:', interests);
    alert(`Đã lưu ${interests.length} sở thích: ${interests.join(', ')}`);
}

// Logout
function logout() {
    const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (confirmed) {
        // Clear session/auth data
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.profile-content');
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
