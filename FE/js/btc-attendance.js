// Attendance Page JavaScript

// Sample participants data
const participantsData = [
    {
        id: 1,
        name: 'Alex Henderson',
        department: 'Khoa CNTT',
        studentId: 'UTE2024001',
        checkInTime: '09:12 SA',
        status: 'present',
        avatar: 'AH',
        avatarColor: 'blue'
    },
    {
        id: 2,
        name: 'Bella Thompson',
        department: 'Khoa Cơ khí',
        studentId: 'UTE2024054',
        checkInTime: '—',
        status: 'absent',
        avatar: 'BT',
        avatarColor: 'gray'
    },
    {
        id: 3,
        name: 'Chris Rogers',
        department: 'Khoa Quản trị kinh doanh',
        studentId: 'UTE2024112',
        checkInTime: '08:55 SA',
        status: 'present',
        avatar: 'CR',
        avatarColor: 'orange'
    },
    {
        id: 4,
        name: 'Diana White',
        department: 'Khoa Kiến trúc',
        studentId: 'UTE2024099',
        checkInTime: '—',
        status: 'absent',
        avatar: 'DW',
        avatarColor: 'purple'
    }
];

// Render participants table
function renderParticipantsTable() {
    const tbody = document.getElementById('participantsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    participantsData.forEach(participant => {
        const row = document.createElement('tr');
        
        const statusClass = participant.status === 'present' ? 'present' : 'absent';
        const statusText = participant.status === 'present' ? 'Đã có mặt' : 'Vắng mặt';
        
        row.innerHTML = `
            <td>
                <div class="participant-info">
                    <div class="participant-avatar ${participant.avatarColor}">${participant.avatar}</div>
                    <div class="participant-details">
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-department">${participant.department}</div>
                    </div>
                </div>
            </td>
            <td>${participant.studentId}</td>
            <td>${participant.checkInTime}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <button class="btn-more" onclick="showParticipantMenu(${participant.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Show participant menu
function showParticipantMenu(participantId) {
    const participant = participantsData.find(p => p.id === participantId);
    if (participant) {
        alert(`Tùy chọn cho ${participant.name}\n- Xem chi tiết\n- Chỉnh sửa\n- Gửi thông báo`);
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.participants-table tbody tr');

        rows.forEach(row => {
            const name = row.querySelector('.participant-name').textContent.toLowerCase();
            const studentId = row.querySelectorAll('td')[1].textContent.toLowerCase();
            const department = row.querySelector('.participant-department').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || studentId.includes(searchTerm) || department.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Export to Excel
function exportToExcel() {
    alert('Đang xuất dữ liệu ra file Excel...');
    console.log('Exporting attendance data to Excel');
}

// Manual check-in
function manualCheckIn() {
    const studentId = prompt('Nhập mã số sinh viên để điểm danh thủ công:');
    if (studentId) {
        alert(`Đã điểm danh thành công cho sinh viên: ${studentId}`);
        // Here you would update the participant status
    }
}

// Update attendance stats
function updateStats() {
    const totalParticipants = 200;
    const presentCount = 145;
    const absentCount = totalParticipants - presentCount;
    const percentage = ((presentCount / totalParticipants) * 100).toFixed(1);

    // Update circle progress
    const circumference = 2 * Math.PI * 90; // r = 90
    const progress = (presentCount / totalParticipants) * circumference;
    const circleProgress = document.querySelector('.circle-progress');
    if (circleProgress) {
        circleProgress.style.strokeDasharray = `${progress}, ${circumference}`;
    }

    // Update numbers
    const circleNumber = document.querySelector('.circle-number');
    if (circleNumber) {
        circleNumber.textContent = presentCount;
    }

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
        statValues[0].textContent = percentage + '%';
        statValues[1].textContent = absentCount;
    }
}

// Auto refresh activity feed
function startActivityFeed() {
    // Simulate real-time updates
    setInterval(function() {
        console.log('Checking for new check-ins...');
        // Here you would fetch new check-ins from the API
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Export button
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Manual check-in button
    const manualBtn = document.querySelector('.btn-manual-checkin');
    if (manualBtn) {
        manualBtn.addEventListener('click', manualCheckIn);
    }

    // Pagination buttons
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled) {
                console.log('Loading next page...');
                // Here you would load the next page of data
            }
        });
    });

    // Header buttons
    const notificationBtn = document.querySelector('.btn-notification');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            alert('Thông báo đang được phát triển');
        });
    }

    const helpBtn = document.querySelector('.btn-help');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            alert('Trợ giúp đang được phát triển');
        });
    }

    const settingsBtn = document.querySelector('.btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            alert('Cài đặt đang được phát triển');
        });
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                alert('Chức năng đang được phát triển');
            }
        });
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    renderParticipantsTable();
    setupSearch();
    updateStats();
    startActivityFeed();
    setupEventListeners();

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        // Uncomment to enforce authentication
        // window.location.href = 'login.html';
    }
});

// Export functions
window.attendanceModule = {
    renderParticipantsTable,
    updateStats,
    exportToExcel,
    manualCheckIn,
    showParticipantMenu
};
