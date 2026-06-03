<<<<<<< HEAD
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
=======
// js/profile.js
const API_BASE = "https://localhost:7160/api";

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Điền ngay từ localStorage để tránh màn hình trống
    prefillFromLocalStorage();

    // Sau đó load từ API để cập nhật mới nhất
    await loadUserProfile();
    setupEventListeners();
});

// ==========================
// ĐIỀN TỪ LOCALSTORAGE (nhanh)
// ==========================
function prefillFromLocalStorage() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        fillProfileUI(user);
    } catch (e) { /* bỏ qua */ }
}

// ==========================
// LOAD PROFILE TỪ API
// ==========================
async function loadUserProfile() {
    const token = localStorage.getItem("token");
    try {
        // Thử endpoint profile trước
        const res = await fetch(`${API_BASE}/NguoiDung/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const user = await res.json();
        fillProfileUI(user);

        // Cập nhật lại localStorage
        const existing = JSON.parse(localStorage.getItem("userData") || "{}");
        localStorage.setItem("userData", JSON.stringify({ ...existing, ...user }));

    } catch (e) {
        console.warn("Không load được profile từ API, dùng localStorage:", e.message);
        // Đã prefill từ localStorage rồi, không cần làm gì thêm
    }
}

// ==========================
// ĐIỀN DỮ LIỆU VÀO UI
// ==========================
function fillProfileUI(user) {
    if (!user) return;

    // Header
    setText("profileName", user.hoTen || "Người dùng");
    setText("profileSSO", user.maSoSSO || user.maSinhVien || "-");
    const vaiTros = user.vaiTros || [];
    setText("profileRole", vaiTros[0] || "Thành viên");

    // Thông tin cá nhân
    setText("profileEmail", user.email || "-");
    setText("profilePhone", user.SDT || user.sdt || user.phone || "-");
    setText("profileSSOInfo", user.maSoSSO || "-");
    setText("profileRoleInfo", vaiTros.join(", ") || "-");

    // Avatar
    const avatarEl = document.querySelector(".profile-avatar");
    if (avatarEl) {
        const name = encodeURIComponent(user.hoTen || "User");
        avatarEl.src = user.anhDaiDien
            || `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff&size=150`;
        avatarEl.onerror = function () {
            this.src = `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff&size=150`;
        };
    }
}

// ==========================
// CẬP NHẬT PROFILE
// ==========================
async function updateProfile(data) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/NguoiDung/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast("Cập nhật thành công!", "success");
        await loadUserProfile();

    } catch (e) {
        console.error("Lỗi cập nhật profile:", e);
        showToast("Không thể cập nhật hồ sơ. Vui lòng thử lại.", "error");
    }
}

// ==========================
// UPLOAD AVATAR
// ==========================
async function uploadAvatar(file) {
    const token = localStorage.getItem("token");
    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/NguoiDung/upload-avatar`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast("Cập nhật ảnh thành công!", "success");
        await loadUserProfile();

    } catch (e) {
        console.error("Lỗi upload avatar:", e);
        showToast("Không thể upload ảnh.", "error");
    }
}

// ==========================
// EVENT LISTENERS
// ==========================
function setupEventListeners() {
    // Sửa thông tin cá nhân
    document.getElementById("editPersonalInfo")?.addEventListener("click", () => {
        const raw = localStorage.getItem("userData");
        const user = raw ? JSON.parse(raw) : {};
        const newName = prompt("Nhập họ tên mới:", user.hoTen || "");
        if (newName && newName.trim()) {
            updateProfile({ hoTen: newName.trim() });
        }
    });

    // Upload avatar
    document.querySelector(".edit-avatar-btn")?.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) uploadAvatar(file);
        };
        input.click();
    });

    // Toggle sở thích
    document.querySelectorAll(".interest-tag").forEach(tag => {
        tag.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });

    // Đăng xuất (trong setting-item)
    document.querySelectorAll(".setting-item").forEach(item => {
        item.addEventListener("click", function () {
            const title = this.querySelector("h4")?.textContent?.trim();
            if (title === "Đăng xuất") {
                if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userData");
                    window.location.href = "login.html";
                }
            }
        });
    });
}

// ==========================
// HELPERS
// ==========================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showToast(msg, type = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;
        background:${type === "success" ? "#276749" : "#c53030"};
        color:white;box-shadow:0 4px 12px rgba(0,0,0,0.2);
        animation:fadeIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
}
