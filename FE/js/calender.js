// js/calender.js — Lịch cá nhân người tham gia
// Load: vé sắp tới, lịch sự kiện động, thống kê, thông báo
const API_BASE = "https://localhost:7160/api";

let allMyRegistrations = [];   // Tất cả đăng ký của người dùng
let currentCalMonth = null;    // Tháng đang hiển thị (Date object)
let eventDatesSet = new Set(); // Tập hợp ngày có sự kiện (YYYY-MM-DD)

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    loadWelcomeInfo();

    // Load song song để nhanh hơn
    await Promise.all([
        loadAllMyRegistrations(),
        loadNotifications(),
        loadStats()
    ]);

    currentCalMonth = new Date();
    renderCalendar(currentCalMonth);
    initCalendarNav();
    initializeButtons();
    animateProgressBar();
});

// ── WELCOME ────────────────────────────────────────────────────────
function loadWelcomeInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        const nameEl = document.getElementById("welcomeName");
        if (nameEl) nameEl.textContent = `Xin chào, ${user.hoTen || "bạn"}`;
    } catch (e) { /* bỏ qua */ }
}

// ── LOAD TẤT CẢ ĐĂNG KÝ CỦA NGƯỜI DÙNG ──────────────────────────
async function loadAllMyRegistrations() {
    const token = localStorage.getItem("token");
    try {
        // Gọi không có filter trangThai — lấy hết rồi lọc phía FE
        const res = await fetch(`${API_BASE}/DangKySuKien/my`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        allMyRegistrations = Array.isArray(data) ? data : (data.items || data.data || []);

        // Lọc sự kiện sắp tới (chưa hủy, chưa kết thúc)
        const upcoming = allMyRegistrations.filter(item => {
            const ts = item.trangThai || "";
            if (ts === "Đã hủy" || ts === "Vắng mặt") return false;
            // Kiểm tra thời gian sự kiện còn trong tương lai
            const ngay = item.thoiGianBatDau || item.suKien?.thoiGianBatDau;
            if (!ngay) return true; // Không có ngày → vẫn hiện
            return new Date(ngay) >= new Date();
        });

        // Cập nhật welcome message
        const msgEl = document.getElementById("welcomeMsg");
        if (msgEl) {
            msgEl.textContent = upcoming.length > 0
                ? `Bạn có ${upcoming.length} sự kiện sắp diễn ra.`
                : "Bạn chưa có sự kiện nào sắp tới.";
        }

        // Cập nhật stat card
        const statValue = document.querySelector(".stat-value");
        if (statValue) statValue.textContent = upcoming.length;

        // Render danh sách vé sắp tới
        renderUpcomingEvents(upcoming);

        // Tạo tập hợp ngày có sự kiện để đánh dấu trên lịch
        buildEventDatesSet(allMyRegistrations);

    } catch (e) {
        console.warn("Không load được đăng ký:", e.message);
        const msgEl = document.getElementById("welcomeMsg");
        if (msgEl) msgEl.textContent = "Không thể tải dữ liệu. Vui lòng thử lại.";

        const list = document.querySelector(".events-list");
        if (list) list.innerHTML = `<div style="text-align:center;padding:20px;color:#999;font-size:14px;">
            <i class="fas fa-exclamation-circle"></i> Không thể tải dữ liệu sự kiện.
        </div>`;
    }
}

// ── TẠO TẬP HỢP NGÀY CÓ SỰ KIỆN ─────────────────────────────────
function buildEventDatesSet(registrations) {
    eventDatesSet.clear();
    registrations.forEach(item => {
        if (item.trangThai === "Đã hủy") return;
        const ngay = item.thoiGianBatDau || item.suKien?.thoiGianBatDau;
        if (ngay) {
            const d = new Date(ngay);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            eventDatesSet.add(key);
        }
    });
    // Re-render lịch nếu đã khởi tạo
    if (currentCalMonth) renderCalendar(currentCalMonth);
}

// ── RENDER DANH SÁCH VÉ SẮP TỚI ──────────────────────────────────
function renderUpcomingEvents(items) {
    const list = document.querySelector(".events-list");
    if (!list) return;

    if (!items || items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:24px;color:#999;font-size:14px;">
            <i class="fas fa-calendar-times" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            Chưa có sự kiện nào sắp tới.
            <br><a href="events.html" style="color:#0D5A9C;font-weight:600;text-decoration:none;margin-top:8px;display:inline-block;">Khám phá sự kiện →</a>
        </div>`;
        return;
    }

    list.innerHTML = "";
    // Sắp xếp theo ngày gần nhất
    const sorted = [...items].sort((a, b) => {
        const da = new Date(a.thoiGianBatDau || a.suKien?.thoiGianBatDau || 0);
        const db = new Date(b.thoiGianBatDau || b.suKien?.thoiGianBatDau || 0);
        return da - db;
    });

    sorted.slice(0, 4).forEach(item => {
        const tenSuKien = item.tenSuKien || item.suKien?.tenSuKien || "Sự kiện";
        const diaDiem   = item.tenDiaDiem || item.suKien?.diaDiem?.tenDiaDiem || "Đang cập nhật";
        const ngay      = item.thoiGianBatDau || item.suKien?.thoiGianBatDau;
        const date      = ngay ? new Date(ngay) : null;
        const idSuKien  = item.idSuKien || item.suKien?.idSuKien || "";
        const idDangKy  = item.idDangKy || "";
        const trangThai = item.trangThai || "";

        // Màu date box theo trạng thái
        const isToday = date && isDateToday(date);
        const boxClass = isToday ? "event-date-box orange" : "event-date-box";

        // Badge trạng thái
        const badgeColors = {
            "Đã xác nhận":  "#059669",
            "Chờ xác nhận": "#d97706",
            "Đã tham gia":  "#1d4ed8"
        };
        const badgeColor = badgeColors[trangThai] || "#6b7280";

        list.innerHTML += `
            <div class="event-item">
                <div class="${boxClass}">
                    <div class="date-month">${date ? date.toLocaleString("vi-VN", { month:"short" }).toUpperCase() : "--"}</div>
                    <div class="date-day">${date ? date.getDate() : "--"}</div>
                </div>
                <div class="event-info">
                    <h4>${escapeHtml(tenSuKien)}</h4>
                    <p><i class="fas fa-map-marker-alt" style="color:#0D5A9C;margin-right:4px;"></i>${escapeHtml(diaDiem)}</p>
                    <span style="font-size:11px;font-weight:600;color:${badgeColor};">${trangThai}</span>
                </div>
                <a href="my-tickets.html${idDangKy ? '?dangKyId='+idDangKy : ''}" class="btn-view">Xem vé</a>
            </div>`;
    });
}

// ── LOAD THỐNG KÊ ─────────────────────────────────────────────────
async function loadStats() {
    const token = localStorage.getItem("token");
    try {
        // Lấy lịch sử tham gia để tính số sự kiện đã tham gia
        const res = await fetch(`${API_BASE}/DangKySuKien/my`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);

        const attended = items.filter(i => i.trangThai === "Đã tham gia").length;
        const total    = items.filter(i => i.trangThai !== "Đã hủy").length;

        // Cập nhật stat card
        const statDetail = document.querySelector(".stat-detail");
        if (statDetail) statDetail.textContent = `${attended} sự kiện đã tham gia`;

        // Cập nhật progress bar (giả sử mỗi sự kiện = 5 điểm, tối đa 100)
        const drl = Math.min(attended * 5, 100);
        const progressFill = document.querySelector(".progress-fill");
        const progressValue = document.querySelector(".stat-progress .progress-value");
        if (progressFill) progressFill.style.width = `${drl}%`;
        if (progressValue) progressValue.textContent = `${drl} / 100`;

        const statGrowth = document.querySelector(".stat-growth");
        if (statGrowth) statGrowth.textContent = `${total} sự kiện đã đăng ký`;

    } catch (e) {
        console.warn("Không load được thống kê:", e.message);
    }
}

// ── LOAD THÔNG BÁO SIDEBAR ────────────────────────────────────────
async function loadNotifications() {
    const token = localStorage.getItem("token");
    const container = document.querySelector(".notifications-card");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/ThongBao`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);

        if (!items || items.length === 0) return; // Giữ nội dung tĩnh nếu không có

        // Render 3 thông báo mới nhất
        const notifList = container.querySelector(".notification-item")?.parentElement;
        if (!notifList) return;

        // Xóa các item tĩnh
        container.querySelectorAll(".notification-item").forEach(el => el.remove());

        const recent = items.slice(0, 3);
        recent.forEach(notif => {
            const daDoc = notif.daDoc === true || notif.daDoc === 1;
            const thoiGian = notif.thoiGianGui || notif.ngayTao;
            const timeStr = thoiGian ? formatRelativeTime(new Date(thoiGian)) : "";

            const div = document.createElement("div");
            div.className = "notification-item";
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="notif-icon ${daDoc ? "info" : "success"}">
                    <i class="fas ${daDoc ? "fa-info-circle" : "fa-bell"}"></i>
                </div>
                <div class="notif-content">
                    <h5 style="${!daDoc ? "font-weight:700;" : ""}">${escapeHtml(notif.tieuDe || "Thông báo")}</h5>
                    <p>${escapeHtml((notif.noiDung || "").substring(0, 60))}${(notif.noiDung || "").length > 60 ? "..." : ""}</p>
                    <span class="notif-time">${timeStr}</span>
                </div>`;
            div.addEventListener("click", () => window.location.href = "notifications.html");

            // Chèn trước link "XEM TẤT CẢ"
            const viewAll = container.querySelector(".view-all-link");
            if (viewAll) container.insertBefore(div, viewAll);
            else container.appendChild(div);
        });

    } catch (e) {
        console.warn("Không load được thông báo:", e.message);
    }
}

// ── RENDER LỊCH ĐỘNG ──────────────────────────────────────────────
function renderCalendar(date) {
    const year  = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // Cập nhật tiêu đề
    const calTitle = document.querySelector(".calendar-nav span");
    if (calTitle) {
        calTitle.textContent = date.toLocaleString("vi-VN", { month:"long", year:"numeric" });
    }

    // Tính ngày đầu tháng và số ngày trong tháng
    const firstDay  = new Date(year, month, 1).getDay(); // 0=CN
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    const body = document.querySelector(".calendar-body");
    if (!body) return;
    body.innerHTML = "";

    // Ngày tháng trước (inactive)
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const div = document.createElement("div");
        div.className = "calendar-date inactive";
        div.textContent = d;
        body.appendChild(div);
    }

    // Ngày trong tháng
    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const div = document.createElement("div");

        let cls = "calendar-date";
        if (key === todayKey) cls += " today";
        if (eventDatesSet.has(key)) cls += " has-event";

        div.className = cls;
        div.textContent = d;

        // Tooltip khi hover ngày có sự kiện
        if (eventDatesSet.has(key)) {
            div.title = "Có sự kiện";
            div.style.cursor = "pointer";
            div.addEventListener("click", () => showEventsOnDate(key));
        }

        body.appendChild(div);
    }

    // Ngày tháng sau (inactive) — điền đủ 6 hàng
    const totalCells = body.children.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remaining; d++) {
        const div = document.createElement("div");
        div.className = "calendar-date inactive";
        div.textContent = d;
        body.appendChild(div);
    }
}

// ── HIỆN SỰ KIỆN THEO NGÀY ────────────────────────────────────────
function showEventsOnDate(dateKey) {
    const eventsOnDate = allMyRegistrations.filter(item => {
        if (item.trangThai === "Đã hủy") return false;
        const ngay = item.thoiGianBatDau || item.suKien?.thoiGianBatDau;
        if (!ngay) return false;
        const d = new Date(ngay);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        return key === dateKey;
    });

    if (eventsOnDate.length === 0) return;

    const names = eventsOnDate.map(e => `• ${e.tenSuKien || e.suKien?.tenSuKien || "Sự kiện"}`).join("\n");
    alert(`Sự kiện ngày ${dateKey.split("-").reverse().join("/")}:\n\n${names}`);
}

// ── ĐIỀU HƯỚNG LỊCH ───────────────────────────────────────────────
function initCalendarNav() {
    const btns = document.querySelectorAll(".btn-nav");
    if (btns.length < 2) return;

    btns[0].addEventListener("click", function () {
        currentCalMonth = new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() - 1, 1);
        renderCalendar(currentCalMonth);
    });

    btns[1].addEventListener("click", function () {
        currentCalMonth = new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() + 1, 1);
        renderCalendar(currentCalMonth);
    });
}

// ── BUTTONS ───────────────────────────────────────────────────────
function initializeButtons() {
    document.querySelector(".btn-help")?.addEventListener("click", function () {
        alert("Tính năng hỗ trợ đang được phát triển.\nVui lòng liên hệ: eventdhspkt@ute.udn.vn");
    });

    document.querySelector(".btn-download")?.addEventListener("click", function () {
        showToast("Tính năng tải báo cáo đang được phát triển.", "info");
    });
}

// ── PROGRESS BAR ANIMATION ────────────────────────────────────────
function animateProgressBar() {
    const fill = document.querySelector(".progress-fill");
    if (!fill) return;
    const target = fill.style.width || "0%";
    fill.style.width = "0%";
    setTimeout(() => {
        fill.style.transition = "width 0.8s ease";
        fill.style.width = target;
    }, 300);
}

// ── HELPERS ───────────────────────────────────────────────────────
function isDateToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // giây
    if (diff < 60)   return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
    return `${Math.floor(diff/86400)} ngày trước`;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}

function showToast(msg, type = "success") {
    const colors = { success: "#059669", error: "#dc2626", info: "#0D5A9C" };
    const toast = document.createElement("div");
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;
        padding:14px 20px;border-radius:10px;font-size:14px;font-weight:500;
        background:${colors[type]};color:white;box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:360px;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
