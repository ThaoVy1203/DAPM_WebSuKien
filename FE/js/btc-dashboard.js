<<<<<<< HEAD
// BTC Dashboard - API Integration (với mock data cho tasks/budget)
let currentUserId = 'ND004'; // Mock BTC user ID
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
=======
// BTC Dashboard JavaScript
const API_BASE = "https://localhost:7160/api";

let dashboardData = {
    stats: {},
    tasks: [],
    budgets: []
};

// ==========================
// KIỂM TRA ĐĂNG NHẬP - TRÁNH VÒNG LẶP
// ==========================
function checkAuth() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");
    
    console.log("checkAuth - token:", !!token, "userData:", !!userData);
    
    if (!token || !userData) {
        console.log("Không có token hoặc userData, chuyển về login");
        window.location.href = "login.html";
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        const vaiTros = user.vaiTros || [];
        console.log("User roles:", vaiTros);
        
        // Kiểm tra có phải BTC không
        const isBTC = vaiTros.includes("TruongBanToChuc") || vaiTros.includes("ThanhVienBanToChuc");
        
        if (!isBTC) {
            console.log("Không phải BTC, chuyển về trang chủ");
            window.location.href = "../index.html";
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error("Lỗi parse userData:", error);
        window.location.href = "login.html";
        return false;
    }
}

