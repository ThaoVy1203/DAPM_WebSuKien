// BTC Dashboard JavaScript
const API_BASE = "https://localhost:7160/api";

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
    
    if (!token || !userData) {
        window.location.href = "login.html";
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        const vaiTros = user.vaiTros || [];
        const isBTC = vaiTros.includes("TruongBanToChuc") || vaiTros.includes("ThanhVienBanToChuc");
        
        if (!isBTC) {
            window.location.href = "../index.html";
            return false;
        }
        return true;
    } catch (error) {
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
// LOAD EVENTS & INITIALIZE SELECTOR
// ==========================
async function loadEventsSelector() {
    const selector = document.getElementById("eventSelector");
    if (!selector) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Không thể tải danh sách sự kiện");
        
        const events = await res.json();
        dashboardData.events = events;

        if (events.length === 0) {
            selector.innerHTML = '<option value="">-- Chưa có sự kiện --</option>';
            document.getElementById("welcomeMsg").textContent = "Bạn chưa có sự kiện nào được tạo.";
            return;
        }

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Đọc sự kiện đã chọn trước đó của trang dashboard từ localStorage
        let savedId = localStorage.getItem("btc_dashboard_selected_event_id");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            dashboardData.selectedEventId = savedId;
        } else {
            selector.value = events[0].idSuKien;
            dashboardData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_dashboard_selected_event_id", events[0].idSuKien);
        }

        // Đăng ký sự kiện change
        selector.addEventListener("change", function() {
            const eventId = this.value;
            dashboardData.selectedEventId = eventId;
            localStorage.setItem("btc_dashboard_selected_event_id", eventId);
            loadDashboardData();
        });

    } catch (error) {
        console.error("Lỗi load events selector:", error);
        selector.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    }
}

// ==========================
// LOAD DASHBOARD DATA FOR SELECTED EVENT
// ==========================
async function loadDashboardData() {
    const eventId = dashboardData.selectedEventId;
    if (!eventId) {
        renderSampleData();
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        // 1. Cập nhật thông tin sự kiện
        const eventRes = await fetch(`${API_BASE}/SuKien/${eventId}`, { headers });
        let eventName = "Sự kiện";
        if (eventRes.ok) {
            const eventInfo = await eventRes.json();
            eventName = eventInfo.tenSuKien;
            const welcomeMsg = document.getElementById("welcomeMsg");
            if (welcomeMsg) {
                welcomeMsg.innerHTML = `Sự kiện: <strong>${eventInfo.tenSuKien}</strong> | Trạng thái: <span class="status-badge ${eventInfo.trangThai}">${eventInfo.trangThai}</span>`;
            }
        }

        // 2. Lấy danh sách công việc của sự kiện
        const tasksRes = await fetch(`${API_BASE}/tasks/su-kien/${eventId}`, { headers });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        dashboardData.tasks = tasks;

        // Tính toán thống kê công việc
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.trangThai === "Hoàn thành" || t.trangThai === "completed").length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

        // Cập nhật UI công việc
        const completedTasksEl = document.getElementById("completedTasks");
        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        
        const totalTasksEl = document.getElementById("totalTasks");
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        
        const progressFill = document.getElementById("progressFill");
        if (progressFill) progressFill.style.width = `${progress}%`;

        // 3. Lấy danh sách người đăng ký của sự kiện
        const regRes = await fetch(`${API_BASE}/DangKy/su-kien/${eventId}`, { headers });
        const registrations = regRes.ok ? await regRes.json() : [];
        
        const teamMembersEl = document.getElementById("teamMembers");
        if (teamMembersEl) teamMembersEl.textContent = registrations.length || 0;

        // 4. Mock/Load dữ liệu ngân sách theo sự kiện
        // Vì NganSachController trả về dummy, chúng ta sẽ mô phỏng dữ liệu ngân sách persistent theo eventId trong localStorage
        let budgetStr = localStorage.getItem(`budget_event_${eventId}`);
        let budgetData;
        if (budgetStr) {
            budgetData = JSON.parse(budgetStr);
        } else {
            // Khởi tạo ngân sách mặc định ngẫu nhiên/hợp lý dựa trên eventId
            const total = 50000000 + (eventId % 5) * 30000000;
            const spent = (total * 0.6).toFixed(0);
            budgetData = {
                total: parseInt(total),
                spent: parseInt(spent),
                items: [
                    { name: "Thuê hội trường & Âm thanh", category: "venue", amount: parseInt(total * 0.4) },
                    { name: "Teabreak & Nước uống", category: "food", amount: parseInt(total * 0.15) },
                    { name: "In ấn banner & Backdrop", category: "marketing", amount: parseInt(total * 0.1) }
                ]
            };
            localStorage.setItem(`budget_event_${eventId}`, JSON.stringify(budgetData));
        }

        const totalBudget = budgetData.total;
        const spentBudget = budgetData.spent;
        const remainingBudget = totalBudget - spentBudget;
        const budgetProgress = (spentBudget / totalBudget * 100).toFixed(1);

        const totalBudgetEl = document.getElementById("totalBudget");
        if (totalBudgetEl) totalBudgetEl.textContent = formatCurrency(totalBudget);
        
        const spentBudgetEl = document.getElementById("spentBudget");
        if (spentBudgetEl) spentBudgetEl.textContent = formatCurrency(spentBudget);
        
        const remainingBudgetEl = document.getElementById("remainingBudget");
        if (remainingBudgetEl) remainingBudgetEl.textContent = formatCurrency(remainingBudget);
        
        const budgetProgressEl = document.getElementById("budgetProgress");
        if (budgetProgressEl) budgetProgressEl.textContent = `${budgetProgress}% đã chi`;

        // Render danh sách ngân sách ở Dashboard
        renderBudgetList(budgetData.items);

        // Render danh sách công việc
        renderTasks(tasks.slice(0, 5));

        // Render danh sách phê duyệt (mock theo sự kiện)
        renderApprovalList(eventId);

        // Render hoạt động gần đây (mock)
        renderActivities(tasks);

    } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
        renderSampleData();
    }
}

