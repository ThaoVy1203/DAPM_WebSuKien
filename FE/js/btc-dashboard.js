// BTC Dashboard - API Integration (với mock data cho tasks/budget)
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let currentUserId = currentUser.idNguoiDung || 'ND004';
let myEvents = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('BTC Dashboard loaded');
    
    // Load user data
    await loadUserData();
    
    // Load events managed by this BTC
    await loadMyEvents();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load user data
async function loadUserData() {
    try {
        const user = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(currentUserId));
        
        // Update user name in header
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.hoTen;
        }
        
        // Update user role
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement && user.vaiTros && user.vaiTros.length > 0) {
            userRoleElement.textContent = user.vaiTros[0];
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load events managed by this BTC
async function loadMyEvents() {
    try {
        // Load all events (in real app, filter by BTC user)
        const allEvents = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        
        // For demo, take first 3 events
        myEvents = allEvents.slice(0, 3);
        
        console.log('My events:', myEvents);
        
        // Update statistics with real data
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading events:', error);
        // Use mock data if API fails
        updateStatistics();
    }
}

// Update statistics
function updateStatistics() {
    // Team members count (mock)
    const teamCount = 48;
    const teamElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (teamElement) {
        teamElement.textContent = teamCount;
    }
    
    // Task progress (mock)
    const completedTasks = 156;
    const totalTasks = 182;
    const taskElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (taskElement) {
        taskElement.innerHTML = `${completedTasks}<span class="stat-total">/${totalTasks}</span>`;
    }
    
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        const percentage = (completedTasks / totalTasks) * 100;
        progressBar.style.width = percentage + '%';
    }
    
    // Budget (mock)
    const totalBudget = 150000000;
    const spent = 92450000;
    const remaining = totalBudget - spent;
    
    const budgetElement = document.querySelector('.stat-budget');
    if (budgetElement) {
        budgetElement.textContent = totalBudget.toLocaleString('vi-VN') + ' đ';
    }
    
    const spentElement = document.querySelector('.budget-item:nth-child(1) .amount');
    if (spentElement) {
        spentElement.textContent = spent.toLocaleString('vi-VN') + ' đ';
    }
    
    const remainingElement = document.querySelector('.budget-item:nth-child(2) .amount');
    if (remainingElement) {
        remainingElement.textContent = remaining.toLocaleString('vi-VN') + ' đ';
    }
}

// Initialize event handlers
function initializeEventHandlers() {
    // Create event button
    const createBtn = document.querySelector('.btn-create');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            alert('Tính năng tạo sự kiện mới đang được phát triển');
        });
    }
    
    // Send report button
    const reportBtn = document.querySelector('.btn-secondary');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            alert('Tính năng gửi báo cáo đang được phát triển');
        });
    }
    
    // Send budget approval button
    const budgetBtn = document.querySelector('.btn-primary');
    if (budgetBtn) {
        budgetBtn.addEventListener('click', () => {
            alert('Tính năng gửi phê duyệt ngân sách đang được phát triển');
        });
    }
    
    // Task more buttons
    const moreButtons = document.querySelectorAll('.btn-more');
    moreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Tính năng quản lý task đang được phát triển');
        });
    });
    
    // Approval buttons
    const approveButtons = document.querySelectorAll('.btn-approve');
    approveButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Đã phê duyệt yêu cầu');
        });
    });
    
    const rejectButtons = document.querySelectorAll('.btn-reject');
    rejectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Đã từ chối yêu cầu');
        });
    });
    
    // View detail buttons
    const detailButtons = document.querySelectorAll('.btn-view-detail');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Tính năng xem chi tiết đang được phát triển');
        });
    });
}

// Note: Tasks, Budget, Approvals sẽ cần API riêng trong tương lai
// Hiện tại sử dụng mock data để demo giao diện
console.log('BTC Dashboard: Sử dụng mock data cho Tasks, Budget, Approvals');
console.log('Cần tạo API endpoints:');
console.log('- GET /api/CongViec (Tasks)');
console.log('- GET /api/NganSach (Budget)');
console.log('- GET /api/PheDuyet (Approvals)');
