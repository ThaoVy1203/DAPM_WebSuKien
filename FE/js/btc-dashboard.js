// Admin Dashboard JavaScript

// Sample data
const dashboardData = {
    stats: {
        teamMembers: 48,
        tasksCompleted: 156,
        tasksTotal: 182,
        totalBudget: 150000000,
        spentBudget: 92450000,
        remainingBudget: 57550000
    },
    tasks: [
        {
            id: 1,
            name: 'Thiết kế thanh âm trang',
            project: 'Sơn Thuyên Hương',
            assignee: 'Trần Hoàng M.',
            dueDate: '24/10/2024',
            status: 'pending'
        },
        {
            id: 2,
            name: 'Thiết kế Backdrop',
            project: 'Sơn Thuyên Hương',
            assignee: 'Lê Thị B.',
            dueDate: '20/10/2024',
            status: 'completed'
        },
        {
            id: 3,
            name: 'Gửi thư mời Đại biểu',
            project: 'Sơn Thuyên Hương',
            assignee: 'Phạm Hải Y.',
            dueDate: '15/10/2024',
            status: 'overdue'
        }
    ]
};

// Initialize dashboard
function initDashboard() {
    updateStats();
    setupEventListeners();
    startAutoRefresh();
}

// Update statistics
function updateStats() {
    const stats = dashboardData.stats;
    
    // Update progress percentage
    const progressPercentage = (stats.tasksCompleted / stats.tasksTotal * 100).toFixed(1);
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = progressPercentage + '%';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Create event button
    const createBtn = document.querySelector('.btn-create');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            alert('Chức năng tạo sự kiện mới đang được phát triển');
        });
    }

    // Approval buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn phê duyệt yêu cầu này?')) {
                alert('Đã phê duyệt thành công!');
                this.closest('.approval-item').style.opacity = '0.5';
            }
        });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
                alert('Đã từ chối yêu cầu!');
                this.closest('.approval-item').style.opacity = '0.5';
            }
        });
    });

    // View detail button
    document.querySelectorAll('.btn-view-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Chức năng xem chi tiết đang được phát triển');
        });
    });

    // Task more button
    document.querySelectorAll('.btn-more').forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Chức năng quản lý nhiệm vụ đang được phát triển');
        });
    });

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                alert('Chức năng đang được phát triển');
            }
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Export report button
    const exportBtn = document.querySelector('.btn-secondary');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Đang xuất báo cáo...');
        });
    }

    // Submit budget button
    const submitBudgetBtn = document.querySelector('.btn-primary');
    if (submitBudgetBtn) {
        submitBudgetBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn gửi phê duyệt ngân sách?')) {
                alert('Đã gửi yêu cầu phê duyệt ngân sách thành công!');
            }
        });
    }

    // Notification button
    const notificationBtn = document.querySelector('.btn-notification');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới');
        });
    }

    // User profile
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            alert('Menu người dùng đang được phát triển');
        });
    }
}

// Auto refresh data
function startAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(function() {
        console.log('Refreshing dashboard data...');
        // Here you would fetch new data from the API
        updateStats();
    }, 30000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Calculate budget percentage
function calculateBudgetPercentage() {
    const stats = dashboardData.stats;
    return (stats.spentBudget / stats.totalBudget * 100).toFixed(1);
}

// Add new task
function addTask(task) {
    dashboardData.tasks.push(task);
    // Re-render task list
    console.log('Task added:', task);
}

// Update task status
function updateTaskStatus(taskId, newStatus) {
    const task = dashboardData.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        console.log('Task status updated:', task);
    }
}

// Load user data
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.name) {
        const userName = document.querySelector('.user-name');
        if (userName) {
            userName.textContent = user.name;
        }
    }
    
    if (user.role) {
        const userRole = document.querySelector('.user-role');
        if (userRole) {
            userRole.textContent = user.role;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    loadUserData();

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        // Uncomment to enforce authentication
        // window.location.href = 'login.html';
    }
});

// Export functions
window.dashboardModule = {
    updateStats,
    addTask,
    updateTaskStatus,
    formatCurrency,
    calculateBudgetPercentage
};