function renderTasks(tasks) {
    const taskContainer = document.getElementById("taskList");
    if (!taskContainer) return;
    
    if (!tasks || tasks.length === 0) {
        taskContainer.innerHTML = '<div class="loading">Sự kiện này chưa có công việc nào</div>';
        return;
    }
    
    taskContainer.innerHTML = "";
    tasks.forEach(task => {
        const isDone = task.trangThai === "Hoàn thành" || task.trangThai === "completed" || task.trangThai === "done";
        const statusClass = isDone ? "completed" : "pending";
        const statusText = isDone ? "HOÀN THÀNH" : "ĐANG LÀM";
        
        taskContainer.innerHTML += `
            <div class="task-item">
                <div class="task-info">
                    <h4>${task.tieuDe || task.tenCongViec || "Nhiệm vụ"}</h4>
                    <p>${task.moTa || "Chưa có mô tả chi tiết"}</p>
                </div>
                <div class="task-assignee">
                    <span>${task.nguoiPhuTrach || "Chưa phân công"}</span>
                </div>
                <div class="task-date">${task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Không có"}</div>
                <span class="task-status ${statusClass}">${statusText}</span>
                <button class="btn-more" onclick="window.location.href='btc-team-tasks.html'"><i class="fas fa-arrow-right"></i></button>
            </div>
        `;
    });
}

function renderBudgetList(items) {
    const container = document.getElementById("budgetList");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="loading">Chưa có kế hoạch chi phí</div>';
        return;
    }

    container.innerHTML = "";
    items.forEach((item, index) => {
        const icons = {
            venue: { class: "blue", icon: "fa-building" },
            food: { class: "purple", icon: "fa-cookie-bite" },
            marketing: { class: "blue", icon: "fa-ad" },
            other: { class: "purple", icon: "fa-coins" }
        };
        const config = icons[item.category] || icons.other;

        container.innerHTML += `
            <div class="budget-item-card">
                <div class="budget-icon ${config.class}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="budget-info">
                    <h4>${item.name}</h4>
                    <p>Hạng mục chi tiết sự kiện</p>
                </div>
                <div class="budget-amount">
                    <div class="amount-value">${formatCurrency(item.amount)} đ</div>
                    <div class="amount-status success">Đã phân bổ</div>
                </div>
            </div>
        `;
    });
}

function renderApprovalList(eventId) {
    const container = document.getElementById("approvalList");
    if (!container) return;

    container.innerHTML = `
        <div class="approval-item">
            <span class="approval-badge">Đang chờ</span>
            <h4>Duyệt kinh phí teabreak</h4>
            <p>Yêu cầu bởi Ban Hậu cần</p>
            <div class="approval-amount">7,500,000 đ</div>
            <div class="approval-actions">
                <button class="btn-approve" onclick="window.location.href='btc-approval.html'">Đến phê duyệt</button>
            </div>
        </div>
    `;
}

function renderActivities(tasks) {
    const container = document.getElementById("activityList");
    if (!container) return;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<div class="loading">Không có hoạt động gần đây</div>';
        return;
    }

    container.innerHTML = "";
    tasks.slice(0, 3).forEach(t => {
        container.innerHTML += `
            <div class="approval-item">
                <p class="approval-note"><strong>Nhiệm vụ:</strong> ${t.tieuDe || t.tenCongViec}</p>
                <p class="approval-note">Trạng thái hiện tại: <strong>${t.trangThai}</strong></p>
            </div>
        `;
    });
}

function renderSampleData() {
    const taskContainer = document.getElementById("taskList");
    if (taskContainer) taskContainer.innerHTML = '<div class="loading">Vui lòng chọn sự kiện để xem dữ liệu</div>';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(amount).replace("₫", "đ");
}

// ==========================
// KHỞI TẠO
// ==========================
document.addEventListener("DOMContentLoaded", async function() {
    if (!checkAuth()) return;
    
    loadUserInfo();
    setupUserMenu();
    await loadEventsSelector();
    await loadDashboardData();
});