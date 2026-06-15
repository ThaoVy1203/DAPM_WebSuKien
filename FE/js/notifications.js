const API_BASE = "http://localhost:5103/api";

let notifications = [];

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    await loadNotifications();

    setupFilters();
    setupMarkAllRead();
    setupSettings();
});

// ==========================
// LOAD DATA
// ==========================
async function loadNotifications() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    let idNguoiDung = "";
    const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
    if (rawUser) {
        try {
            const u = JSON.parse(rawUser);
            idNguoiDung = u.IdNguoiDung || u.idNguoiDung || u.id || "";
        } catch (e) {
            console.error("Lỗi parse userData:", e);
        }
    }

    const todayList = document.getElementById("notificationsList");
    const olderList = document.getElementById("olderNotificationsList");
    if (todayList) todayList.innerHTML = '<div style="padding:20px;color:#999;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const res = await fetch(`${API_BASE}/notifications?idNguoiDung=${encodeURIComponent(idNguoiDung)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        // API có thể trả về mảng hoặc { items: [...] }
        notifications = Array.isArray(data) ? data : (data.items || data.data || []);

        renderNotifications();
        updateBadgeCounts();

    } catch (error) {
        console.error("Lỗi load thông báo:", error);
        if (todayList) todayList.innerHTML = '<div style="padding:20px;color:#999;text-align:center;">Không tải được thông báo. Vui lòng thử lại sau.</div>';
    }
}

// ==========================
// RENDER
// ==========================
function renderNotifications() {
    const todayList = document.getElementById("notificationsList");
    const olderList = document.getElementById("olderNotificationsList");

    if (!todayList || !olderList) return;

    todayList.innerHTML = "";
    olderList.innerHTML = "";

    if (!notifications || notifications.length === 0) {
        todayList.innerHTML = '<div style="padding:24px;color:#999;text-align:center;">Không có thông báo nào.</div>';
        return;
    }

    notifications.forEach(notification => {
        const thoiGian = notification.thoiGianGui || notification.ngayTao || notification.createdAt;
        const item = renderNotification(notification);
        if (thoiGian && isToday(thoiGian)) {
            todayList.appendChild(item);
        } else {
            olderList.appendChild(item);
        }
    });

    if (todayList.innerHTML === "") {
        todayList.innerHTML = '<div style="padding:12px;color:#999;font-size:14px;">Không có thông báo hôm nay.</div>';
    }
}

function renderNotification(notification) {
    const div = document.createElement("div");

    // Hỗ trợ cả idThongBao (từ DB) và id
    const notifId = notification.idThongBao || notification.id;
    const daDoc = notification.daDoc === true || notification.daDoc === 1;
    // Hỗ trợ cả thoiGianGui và ngayTao
    const thoiGian = notification.thoiGianGui || notification.ngayTao || notification.createdAt;
    const loai = notification.loai || notification.type || "general";

    div.className = `notification-item ${!daDoc ? "unread" : ""}`;
    div.dataset.id = notifId;
    div.dataset.type = loai;

    div.innerHTML = `
        <div class="notification-icon ${loai}">
            <i class="fas ${getIcon(loai)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <div class="notification-title">
                    ${!daDoc ? '<span class="unread-dot"></span>' : ''}
                    ${escapeHtml(notification.tieuDe || notification.title || "Thông báo")}
                </div>
                <span class="notification-time">
                    ${thoiGian ? formatTime(thoiGian) : ""}
                </span>
            </div>
            <p class="notification-text">${escapeHtml(notification.noiDung || notification.content || "")}</p>
        </div>`;

    div.addEventListener("click", () => markAsRead(notifId));
    return div;
}

// ==========================
// MARK READ
// ==========================
async function markAsRead(id) {
    try {
        const token = localStorage.getItem("token");

        await fetch(`${API_BASE}/ThongBao/${id}/read`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const notification = notifications.find(n => n.id == id);
        if (notification) notification.daDoc = true;

        renderNotifications();
        updateBadgeCounts();

    } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
    }
}

async function markAllAsRead() {
    try {
        const token = localStorage.getItem("token");

        let idNguoiDung = "";
        const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
        if (rawUser) {
            try {
                const u = JSON.parse(rawUser);
                idNguoiDung = u.IdNguoiDung || u.idNguoiDung || u.id || "";
            } catch (e) {}
        }

        await fetch(`${API_BASE}/ThongBao/read-all?idNguoiDung=${idNguoiDung}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        notifications.forEach(n => n.daDoc = true);

        renderNotifications();
        updateBadgeCounts();

    } catch (error) {
        console.error(error);
    }
}

// ==========================
// FILTER
// ==========================
function setupFilters() {
    document.querySelectorAll(".filter-item").forEach(btn => {
        btn.addEventListener("click", function () {

            document.querySelectorAll(".filter-item")
                .forEach(b => b.classList.remove("active"));

            this.classList.add("active");

            filterNotifications(this.dataset.filter);
        });
    });
}

function filterNotifications(type) {
    document.querySelectorAll(".notification-item").forEach(item => {
        if (type === "all" || item.dataset.type === type) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

// ==========================
// BADGES
// ==========================
function updateBadgeCounts() {
    const unread = notifications.filter(n => !n.daDoc);

    const allBadge = document.querySelector(".filter-item[data-filter='all'] .badge");
    if (allBadge) allBadge.textContent = unread.length;

    ["event", "general", "approved", "reminder"].forEach(type => {
        const count = unread.filter(n => {
            const t = (n.loai || n.type || "general").toLowerCase();
            if (type === "general") return t === "general" || t === "info" || t === "system";
            if (type === "approved") return t === "approved" || t === "success" || t === "system";
            return t === type;
        }).length;

        const badgeEl = document.querySelector(`.filter-item[data-filter='${type}'] .badge`);
        if (badgeEl) badgeEl.textContent = count;
    });
}

// ==========================
// SETTINGS
// ==========================
function setupSettings() {
    document.getElementById("emailToggle")
        ?.addEventListener("change", function () {
            saveNotificationSetting("email", this.checked);
        });

    document.getElementById("pushToggle")
        ?.addEventListener("change", function () {
            saveNotificationSetting("push", this.checked);
        });
}

async function saveNotificationSetting(type, enabled) {
    try {
        const token = localStorage.getItem("token");

        await fetch(`${API_BASE}/ThongBao/settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                type,
                enabled
            })
        });

    } catch (error) {
        console.error("Lỗi lưu setting:", error);
    }
}

// ==========================
// BUTTONS
// ==========================
function setupMarkAllRead() {
    document.getElementById("markAllRead")
        ?.addEventListener("click", markAllAsRead);
}

// ==========================
// HELPERS
// ==========================
function getIcon(type) {
    const icons = {
        event: "fa-calendar",
        system: "fa-check-circle",
        approved: "fa-check-circle",
        reminder: "fa-clock",
        info: "fa-info-circle",
        general: "fa-info-circle"
    };

    return icons[type] || "fa-bell";
}

function formatTime(date) {
    return new Date(date).toLocaleString("vi-VN");
}

function isToday(date) {
    const d = new Date(date);
    const now = new Date();

    return d.toDateString() === now.toDateString();
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}