// js/calender.js — Lịch cá nhân người tham gia
const API_BASE = "https://localhost:7160/api";

let allMyRegistrations = [];
let currentCalMonth = null;
let eventDatesSet = new Set();

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    loadWelcomeInfo();

    await Promise.all([
        loadAllMyRegistrations(),
        loadNotifications()
    ]);

    loadStats();

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
        const hoTen = user.HoTen || user.hoTen || "bạn";
        const nameEl = document.getElementById("welcomeName");
        if (nameEl) nameEl.textContent = `Xin chào, ${hoTen}`;
    } catch (e) { /* bỏ qua */ }
}

// ── LOAD TẤT CẢ ĐĂNG KÝ CỦA NGƯỜI DÙNG ──────────────────────────
async function loadAllMyRegistrations() {
    const token = localStorage.getItem("token");
    try {
        const raw = localStorage.getItem("userData");
        if (!raw) throw new Error("Chưa đăng nhập");
        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;
        if (!idNguoiDung) throw new Error("Không xác định được tài khoản");

        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const raw2 = Array.isArray(data) ? data : (data.items || data.data || []);

        allMyRegistrations = raw2.map(item => ({
            idDangKy:         item.IdDangKy         ?? item.idDangKy,
            idSuKien:         item.IdSuKien         ?? item.idSuKien,
            tenSuKien:        item.TenSuKien        ?? item.tenSuKien        ?? "Sự kiện",
            trangThai:        item.TrangThai        ?? item.trangThai        ?? "",
            thoiGianDangKy:   item.ThoiGianDangKy   ?? item.thoiGianDangKy,
            thoiGianCheckin:  item.ThoiGianCheckin  ?? item.thoiGianCheckin  ?? null,
            thoiGianCheckout: item.ThoiGianCheckout ?? item.thoiGianCheckout ?? null,
            thoiGianBatDau:   item.ThoiGianBatDau   ?? item.thoiGianBatDau   ?? null,
            thoiGianKetThuc:  item.ThoiGianKetThuc  ?? item.thoiGianKetThuc  ?? null,
            tenDiaDiem:       item.TenDiaDiem       ?? item.tenDiaDiem        ?? "",
        }));

        const upcoming = allMyRegistrations.filter(item => {
            const ts = item.trangThai;
            if (ts === "Đã hủy" || ts === "Vắng mặt") return false;
            const ngay = item.thoiGianBatDau;
            if (!ngay) return true;
            return new Date(ngay) >= new Date();
        });

        const msgEl = document.getElementById("welcomeMsg");
        if (msgEl) {
            if (upcoming.length > 0) {
                msgEl.textContent = `Bạn có ${upcoming.length} sự kiện sắp diễn ra.`;
            } else {
                const total = allMyRegistrations.filter(i => i.trangThai !== "Đã hủy").length;
                msgEl.textContent = total > 0
                    ? `Bạn đã đăng ký ${total} sự kiện.`
                    : "Bạn chưa có sự kiện nào. Hãy khám phá ngay!";
            }
        }

        const statValue = document.querySelector(".stat-value");
        if (statValue) statValue.textContent = allMyRegistrations.filter(i => i.trangThai !== "Đã hủy").length;

        renderUpcomingEvents(allMyRegistrations.filter(i => i.trangThai !== "Đã hủy"));
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
        const ngay = item.thoiGianBatDau;
        if (ngay) {
            const d = new Date(ngay);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            eventDatesSet.add(key);
        }
    });
    if (currentCalMonth) renderCalendar(currentCalMonth);
}

