// BTC Dashboard JavaScript

if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
}

let dashboardData = {
    events: [],
    selectedEventId: null,
    tasks: [],
    currentTaskDetail: null
};

// ==========================
// KIỂM TRA ĐĂNG NHẬP
// ==========================
function checkAuth() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");
    if (!token || !userData) { window.location.href = "login.html"; return false; }
    try {
        const user = JSON.parse(userData);
        const vaiTros = user.vaiTros || user.VaiTros || [];
        const isBTC = vaiTros.includes("TruongBanToChuc") || vaiTros.includes("ThanhVienBanToChuc");
        if (!isBTC) { window.location.href = "../index.html"; return false; }
        return true;
    } catch (error) { window.location.href = "login.html"; return false; }
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
        const isTruongBan = vaiTros.includes("TruongBanToChuc");

        const userName = user.hoTen || user.HoTen || "Người dùng";
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = userName;

        let roleText = "Thành viên BTC";
        if (isTruongBan) roleText = "Trưởng Ban Tổ chức";
        const userRoleEl = document.getElementById("userRole");
        if (userRoleEl) userRoleEl.textContent = roleText;

        // Dynamic Role Badge matching btc-auth.js
        const userInfoEl = document.querySelector('.user-info');
        if (userInfoEl) {
            userInfoEl.querySelector('.role-badge')?.remove();
            const badge = document.createElement('span');
            badge.className = 'role-badge ' + (isTruongBan ? 'leader' : 'member');
            badge.textContent = isTruongBan ? 'Trưởng ban' : 'Thành viên';
            userInfoEl.appendChild(badge);
        }

        const avatarUrl = user.anhDaiDien || user.AnhDaiDien ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D5A9C&color=fff`;
        const userAvatar = document.getElementById("userAvatar");
        if (userAvatar) userAvatar.src = avatarUrl;

        const welcomeMsg = document.getElementById("welcomeMsg");
        if (welcomeMsg) welcomeMsg.innerHTML = `Chào mừng ${userName}! Hôm nay là ${new Date().toLocaleDateString("vi-VN")}`;
    } catch (error) { console.error("Lỗi load user info:", error); }
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
            if (userDropdown) userDropdown.style.display = "none";
        });
    }
}

// ==========================
// LOAD STATS
// ==========================
async function loadStats() {
    try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        // Load sự kiện của user hiện tại
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userId = userData.idNguoiDung;
        const eventsUrl = `${window.API_BASE}/SuKien`;

        const eventsRes = await fetch(eventsUrl, { headers });
        const events = eventsRes.ok ? await eventsRes.json() : [];
        dashboardData.events = Array.isArray(events) ? events : [];

        // Đếm thành viên từ thanhVienBTCs của sự kiện đầu tiên
        let memberCount = 0;
        if (dashboardData.events.length > 0) {
            const firstEvent = dashboardData.events[0];
            memberCount = firstEvent.thanhVienBTCs?.length || 0;
        }
        setElText("teamMembers", memberCount);

        // Load tasks theo sự kiện đang chọn
        const savedEventId = localStorage.getItem("btc_tasks_selected_event_id") ||
            (dashboardData.events[0]?.idSuKien);

        let tasks = [];
        if (savedEventId) {
            const tasksRes = await fetch(`${window.API_BASE}/tasks/su-kien/${savedEventId}`, { headers });
            tasks = tasksRes.ok ? await tasksRes.json() : [];
        }
        dashboardData.tasks = Array.isArray(tasks) ? tasks : [];

        const totalTasks = dashboardData.tasks.length;
        const completedTasks = dashboardData.tasks.filter(t =>
            (t.trangThai || "").toLowerCase().includes("hoàn") || t.trangThai === "done"
        ).length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
        setElText("completedTasks", completedTasks);
        setElText("totalTasks", totalTasks);
        const pf = document.getElementById("progressFill");
        if (pf) pf.style.width = `${progress}%`;

        // Load ngân sách từ API (sự kiện đang chọn)
        if (savedEventId) {
            try {
                const budgetRes = await fetch(`${window.API_BASE}/NganSach/su-kien/${savedEventId}`, { headers });
                if (budgetRes.ok) {
                    const budget = await budgetRes.json();
                    const total = budget.tongNganSach || 0;
                    const spent = budget.daChi || 0;
                    const remaining = budget.conLai ?? (total - spent);
                    const pct = total > 0 ? (spent / total * 100).toFixed(1) : 0;
                    setElText("totalBudget", formatCurrency(total));
                    setElText("spentBudget", formatCurrency(spent));
                    setElText("remainingBudget", formatCurrency(remaining));
                    setElText("budgetProgress", `${pct}% hoàn thành`);
                }
            } catch (e) {
                console.warn("Không load được ngân sách:", e);
            }
        }

        renderRecentActivity(dashboardData.tasks);
    } catch (error) { console.error("Stats load error:", error); }
}

// ==========================
// LOAD EVENTS VÀO DROPDOWN
// ==========================
async function loadDashTaskEventSelector() {
    const selector = document.getElementById("dashTaskEventSelector");
    if (!selector) return;
    try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userId = userData.idNguoiDung;
        const url = `${window.API_BASE}/SuKien`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Lỗi tải sự kiện");
        const events = await res.json();
        dashboardData.events = Array.isArray(events) ? events : [];

        selector.innerHTML = '<option value="">-- Chọn sự kiện để xem nhiệm vụ --</option>';
        dashboardData.events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        const savedId = localStorage.getItem("btc_tasks_selected_event_id");
        const defaultId = savedId && dashboardData.events.some(ev => ev.idSuKien == savedId)
            ? savedId
            : (dashboardData.events[0]?.idSuKien);

        if (defaultId) {
            selector.value = defaultId;
            dashboardData.selectedEventId = defaultId;
            await loadTasksByEvent(defaultId);
            await loadBudgetForEvent(defaultId);
        }

        selector.addEventListener("change", async function() {
            const eventId = this.value;
            dashboardData.selectedEventId = eventId;
            if (eventId) {
                localStorage.setItem("btc_tasks_selected_event_id", eventId);
                await loadTasksByEvent(eventId);
                await loadBudgetForEvent(eventId);
            } else {
                showEmptyTaskState("Chọn sự kiện để xem nhiệm vụ");
                const th = document.getElementById("taskTableHeader");
                if (th) th.style.display = "none";
            }
        });
    } catch (error) {
        console.error("Lỗi load event selector:", error);
        if (selector) selector.innerHTML = '<option value="">Không tải được sự kiện</option>';
    }
}

// ==========================
// LOAD BUDGET THEO SỰ KIỆN
// ==========================
async function loadBudgetForEvent(eventId) {
    if (!eventId) return;
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/NganSach/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const budget = await res.json();
        const total = budget.tongNganSach || 0;
        const spent = budget.daChi || 0;
        const remaining = budget.conLai ?? (total - spent);
        const pct = total > 0 ? (spent / total * 100).toFixed(1) : 0;
        setElText("totalBudget", formatCurrency(total));
        setElText("spentBudget", formatCurrency(spent));
        setElText("remainingBudget", formatCurrency(remaining));
        setElText("budgetProgress", `${pct}% hoàn thành`);
    } catch (e) {
        console.warn("Không load được ngân sách:", e);
    }
}

// ==========================
// LOAD TASKS THEO SỰ KIỆN
// ==========================
async function loadTasksByEvent(eventId) {
    const taskContainer = document.getElementById("taskList");
    const tableHeader = document.getElementById("taskTableHeader");
    if (!taskContainer) return;
    taskContainer.innerHTML = `<div class="loading" style="padding:24px;text-align:center;color:#888;"><i class="fas fa-spinner fa-spin" style="font-size:20px;margin-bottom:8px;display:block;"></i>Đang tải nhiệm vụ...</div>`;
    if (tableHeader) tableHeader.style.display = "none";
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/tasks/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Lỗi tải tasks");
        const tasks = await res.json();
        dashboardData.tasks = tasks;
        renderTaskList(tasks);
    } catch (error) {
        console.error("Lỗi load tasks:", error);
        showEmptyTaskState("Không tải được dữ liệu. Vui lòng thử lại.");
    }
}

// ==========================
// RENDER TASK LIST
// ==========================
function renderTaskList(tasks) {
    const taskContainer = document.getElementById("taskList");
    const tableHeader = document.getElementById("taskTableHeader");
    if (!taskContainer) return;
    if (!tasks || tasks.length === 0) {
        if (tableHeader) tableHeader.style.display = "none";
        showEmptyTaskState("Sự kiện này chưa có nhiệm vụ nào.");
        return;
    }
    if (tableHeader) tableHeader.style.display = "grid";
    taskContainer.innerHTML = "";
    tasks.slice(0, 7).forEach(task => {
        const statusInfo = getStatusInfo(task.trangThai);
        const assignee = task.nguoiPhuTrach || "Chưa phân công";
        const deadlineText = task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Chưa đặt";
        const isOverdue = task.hanChot && new Date(task.hanChot) < new Date() && statusInfo.key !== "done";
        const dateStyle = isOverdue ? "color:#EF4444;font-weight:600;" : "";
        const div = document.createElement("div");
        div.className = "task-item";
        div.style.cursor = "pointer";
        div.title = "Nhấn để xem chi tiết";
        div.innerHTML = `
            <div class="task-info">
                <h4 title="${task.tieuDe || ''}">${task.tieuDe || task.tenCongViec || "Chưa có tên"}</h4>
                <p>${task.moTa || "—"}</p>
            </div>
            <div class="task-assignee">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(assignee)}&background=0D5A9C&color=fff&size=32" alt="${assignee}">
                <span>${assignee}</span>
            </div>
            <div class="task-date" style="${dateStyle}">${isOverdue ? '<i class="fas fa-exclamation-circle" style="margin-right:4px;color:#EF4444;"></i>' : ''}${deadlineText}</div>
            <span class="task-status ${statusInfo.cssClass}">${statusInfo.label}</span>
            <button class="btn-more" title="Xem chi tiết" style="color:#0D5A9C;"><i class="fas fa-eye"></i></button>
        `;
        div.addEventListener("click", () => openDashTaskDetail(task));
        taskContainer.appendChild(div);
    });
    if (tasks.length > 7) {
        const moreDiv = document.createElement("div");
        moreDiv.style.cssText = "text-align:center;padding:12px 0 4px;";
        moreDiv.innerHTML = `<a href="btc-team-tasks.html" style="color:#0D5A9C;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-list"></i> Xem tất cả ${tasks.length} nhiệm vụ</a>`;
        taskContainer.appendChild(moreDiv);
    }
}

function showEmptyTaskState(msg) {
    const taskContainer = document.getElementById("taskList");
    if (!taskContainer) return;
    taskContainer.innerHTML = `<div style="padding:40px 20px;text-align:center;color:#aaa;"><i class="fas fa-inbox" style="font-size:36px;margin-bottom:10px;display:block;opacity:.35;"></i><p style="font-size:14px;">${msg}</p></div>`;
}

function getStatusInfo(trangThai) {
    const s = (trangThai || "").toLowerCase();
    if (s.includes("hoàn") || s === "done" || s === "completed") return { key:"done", cssClass:"completed", label:"HOÀN THÀNH" };
    if (s.includes("tiến") || s.includes("đang") || s === "in-progress") return { key:"inprogress", cssClass:"pending", label:"ĐANG LÀM" };
    if (s.includes("xem") || s === "review") return { key:"review", cssClass:"pending", label:"XEM XÉT" };
    if (s.includes("quá") || s === "overdue") return { key:"overdue", cssClass:"overdue", label:"QUÁ HẠN" };
    return { key:"todo", cssClass:"pending", label:"CẦN LÀM" };
}

// ==========================
// MODAL CHI TIẾT TASK
// ==========================
function openDashTaskDetail(task) {
    dashboardData.currentTaskDetail = task;
    const modal = document.getElementById("dashTaskDetailModal");
    if (!modal) return;
    const title = task.tieuDe || task.tenCongViec || "Nhiệm vụ";
    const desc = task.moTa || "Chưa có mô tả.";
    const assignee = task.nguoiPhuTrach || "Chưa phân công";
    const deadline = task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Không có";
    const statusInfo = getStatusInfo(task.trangThai);
    const progressMap = { done:100, review:80, inprogress:40, todo:0, overdue:0 };
    const progress = progressMap[statusInfo.key] ?? 0;
    const lower = title.toLowerCase();
    let priorityLabel = "ƯU TIÊN THẤP", priorityStyle = "background:#E0F2FE;color:#0369A1;";
    if (lower.includes("gấp") || lower.includes("vip")) { priorityLabel="ƯU TIÊN CAO"; priorityStyle="background:#FEE2E2;color:#DC2626;"; }
    else if (lower.includes("thiết kế") || lower.includes("hoàn tất")) { priorityLabel="TRUNG BÌNH"; priorityStyle="background:#FEF3C7;color:#D97706;"; }
    const statusStyleMap = { done:"background:#D1FAE5;color:#059669;", inprogress:"background:#FEF3C7;color:#D97706;", review:"background:#E0E7FF;color:#4F46E5;", todo:"background:#F3F4F6;color:#6B7280;", overdue:"background:#FEE2E2;color:#DC2626;" };
    document.getElementById("dtdTitle").textContent = title;
    document.getElementById("dtdDesc").textContent = desc;
    const pEl = document.getElementById("dtdPriority");
    pEl.textContent = priorityLabel;
    pEl.style.cssText = `padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;${priorityStyle}`;
    const sEl = document.getElementById("dtdStatus");
    sEl.textContent = statusInfo.label;
    sEl.style.cssText = `padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;${statusStyleMap[statusInfo.key]||statusStyleMap.todo}`;
    document.getElementById("dtdAssignee").textContent = assignee;
    document.getElementById("dtdAvatar").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee)}&background=0D5A9C&color=fff&size=32`;
    document.getElementById("dtdDeadline").textContent = deadline;
    document.getElementById("dtdProgressBar").style.width = `${progress}%`;
    document.getElementById("dtdProgressText").textContent = `${progress}%`;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeDashTaskDetail() {
    const modal = document.getElementById("dashTaskDetailModal");
    if (modal) { modal.style.display = "none"; document.body.style.overflow = "auto"; }
}
window.closeDashTaskDetail = closeDashTaskDetail;

