// Home User Page JavaScript

// ===== State sự kiện =====
let huAllEvents = [];
let huAllDanhMucs = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserInfo();
    initializeUserMenu();
    initializeNotifications();
    initializeScrollAnimations();

    // Load sự kiện từ API
    loadHuDanhMucs().then(() => loadHuEvents());
    initHuSearch();
});

// Check if user is logged in
function checkAuthentication() {
    const user = localStorage.getItem('user');
    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
}

// Load user info
function loadUserInfo() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        
        // Update user avatar
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            if (user.anhDaiDien) {
                userAvatar.src = user.anhDaiDien;
            } else {
                // Use UI Avatars with user name
                const name = user.hoTen || 'User';
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D5A9C&color=fff`;
            }
            userAvatar.alt = user.hoTen || 'User';
        }
        
        // You can also update other user info in the page
        console.log('User logged in:', user.hoTen);
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// User Menu Functionality
function initializeUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    
    if (userMenu) {
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            showUserDropdown();
        });
    }
}

function showUserDropdown() {
    // Create dropdown menu if it doesn't exist
    let dropdown = document.querySelector('.user-dropdown');
    
    if (!dropdown) {
        dropdown = createUserDropdown();
        document.querySelector('.user-menu').appendChild(dropdown);
    }
    
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function createUserDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-menu">
            <a href="profile.html" class="dropdown-item">
                <i class="fas fa-user"></i>
                <span>Hồ sơ cá nhân</span>
            </a>
            <a href="my-tickets.html" class="dropdown-item">
                <i class="fas fa-ticket-alt"></i>
                <span>Vé của tôi</span>
            </a>
            <a href="history.html" class="dropdown-item">
                <i class="fas fa-history"></i>
                <span>Lịch sử tham gia</span>
            </a>
            <a href="calender.html" class="dropdown-item">
                <i class="fas fa-calendar"></i>
                <span>Lịch cá nhân</span>
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" onclick="handleLogout(event)">
                <i class="fas fa-sign-out-alt"></i>
                <span>Đăng xuất</span>
            </a>
        </div>
    `;
    
    // Add styles for dropdown
    const style = document.createElement('style');
    style.textContent = `
        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        }
        
        .user-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .dropdown-menu {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            min-width: 220px;
            padding: 8px 0;
        }
        
        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            color: #1A1A1A;
            text-decoration: none;
            transition: background-color 0.2s ease;
        }
        
        .dropdown-item:hover {
            background-color: #F3F4F6;
        }
        
        .dropdown-item i {
            width: 20px;
            color: #0D5A9C;
        }
        
        .dropdown-divider {
            height: 1px;
            background-color: #E5E7EB;
            margin: 8px 0;
        }
        
        .user-menu {
            position: relative;
        }
    `;
    document.head.appendChild(style);
    
    return dropdown;
}

// Notification Functionality
function initializeNotifications() {
    const btnNotification = document.querySelector('.btn-notification');
    
    if (btnNotification) {
        btnNotification.addEventListener('click', function() {
            window.location.href = 'notifications.html';
        });
        
        // Load notification count
        loadNotificationCount();
    }
}

function loadNotificationCount() {
    // Simulate loading notification count
    // In production, this would fetch from API
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        // Example: fetch unread count
        const unreadCount = 3; // This should come from API
        badge.textContent = unreadCount;
        
        if (unreadCount === 0) {
            badge.style.display = 'none';
        }
    }
}

// Event Cards Functionality (legacy — giữ cho các card tĩnh nếu còn)
function initializeEventCards() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        const detailBtn = card.querySelector('.btn-view-detail');
        if (detailBtn) {
            detailBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = card.dataset.eventId || '1';
                window.location.href = `event-detail.html?id=${eventId}`;
            });
        }
    });
}