// ==========================
// HIỂN THỊ THÔNG TIN USER
// ==========================
function loadUserInfo() {
    const userData = localStorage.getItem("userData");
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const vaiTros = user.vaiTros || [];
        
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = user.hoTen || "Người dùng";
        
        let roleText = "Thành viên BTC";
        if (vaiTros.includes("TruongBanToChuc")) {
            roleText = "Trưởng Ban Tổ chức";
        }
        const userRoleEl = document.getElementById("userRole");
        if (userRoleEl) userRoleEl.textContent = roleText;
        
        const avatarUrl = user.anhDaiDien || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen || "User")}&background=0D5A9C&color=fff`;
        const userAvatar = document.getElementById("userAvatar");
        if (userAvatar) userAvatar.src = avatarUrl;
        
        const welcomeMsg = document.getElementById("welcomeMsg");
        if (welcomeMsg) {
            welcomeMsg.innerHTML = `Chào mừng ${user.hoTen || "bạn"}! Hôm nay là ${new Date().toLocaleDateString("vi-VN")}`;
        }
        
    } catch (error) {
        console.error("Lỗi load user info:", error);
    }
}

// ==========================
// ĐĂNG XUẤT
// ==========================
function logout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "login.html";
}

// ==========================
// MENU DROPDOWN
// ==========================
function setupUserMenu() {
    const userProfile = document.getElementById("userProfile");
    const userDropdown = document.getElementById("userDropdown");
    
    if (userProfile && userDropdown) {
        userProfile.addEventListener("click", function(e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === "none" ? "block" : "none";
        });
        
        document.addEventListener("click", function() {
            userDropdown.style.display = "none";
        });
    }
}

// ==========================
// LOAD DASHBOARD DATA
// ==========================
async function loadDashboardData() {
    try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        
        // Lấy danh sách công việc
        const tasksRes = await fetch(`${API_BASE}/tasks`, { headers });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        
        // Lấy danh sách sự kiện để tính toán
        const eventsRes = await fetch(`${API_BASE}/SuKien`, { headers });
        const events = eventsRes.ok ? await eventsRes.json() : [];
        
        dashboardData.tasks = tasks;
        
        // Tính toán thống kê
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.trangThai === "Hoàn thành" || t.trangThai === "completed").length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
        
        // Cập nhật UI
        const teamMembersEl = document.getElementById("teamMembers");
        if (teamMembersEl) teamMembersEl.textContent = events.length || 0;
        
        const completedTasksEl = document.getElementById("completedTasks");
        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        
        const totalTasksEl = document.getElementById("totalTasks");
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        
        const progressFill = document.getElementById("progressFill");
        if (progressFill) progressFill.style.width = `${progress}%`;
        
        const totalBudget = 150000000;
        const spentBudget = 92450000;
        const remainingBudget = totalBudget - spentBudget;
        const budgetProgress = (spentBudget / totalBudget * 100).toFixed(1);
        
        const totalBudgetEl = document.getElementById("totalBudget");
        if (totalBudgetEl) totalBudgetEl.textContent = formatCurrency(totalBudget);
        
        const spentBudgetEl = document.getElementById("spentBudget");
        if (spentBudgetEl) spentBudgetEl.textContent = formatCurrency(spentBudget);
        
        const remainingBudgetEl = document.getElementById("remainingBudget");
        if (remainingBudgetEl) remainingBudgetEl.textContent = formatCurrency(remainingBudget);
        
        const budgetProgressEl = document.getElementById("budgetProgress");
        if (budgetProgressEl) budgetProgressEl.textContent = `${budgetProgress}% hoàn thành`;
        
        // Render danh sách công việc
        renderTasks(tasks.slice(0, 5));
        
    } catch (error) {
        console.error("Dashboard load error:", error);
        // Hiển thị dữ liệu mẫu nếu API lỗi
        renderSampleData();
    }
}

function renderTasks(tasks) {
    const taskContainer = document.getElementById("taskList");
    if (!taskContainer) return;
    
    if (!tasks || tasks.length === 0) {
        taskContainer.innerHTML = '<div class="loading">Chưa có công việc nào</div>';
        return;
    }
    
    taskContainer.innerHTML = "";
    tasks.forEach(task => {
        const statusClass = task.trangThai === "Hoàn thành" || task.trangThai === "completed" ? "completed" : 
                           (task.trangThai === "Quá hạn" || task.trangThai === "overdue" ? "overdue" : "pending");
        const statusText = task.trangThai === "Hoàn thành" ? "HOÀN THÀNH" :
                          (task.trangThai === "Quá hạn" ? "QUÁ HẠN" : "ĐANG LÀM");
        
        taskContainer.innerHTML += `
            <div class="task-item">
                <div class="task-info">
                    <h4>${task.tenCongViec || task.tieuDe || "Chưa có tên"}</h4>
                    <p>${task.moTa || ""}</p>
                </div>
                <div class="task-assignee">
                    <span>${task.nguoiPhuTrach || "Chưa phân công"}</span>
                </div>
                <div class="task-date">${task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Chưa có"}</div>
                <span class="task-status ${statusClass}">${statusText}</span>
                <button class="btn-more" onclick="console.log('More options')"><i class="fas fa-ellipsis-h"></i></button>
            </div>
        `;
    });
}

function renderSampleData() {
    const taskContainer = document.getElementById("taskList");
    if (!taskContainer) return;
    
    taskContainer.innerHTML = `
        <div class="task-item">
            <div class="task-info">
                <h4>Thiết kế thanh âm trang</h4>
                <p>Ban hậu cần</p>
            </div>
            <div class="task-assignee">
                <span>Trần Hoàng M.</span>
            </div>
            <div class="task-date">24/10/2024</div>
            <span class="task-status pending">ĐANG LÀM</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="task-item">
            <div class="task-info">
                <h4>Thiết kế Backdrop</h4>
                <p>Ban truyền thông</p>
            </div>
            <div class="task-assignee">
                <span>Lê Thị B.</span>
            </div>
            <div class="task-date">20/10/2024</div>
            <span class="task-status completed">HOÀN THÀNH</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="task-item">
            <div class="task-info">
                <h4>Gửi thư mời Đại biểu</h4>
                <p>Ban đối ngoại</p>
            </div>
            <div class="task-assignee">
                <span>Phạm Hải Y.</span>
            </div>
            <div class="task-date danger">15/10/2024</div>
            <span class="task-status overdue">QUÁ HẠN</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
    `;
}

// ==========================
// CÁC HÀM CHỨC NĂNG
// ==========================
function exportReport() {
    alert("Đang xuất báo cáo...");
}

function submitBudgetApproval() {
    alert("Đã gửi yêu cầu phê duyệt ngân sách!");
}

function filterBudget() {
    alert("Lọc ngân sách");
}

function downloadBudget() {
    alert("Đang tải báo cáo ngân sách...");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(amount);
}

// ==========================
// KHỞI TẠO
// ==========================
document.addEventListener("DOMContentLoaded", function() {
    // Kiểm tra đăng nhập - nếu không hợp lệ sẽ tự redirect
    if (!checkAuth()) return;
    
    loadUserInfo();
    setupUserMenu();
    loadDashboardData();
});
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