function goToTeamTasks() {
    if (dashboardData.selectedEventId) localStorage.setItem("btc_tasks_selected_event_id", dashboardData.selectedEventId);
    window.location.href = "btc-team-tasks.html";
}
window.goToTeamTasks = goToTeamTasks;

// ==========================
// RENDER RECENT ACTIVITY
// ==========================
function renderRecentActivity(tasks) {
    const activityList = document.getElementById("activityList");
    if (!activityList) return;
    if (!tasks || tasks.length === 0) {
        activityList.innerHTML = '<div class="loading" style="text-align:center;color:#aaa;">Chưa có hoạt động</div>';
        return;
    }
    const recent = [...tasks].sort((a, b) => (b.idCongViec || 0) - (a.idCongViec || 0)).slice(0, 5);
    activityList.innerHTML = recent.map(task => {
        const statusInfo = getStatusInfo(task.trangThai);
        const assignee = task.nguoiPhuTrach || "Hệ thống";
        const time = task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Không có hạn";
        return `<div class="activity-item"><div class="activity-dot"></div><div class="activity-content"><p><strong>${assignee}</strong> — ${task.tieuDe || task.tenCongViec || "Nhiệm vụ"}</p><span class="activity-time"><span class="task-status ${statusInfo.cssClass}" style="font-size:10px;padding:2px 8px;">${statusInfo.label}</span>&nbsp;Hạn: ${time}</span></div></div>`;
    }).join("");
}

// ==========================
// UTILITY
// ==========================
function setElText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function formatCurrency(amount) { return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(amount); }
function exportReport() {}
function submitBudgetApproval() {}

// ==========================
// KHỞI TẠO
// ==========================
document.addEventListener("DOMContentLoaded", async function() {
    if (!checkAuth()) return;
    loadUserInfo();
    setupUserMenu();
    await Promise.all([loadStats(), loadDashTaskEventSelector()]);
});