// ===== Load danh mục =====
async function loadHuDanhMucs() {
    try {
        const data = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        huAllDanhMucs = data || [];
        const sel = document.getElementById('huFilterDanhMuc');
        if (!sel) return;
        huAllDanhMucs.forEach(dm => {
            const opt = document.createElement('option');
            opt.value = dm.idDanhMuc;
            opt.textContent = dm.tenDanhMuc;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn('Không tải được danh mục:', e);
    }
}

// ===== Load sự kiện từ API =====
async function loadHuEvents() {
    showHuLoading(true);
    try {
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        huAllEvents = events || [];
        renderHuEvents(huAllEvents);
    } catch (e) {
        console.error('Lỗi tải sự kiện:', e);
        showHuError('Không thể tải sự kiện. Vui lòng thử lại sau.');
    } finally {
        showHuLoading(false);
    }
}

// ===== Render card sự kiện =====
function renderHuEvents(events) {
    const grid = document.getElementById('huEventsGrid');
    if (!grid) return;
    grid.querySelectorAll('.event-card, .hu-empty, .hu-error').forEach(el => el.remove());

    if (events.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'hu-empty';
        empty.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <h4>Không tìm thấy sự kiện nào</h4>
            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
        `;
        grid.appendChild(empty);
    } else {
        // Hiển thị tối đa 6 sự kiện nổi bật ở trang chủ
        events.slice(0, 6).forEach(event => {
            grid.appendChild(createHuEventCard(event));
        });
    }

    const count = document.getElementById('huResultCount');
    if (count) {
        count.textContent = events.length > 0
            ? `Hiển thị ${Math.min(events.length, 6)} / ${huAllEvents.length} sự kiện`
            : '';
    }
}

function createHuEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const startDate = new Date(event.thoiGianBatDau);
    const dateStr = `${String(startDate.getDate()).padStart(2,'0')}/${String(startDate.getMonth()+1).padStart(2,'0')}/${startDate.getFullYear()}`;
    const endDate = new Date(event.thoiGianKetThuc);
    const endDateStr = `${String(endDate.getDate()).padStart(2,'0')}/${String(endDate.getMonth()+1).padStart(2,'0')}`;

    let badgeClass = '';
    let badgeText = event.trangThai || 'Nháp';
    if (event.trangThai === 'Đã duyệt') { badgeClass = ''; badgeText = 'Sắp diễn ra'; }
    else if (event.trangThai === 'Đang diễn ra') { badgeClass = 'blue'; badgeText = 'Đang diễn ra'; }
    else if (event.trangThai === 'Đã kết thúc') { badgeClass = 'green'; badgeText = 'Đã kết thúc'; }

    card.innerHTML = `
        <div class="event-badge ${badgeClass}">${badgeText}</div>
        <img src="../images/event${event.idSuKien}.png" alt="${event.tenSuKien}"
             onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Su+Kien'">
        <div class="event-card-content">
            <h3>${event.tenSuKien}</h3>
            <div class="event-meta">
                <span><i class="far fa-calendar"></i> ${dateStr} - ${endDateStr}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</span>
            </div>
            <a href="event-detail.html?id=${event.idSuKien}" class="btn-view-detail">Xem chi tiết</a>
        </div>
    `;
    return card;
}

// ===== Tìm kiếm & lọc =====
function initHuSearch() {
    const input = document.getElementById('huKeyword');
    const clearBtn = document.getElementById('huClearSearch');
    const selDanhMuc = document.getElementById('huFilterDanhMuc');
    const selTrangThai = document.getElementById('huFilterTrangThai');
    const resetBtn = document.getElementById('huResetFilter');

    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
        debounce = setTimeout(applyHuFilters, 300);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(debounce); applyHuFilters(); } });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            applyHuFilters();
            input.focus();
        });
    }
    if (selDanhMuc) selDanhMuc.addEventListener('change', applyHuFilters);
    if (selTrangThai) selTrangThai.addEventListener('change', applyHuFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetHuFilters);
}

function applyHuFilters() {
    const keyword = (document.getElementById('huKeyword')?.value || '').trim().toLowerCase();
    const idDanhMuc = document.getElementById('huFilterDanhMuc')?.value || '';
    const trangThai = document.getElementById('huFilterTrangThai')?.value || '';

    const filtered = huAllEvents.filter(event => {
        if (keyword) {
            const target = [event.tenSuKien || '', event.moTa || '', event.tenDiaDiem || ''].join(' ').toLowerCase();
            if (!target.includes(keyword)) return false;
        }
        if (idDanhMuc) {
            const ids = event.danhMucIds || [];
            if (!ids.includes(parseInt(idDanhMuc))) return false;
        }
        if (trangThai && event.trangThai !== trangThai) return false;
        return true;
    });

    renderHuEvents(filtered);
}

function resetHuFilters() {
    const input = document.getElementById('huKeyword');
    const clearBtn = document.getElementById('huClearSearch');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    const sel1 = document.getElementById('huFilterDanhMuc');
    const sel2 = document.getElementById('huFilterTrangThai');
    if (sel1) sel1.value = '';
    if (sel2) sel2.value = '';
    renderHuEvents(huAllEvents);
}

function showHuLoading(show) {
    const el = document.getElementById('huLoading');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function showHuError(msg) {
    const grid = document.getElementById('huEventsGrid');
    if (!grid) return;
    grid.querySelectorAll('.event-card, .hu-empty, .hu-error').forEach(el => el.remove());
    const err = document.createElement('div');
    err.className = 'hu-error';
    err.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h4>Có lỗi xảy ra</h4>
        <p>${msg}</p>
    `;
    grid.appendChild(err);
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.event-card, .stat-item, .feature-column');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Logout Handler
function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Clear user session
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

// Hero Section Parallax Effect
window.addEventListener('scroll', function() {
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        const scrolled = window.pageYOffset;
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Stats Counter Animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + ',000+';
    }
    return num + '+';
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