// ── RENDER DANH SÁCH VÉ ───────────────────────────────────────────
function renderUpcomingEvents(items) {
    const list = document.querySelector(".events-list");
    if (!list) return;

    if (!items || items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:24px;color:#999;font-size:14px;">
            <i class="fas fa-calendar-times" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            Chưa có sự kiện nào.
            <br><a href="events.html" style="color:#0D5A9C;font-weight:600;text-decoration:none;margin-top:8px;display:inline-block;">Khám phá sự kiện →</a>
        </div>`;
        return;
    }

    list.innerHTML = "";

    const sorted = [...items].sort((a, b) => {
        const da = new Date(a.thoiGianBatDau || 0);
        const db = new Date(b.thoiGianBatDau || 0);
        const now = new Date();
        const aFuture = da >= now;
        const bFuture = db >= now;
        if (aFuture && !bFuture) return -1;
        if (!aFuture && bFuture) return 1;
        return aFuture ? da - db : db - da;
    });

    const statusCfg = {
        "Chờ xác nhận": { bg:"#fef3c7", color:"#92400e", icon:"fa-clock",       label:"Chờ xác nhận" },
        "Đã xác nhận":  { bg:"#d1fae5", color:"#065f46", icon:"fa-check-circle", label:"Đã xác nhận" },
        "Đã tham gia":  { bg:"#dbeafe", color:"#1e40af", icon:"fa-star",         label:"Đã tham gia" },
        "Vắng mặt":     { bg:"#f3f4f6", color:"#6b7280", icon:"fa-user-times",   label:"Vắng mặt" },
    };

    sorted.forEach(item => {
        const tenSuKien = item.tenSuKien || "Sự kiện";
        const diaDiem   = item.tenDiaDiem || "Đang cập nhật";
        const ngay      = item.thoiGianBatDau;
        const date      = ngay ? new Date(ngay) : null;
        const idDangKy  = item.idDangKy || "";
        const trangThai = item.trangThai || "";

        const cfg = statusCfg[trangThai] || { bg:"#f3f4f6", color:"#6b7280", icon:"fa-info-circle", label: trangThai };

        const isToday  = date && isDateToday(date);
        const isPast   = date && date < new Date();
        const boxStyle = isToday
            ? "background:#ef4444;color:white;"
            : isPast
                ? "background:#e5e7eb;color:#6b7280;"
                : "background:#0D5A9C;color:white;";

        const monthStr = date
            ? date.toLocaleString("vi-VN", { month:"short" }).replace("thg ","Th").toUpperCase()
            : "--";
        const dayStr = date ? date.getDate() : "--";

        const el = document.createElement("div");
        el.className = "event-item";
        el.innerHTML = `
            <div class="event-date-box" style="${boxStyle}border-radius:10px;min-width:52px;text-align:center;padding:8px 6px;">
                <div class="date-month" style="font-size:10px;font-weight:700;letter-spacing:0.5px;">${monthStr}</div>
                <div class="date-day" style="font-size:22px;font-weight:800;line-height:1.1;">${dayStr}</div>
            </div>
            <div class="event-info" style="flex:1;min-width:0;">
                <h4 style="font-size:14px;font-weight:700;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(tenSuKien)}</h4>
                <p style="font-size:12px;color:#666;margin-bottom:4px;">
                    <i class="fas fa-map-marker-alt" style="color:#0D5A9C;margin-right:4px;"></i>${escapeHtml(diaDiem)}
                </p>
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:${cfg.bg};color:${cfg.color};">
                    <i class="fas ${cfg.icon}"></i> ${cfg.label}
                </span>
            </div>
            <a href="${idDangKy ? 'ticket-detail.html?id='+idDangKy : 'my-tickets.html'}" class="btn-view"
               style="white-space:nowrap;font-size:12px;padding:6px 12px;">
                <i class="fas fa-ticket-alt"></i> Xem vé
            </a>`;
        list.appendChild(el);
    });
}

// ── LOAD THỐNG KÊ ─────────────────────────────────────────────────
async function loadStats() {
    const attended = allMyRegistrations.filter(i => i.trangThai === "Đã tham gia").length;
    const total    = allMyRegistrations.filter(i => i.trangThai !== "Đã hủy").length;

    const statDetail = document.querySelector(".stat-detail");
    if (statDetail) statDetail.textContent = `${attended} sự kiện đã tham gia`;

    const drl = Math.min(attended * 5, 100);
    const progressFill  = document.querySelector(".progress-fill");
    const progressValue = document.querySelector(".stat-progress .progress-value");
    if (progressFill)  progressFill.style.width = `${drl}%`;
    if (progressValue) progressValue.textContent = `${drl} / 100`;

    const statGrowth = document.querySelector(".stat-growth");
    if (statGrowth) statGrowth.textContent = `${total} sự kiện đã đăng ký`;
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
        if (!items || items.length === 0) return;

        container.querySelectorAll(".notification-item").forEach(el => el.remove());

        items.slice(0, 3).forEach(notif => {
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
    const month = date.getMonth();

    const calTitle = document.querySelector(".calendar-nav span");
    if (calTitle) {
        calTitle.textContent = date.toLocaleString("vi-VN", { month:"long", year:"numeric" });
    }

    const firstDay       = new Date(year, month, 1).getDay();
    const daysInMonth    = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    const body = document.querySelector(".calendar-body");
    if (!body) return;
    body.innerHTML = "";

    for (let i = firstDay - 1; i >= 0; i--) {
        const div = document.createElement("div");
        div.className = "calendar-date inactive";
        div.textContent = daysInPrevMonth - i;
        body.appendChild(div);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const div = document.createElement("div");

        let cls = "calendar-date";
        if (key === todayKey) cls += " today";
        if (eventDatesSet.has(key)) cls += " has-event";

        div.className = cls;
        div.textContent = d;

        if (eventDatesSet.has(key)) {
            div.title = "Có sự kiện";
            div.style.cursor = "pointer";
            div.addEventListener("click", () => showEventsOnDate(key));
        }

        body.appendChild(div);
    }

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
        const ngay = item.thoiGianBatDau;
        if (!ngay) return false;
        const d = new Date(ngay);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        return key === dateKey;
    });

    if (eventsOnDate.length === 0) return;

    const lines = eventsOnDate.map(e =>
        `• ${e.tenSuKien || "Sự kiện"} [${e.trangThai}]`
    ).join("\n");
    alert(`Sự kiện ngày ${dateKey.split("-").reverse().join("/")}:\n\n${lines}`);
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

    document.querySelector(".view-all-link")?.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "notifications.html";
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
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)    return "Vừa xong";
    if (diff < 3600)  return `${Math.floor(diff/60)} phút trước`;
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