// History Page JavaScript

// Sample history data
const historyData = [
    {
        id: 1,
        name: 'Hội thảo AI & Future Careers',
        type: 'Kỹ thuật Phần mềm',
        date: '15/10/2025',
        role: 'Người tham gia',
        status: 'completed',
        statusText: 'Đã tham gia',
        points: '+5 ĐRL',
        pointsType: 'positive',
        hasCertificate: true,
        isUpcoming: false
    },
    {
        id: 2,
        name: 'Chiến dịch Mùa hè xanh 2025',
        type: 'Đoàn Thanh niên',
        date: '01/07/2025',
        role: 'Tình nguyện viên',
        status: 'completed',
        statusText: 'Đã hoàn thành',
        points: '80 Giờ',
        pointsType: 'hours',
        hasCertificate: true,
        isUpcoming: false
    },
    {
        id: 3,
        name: 'Workshop Kỹ năng mềm',
        type: 'Trung tâm Kỹ năng',
        date: '25/12/2025',
        role: 'Người tham gia',
        status: 'upcoming',
        statusText: 'Sắp diễn ra',
        points: '+3 ĐRL',
        pointsType: 'upcoming',
        hasCertificate: false,
        isUpcoming: true
    },
    {
        id: 4,
        name: 'Seminar: Kỹ năng quản lý thời gian',
        type: 'Trung tâm Kỹ năng mềm',
        date: '10/11/2025',
        role: 'Người tham gia',
        status: 'completed',
        statusText: 'Đã tham gia',
        points: '+3 ĐRL',
        pointsType: 'positive',
        hasCertificate: true,
        isUpcoming: false
    }
];

// Render history table
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    historyData.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="event-info">
                    <div class="event-name">${item.name}</div>
                    <div class="event-type">${item.type}</div>
                </div>
            </td>
            <td>${item.date}</td>
            <td>${item.role}</td>
            <td>
                <span class="status-badge ${item.status}">${item.statusText}</span>
            </td>
            <td>
                <span class="points-badge ${item.pointsType}">${item.points}</span>
            </td>
            <td>
                ${item.isUpcoming 
                    ? '<button class="action-btn cancel" onclick="cancelRegistration(' + item.id + ')"><i class="fas fa-times"></i> Hủy đăng ký</button>'
                    : item.hasCertificate 
                        ? '<button class="action-btn" onclick="downloadCertificate(' + item.id + ')"><i class="fas fa-download"></i> Chứng chỉ</button>'
                        : '<span class="no-certificate">Không có chứng chỉ</span>'
                }
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Download certificate
function downloadCertificate(eventId) {
    const event = historyData.find(e => e.id === eventId);
    if (event) {
        alert(`Đang tải chứng chỉ cho sự kiện: ${event.name}`);
        // Here you would implement actual download logic
        console.log('Downloading certificate for event:', eventId);
    }
}

// Cancel registration
function cancelRegistration(eventId) {
    const event = historyData.find(e => e.id === eventId);
    if (event) {
        if (confirm(`Bạn có chắc chắn muốn hủy đăng ký sự kiện "${event.name}"?`)) {
            alert(`Đã hủy đăng ký sự kiện: ${event.name}`);
            // Here you would implement actual cancellation logic
            console.log('Cancelling registration for event:', eventId);
            
            // Remove from list and re-render
            const index = historyData.findIndex(e => e.id === eventId);
            if (index > -1) {
                historyData.splice(index, 1);
                renderHistoryTable();
            }
        }
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.history-table tbody tr');

        rows.forEach(row => {
            const eventName = row.querySelector('.event-name').textContent.toLowerCase();
            const eventType = row.querySelector('.event-type').textContent.toLowerCase();
            
            if (eventName.includes(searchTerm) || eventType.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Analyze button
function setupAnalyzeButton() {
    const analyzeBtn = document.querySelector('.btn-analyze');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            alert('Chức năng phân tích hiệu điểm đang được phát triển');
        });
    }
}

// Banner button
function setupBannerButton() {
    const bannerBtn = document.querySelector('.btn-banner');
    if (bannerBtn) {
        bannerBtn.addEventListener('click', function() {
            alert('Chức năng xem bảng xếp hạng đang được phát triển');
        });
    }
}

// Pagination
function setupPagination() {
    const pageButtons = document.querySelectorAll('.page-btn:not(:disabled)');
    
    pageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Remove active class from all buttons
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button (if it's a number)
            if (!this.querySelector('i')) {
                this.classList.add('active');
            }
            
            // Here you would load the corresponding page data
            console.log('Loading page:', this.textContent);
        });
    });
}

// User menu
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            alert('Menu người dùng đang được phát triển');
        });
    }
}

// Notification button
function setupNotificationButton() {
    const notificationBtn = document.querySelector('.btn-notification');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            window.location.href = 'notifications.html';
        });
    }
}

// Load user stats
function loadUserStats() {
    // This would typically fetch from an API
    const stats = {
        eventsAttended: 24,
        totalPoints: 85,
        communityHours: 120.5
    };

    // Update stats in the UI
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = stats.eventsAttended;
        statNumbers[1].textContent = stats.totalPoints;
        statNumbers[2].textContent = stats.communityHours;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    renderHistoryTable();
    setupSearch();
    setupAnalyzeButton();
    setupBannerButton();
    setupPagination();
    setupUserMenu();
    setupNotificationButton();
    loadUserStats();

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        // Uncomment to enforce authentication
        // window.location.href = 'login.html';
    }
});

// Export functions
window.historyModule = {
    renderHistoryTable,
    downloadCertificate,
    cancelRegistration,
    loadUserStats
};
