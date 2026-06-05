// BTC Dashboard JavaScript

// Gộp chuẩn logic khai báo biến từ nhánh ThaoVy
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
}

let dashboardData = {
    events: [],
    selectedEventId: null,
    stats: {},
    tasks: [],
    budgets: []
};

// ==========================
// KIỂM TRA ĐĂNG NHẬP
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
        const vaiTros = user.vaiTros || user.VaiTros || [];
        console.log("User roles:", vaiTros);

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
        const vaiTros = user.vaiTros || user.VaiTros || [];

        const userNameEl = document.getElementById("userName") || document.querySelector('.user-name');
        if (userNameEl) userNameEl.textContent = user.hoTen || user.HoTen || "Người dùng";

        let roleText = "Thành viên BTC";
        if (vaiTros.includes("TruongBanToChuc")) roleText = "Trưởng Ban Tổ chức";
        const userRoleEl = document.getElementById("userRole") || document.querySelector('.user-role');
        if (userRoleEl) userRoleEl.textContent = roleText;

        const avatarUrl = user.anhDaiDien || user.AnhDaiDien ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen || user.HoTen || "User")}&background=0D5A9C&color=fff`;
        const userAvatar = document.getElementById("userAvatar");
        if (userAvatar) userAvatar.src = avatarUrl;

        const welcomeMsg = document.getElementById("welcomeMsg");
        if (welcomeMsg) {
            welcomeMsg.innerHTML = `Chào mừng ${user.hoTen || user.HoTen || "bạn"}! Hôm nay là ${new Date().toLocaleDateString("vi-VN")}`;
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
        userProfile.addEventListener("click", function (e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === "none" ? "block" : "none";
        });

        document.addEventListener("click", function () {
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

        const tasksRes = await fetch(`${window.API_BASE}/tasks`, { headers });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];

        const eventsRes = await fetch(`${window.API_BASE}/SuKien`, { headers });
        const events = eventsRes.ok ? await eventsRes.json() : [];

        dashboardData.tasks = tasks;
        dashboardData.events = events;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t =>
            t.trangThai === "Hoàn thành" || t.trangThai === "completed"
        ).length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

        // Stats
        const teamMembersEl = document.getElementById("teamMembers");
        if (teamMembersEl) teamMembersEl.textContent = events.length || 0;

        const completedTasksEl = document.getElementById("completedTasks");
        if (completedTasksEl) completedTasksEl.textContent = completedTasks;

        const totalTasksEl = document.getElementById("totalTasks");
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;

        const progressFill = document.getElementById("progressFill") || document.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Budget (mock data — cần API /api/NganSach trong tương lai)
        const totalBudget = 150000000;
        const spentBudget = 92450000;
        const remainingBudget = totalBudget - spentBudget;
        const budgetProgress = (spentBudget / totalBudget * 100).toFixed(1);

        const totalBudgetEl = document.getElementById("totalBudget") || document.querySelector('.stat-budget');
        if (totalBudgetEl) totalBudgetEl.textContent = formatCurrency(totalBudget);

        const spentBudgetEl = document.getElementById("spentBudget") || document.querySelector('.budget-item:nth-child(1) .amount');
        if (spentBudgetEl) spentBudgetEl.textContent = formatCurrency(spentBudget);

        const remainingBudgetEl = document.getElementById("remainingBudget") || document.querySelector('.budget-item:nth-child(2) .amount');
        if (remainingBudgetEl) remainingBudgetEl.textContent = formatCurrency(remainingBudget);

        const budgetProgressEl = document.getElementById("budgetProgress");
        if (budgetProgressEl) budgetProgressEl.textContent = `${budgetProgress}% hoàn thành`;

        renderTasks(tasks.slice(0, 5));

    } catch (error) {
        console.error("Dashboard load error:", error);
        renderSampleData();
    }
}

// ==========================
// RENDER TASKS
// ==========================
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
                <button class="btn-more" onclick="console.log('More options')">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
        `;
    });
}

function renderSampleData() {
    const taskContainer = document.getElementById("taskList");
    if (!taskContainer) return;

    taskContainer.innerHTML = `
        <div class="task-item">
            <div class="task-info"><h4>Thiết kế thanh âm trang</h4><p>Ban hậu cần</p></div>
            <div class="task-assignee"><span>Trần Hoàng M.</span></div>
            <div class="task-date">24/10/2024</div>
            <span class="task-status pending">ĐANG LÀM</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="task-item">
            <div class="task-info"><h4>Thiết kế Backdrop</h4><p>Ban truyền thông</p></div>
            <div class="task-assignee"><span>Lê Thị B.</span></div>
            <div class="task-date">20/10/2024</div>
            <span class="task-status completed">HOÀN THÀNH</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="task-item">
            <div class="task-info"><h4>Gửi thư mời Đại biểu</h4><p>Ban đối ngoại</p></div>
            <div class="task-assignee"><span>Phạm Hải Y.</span></div>
            <div class="task-date danger">15/10/2024</div>
            <span class="task-status overdue">QUÁ HẠN</span>
            <button class="btn-more"><i class="fas fa-ellipsis-h"></i></button>
        </div>
    `;
}

// ==========================
// EVENT HANDLERS
// ==========================
function initializeEventHandlers() {
    const createBtn = document.querySelector('.btn-create');
    if (createBtn) createBtn.addEventListener('click', () => {
        alert('Tính năng tạo sự kiện mới đang được phát triển');
    });

    const reportBtn = document.querySelector('.btn-secondary');
    if (reportBtn) reportBtn.addEventListener('click', exportReport);

    const budgetBtn = document.querySelector('.btn-primary');
    if (budgetBtn) budgetBtn.addEventListener('click', submitBudgetApproval);

    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => alert('Đã phê duyệt yêu cầu'));
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => alert('Đã từ chối yêu cầu'));
    });

    document.querySelectorAll('.btn-view-detail').forEach(btn => {
        btn.addEventListener('click', () => alert('Tính năng xem chi tiết đang được phát triển'));
    });
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
document.addEventListener("DOMContentLoaded", function () {
    if (!checkAuth()) return;

    loadUserInfo();
    setupUserMenu();
    loadDashboardData();
    initializeEventHandlers();
});
