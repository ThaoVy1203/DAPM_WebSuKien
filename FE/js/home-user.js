// Home User Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeUserMenu();
    initializeNotifications();
    initializeEventCards();
    initializeScrollAnimations();
});

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

// Event Cards Functionality
function initializeEventCards() {
    const eventCards = document.querySelectorAll('.event-card');
    
    eventCards.forEach(card => {
        // Add click handler for view detail buttons
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
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
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

// Load user info
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.name) {
        // Update user avatar if available
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar && userData.avatar) {
            userAvatar.src = userData.avatar;
        }
    }
}

// Initialize user info on page load
loadUserInfo();
