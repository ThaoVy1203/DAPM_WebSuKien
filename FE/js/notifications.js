// Notifications Page JavaScript

// Sample notifications data
const notificationsData = {
    today: [
        {
            id: 1,
            type: 'event',
            icon: 'fa-calendar',
            title: 'Cập nhật lịch hội nghị Sinh viên Nghiên cứu Khoa học',
            text: 'Thời gian diễn ra hội nghị đã được dời sang 8:30 sáng Thứ Hai tuần sau tại Hội trường A. Vui lòng cập nhật lịch của bạn.',
            time: '10 phút trước',
            unread: true,
            actions: [
                { text: 'Xem chi tiết sự kiện', type: 'primary', link: 'event-detail.html' },
                { text: 'Đã hiểu', type: 'secondary' }
            ]
        },
        {
            id: 2,
            type: 'system',
            icon: 'fa-check-circle',
            title: 'Đăng ký tham gia CLB Marketing được phê duyệt',
            text: 'Chúc mừng bạn! Hồ sơ đăng ký tham gia CLB Marketing của bạn đã được phê duyệt.',
            time: '2 giờ trước',
            unread: true,
            actions: [
                { text: 'Xác nhận tham gia', type: 'primary' }
            ]
        }
    ],
    older: [
        {
            id: 3,
            type: 'reminder',
            icon: 'fa-clock',
            title: 'Nhắc nhở: Hạn cuối đăng ký học phần',
            text: 'Chỉ còn 24 giờ để hoàn tất việc đăng ký học phần cho học kỳ tới. Hệ thống sẽ đóng lúc 23:59 tối nay.',
            time: 'Hôm qua',
            unread: false,
            actions: []
        },
        {
            id: 4,
            type: 'info',
            icon: 'fa-info-circle',
            title: 'Bảo trì hệ thống Portal',
            text: 'Hệ thống Portal UTE sẽ tạm dừng hoạt động để nâng cấp định kỳ từ 00:00 đến 03:00 Chủ Nhật nay.',
            time: '3 ngày trước',
            unread: false,
            actions: []
        },
        {
            id: 5,
            type: 'event',
            icon: 'fa-calendar',
            title: 'Sự kiện mới: Workshop "Kỹ năng mềm trong kỷ nguyên AI"',
            text: 'Đăng ký ngay để tham gia workshop về kỹ năng mềm cần thiết trong thời đại trí tuệ nhân tạo. Số lượng chỗ có hạn!',
            time: '5 ngày trước',
            unread: false,
            actions: [
                { text: 'Đăng ký ngay', type: 'primary', link: 'event-detail.html' }
            ]
        }
    ]
};

// Render notification item
function renderNotification(notification) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-item ${notification.unread ? 'unread' : ''}`;
    notificationDiv.dataset.id = notification.id;

    const iconClass = notification.type;
    
    let actionsHTML = '';
    if (notification.actions && notification.actions.length > 0) {
        actionsHTML = '<div class="notification-actions">';
        notification.actions.forEach(action => {
            actionsHTML += `<button class="notification-btn ${action.type}" data-link="${action.link || ''}">${action.text}</button>`;
        });
        actionsHTML += '</div>';
    }

    notificationDiv.innerHTML = `
        <div class="notification-icon ${iconClass}">
            <i class="fas ${notification.icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <div class="notification-title">
                    ${notification.unread ? '<span class="unread-dot"></span>' : ''}
                    ${notification.title}
                </div>
                <span class="notification-time">${notification.time}</span>
            </div>
            <p class="notification-text">${notification.text}</p>
            ${actionsHTML}
        </div>
    `;

    return notificationDiv;
}

// Load notifications
function loadNotifications() {
    const todayList = document.getElementById('notificationsList');
    const olderList = document.getElementById('olderNotificationsList');

    // Clear existing notifications
    todayList.innerHTML = '';
    olderList.innerHTML = '';

    // Render today's notifications
    notificationsData.today.forEach(notification => {
        todayList.appendChild(renderNotification(notification));
    });

    // Render older notifications
    notificationsData.older.forEach(notification => {
        olderList.appendChild(renderNotification(notification));
    });

    // Add event listeners to notification buttons
    addNotificationListeners();
}

// Add event listeners to notification items
function addNotificationListeners() {
    // Handle notification clicks
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.notification-btn')) {
                markAsRead(this.dataset.id);
            }
        });
    });

    // Handle action button clicks
    document.querySelectorAll('.notification-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const link = this.dataset.link;
            const notificationItem = this.closest('.notification-item');
            
            markAsRead(notificationItem.dataset.id);
            
            if (link) {
                window.location.href = link;
            }
        });
    });
}

// Mark notification as read
function markAsRead(notificationId) {
    const notification = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notification && notification.classList.contains('unread')) {
        notification.classList.remove('unread');
        const unreadDot = notification.querySelector('.unread-dot');
        if (unreadDot) {
            unreadDot.remove();
        }
        updateBadgeCounts();
    }
}

// Mark all as read
function markAllAsRead() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
        const unreadDot = item.querySelector('.unread-dot');
        if (unreadDot) {
            unreadDot.remove();
        }
    });
    updateBadgeCounts();
}

// Update badge counts
function updateBadgeCounts() {
    const allUnread = document.querySelectorAll('.notification-item.unread').length;
    const allBadge = document.querySelector('.filter-item[data-filter="all"] .badge');
    if (allBadge) {
        allBadge.textContent = allUnread;
    }

    // Update individual category badges
    const categories = ['general', 'event', 'system', 'reminder'];
    categories.forEach(category => {
        const count = document.querySelectorAll(`.notification-item.unread .notification-icon.${category}`).length;
        const badge = document.querySelector(`.filter-item[data-filter="${category}"] .badge`);
        if (badge) {
            badge.textContent = count;
        }
    });
}

// Filter notifications
function filterNotifications(filterType) {
    const allNotifications = document.querySelectorAll('.notification-item');
    
    allNotifications.forEach(notification => {
        if (filterType === 'all') {
            notification.style.display = 'flex';
        } else {
            const icon = notification.querySelector('.notification-icon');
            if (icon.classList.contains(filterType)) {
                notification.style.display = 'flex';
            } else {
                notification.style.display = 'none';
            }
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load notifications
    loadNotifications();

    // Mark all as read button
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }

    // Filter buttons
    document.querySelectorAll('.filter-item').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.filter-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter notifications
            const filterType = this.dataset.filter;
            filterNotifications(filterType);
        });
    });

    // Settings toggle
    const emailToggle = document.getElementById('emailToggle');
    const pushToggle = document.getElementById('pushToggle');

    if (emailToggle) {
        emailToggle.addEventListener('change', function() {
            console.log('Email notifications:', this.checked ? 'enabled' : 'disabled');
            // Here you would typically save this preference to the backend
        });
    }

    if (pushToggle) {
        pushToggle.addEventListener('change', function() {
            console.log('Push notifications:', this.checked ? 'enabled' : 'disabled');
            // Here you would typically save this preference to the backend
        });
    }

    // Check for user authentication
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if not authenticated
        // window.location.href = 'login.html';
    }
});

// Export functions for potential use in other scripts
window.notificationsModule = {
    markAsRead,
    markAllAsRead,
    loadNotifications,
    filterNotifications
};
