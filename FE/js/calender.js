// js/calender.js
const API_BASE = "https://localhost:7160/api";

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    loadWelcomeInfo();
    await loadUpcomingEvents();
    initializeCalendar();
    initializeButtons();
    animateProgressBar();
});

// ==========================
// WELCOME — điền tên từ localStorage
// ==========================
function loadWelcomeInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        const nameEl = document.getElementById("welcomeName");
        if (nameEl) nameEl.textContent = `Xin chào, ${user.hoTen || "bạn"}`;
    } catch (e) { /* bỏ qua */ }
}

// ==========================
// LOAD SỰ KIỆN SẮP TỚI
// ==========================
async function loadUpcomingEvents() {
    const token = localStorage.getItem("token");
    try {
        // Lấy danh sách đăng ký của người dùng (trạng thái Đã xác nhận)
        const res = await fetch(`${API_BASE}/DangKySuKien/my?trangThai=Đã xác nhận`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.data || []);

        // Cập nhật welcome message
        const msgEl = document.getElementById("welcomeMsg");
        if (msgEl) {
            msgEl.textContent = items.length > 0
                ? `Bạn có ${items.length} sự kiện sắp diễn ra.`
                : "Bạn chưa có sự kiện nào sắp tới.";
        }

        // Cập nhật stat
        const statValue = document.querySelector(".stat-value");
        if (statValue) statValue.textContent = items.length;

        renderUpcomingEvents(items);

    } catch (e) {
        console.warn("Không load được sự kiện sắp tới:", e.message);
    }
}

function renderUpcomingEvents(items) {
    const list = document.querySelector(".events-list");
    if (!list) return;

    if (!items || items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:20px;color:#999;font-size:14px;">
            Chưa có sự kiện nào sắp tới.
        </div>`;
        return;
    }

    list.innerHTML = "";
    items.slice(0, 3).forEach(item => {
        const tenSuKien = item.tenSuKien || item.suKien?.tenSuKien || "Sự kiện";
        const diaDiem = item.tenDiaDiem || item.suKien?.diaDiem?.tenDiaDiem || "Đang cập nhật";
        const ngay = item.thoiGianBatDau || item.suKien?.thoiGianBatDau;
        const date = ngay ? new Date(ngay) : null;
        const month = date ? date.toLocaleString("vi-VN", { month: "short" }).toUpperCase() : "--";
        const day = date ? date.getDate() : "--";
        const idSuKien = item.idSuKien || item.suKien?.idSuKien || "";

        list.innerHTML += `
            <div class="event-item">
                <div class="event-date-box">
                    <div class="date-month">${month}</div>
                    <div class="date-day">${day}</div>
                </div>
                <div class="event-info">
                    <h4>${escapeHtml(tenSuKien)}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</p>
                </div>
                <a href="event-detail.html?id=${idSuKien}" class="btn-view">Xem vé</a>
            </div>`;
    });
}

// ==========================
// CALENDAR
// ==========================
function initializeCalendar() {
    // Navigation tháng
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.addEventListener("click", function () {
            // Placeholder — có thể mở rộng sau
            console.log("Calendar nav clicked");
        });
    });

    // Click vào ngày
    document.querySelectorAll(".calendar-date:not(.inactive)").forEach(date => {
        date.addEventListener("click", function () {
            document.querySelectorAll(".calendar-date").forEach(d => d.classList.remove("active"));
            this.classList.add("active");
        });
    });
}

// ==========================
// BUTTONS
// ==========================
function initializeButtons() {
    // Nút "Gửi yêu cầu" hỗ trợ
    document.querySelector(".btn-help")?.addEventListener("click", function () {
        alert("Tính năng hỗ trợ đang được phát triển. Vui lòng liên hệ email: eventdhspkt@ute.udn.vn");
    });

    // Nút tải báo cáo
    document.querySelector(".btn-download")?.addEventListener("click", function () {
        const token = localStorage.getItem("token");
        window.open(`${API_BASE}/NguoiDung/download-report?token=${token}`, "_blank");
    });
}

// ==========================
// PROGRESS BAR ANIMATION
// ==========================
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

// ==========================
// HELPERS
// ==========================
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}
