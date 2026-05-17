// js/home-user.js
const API_BASE = "https://localhost:7160/api";

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    // Kiểm tra đăng nhập - nếu chưa đăng nhập thì về trang login
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    loadUserInfo();
    initUserMenu();
    await loadFeaturedEvents();
    await loadNotificationCount();
    initScrollAnimations();
});

// ==========================
// USER INFO
// ==========================
function loadUserInfo() {
    // login.js lưu vào key "userData" (không phải "user")
    const raw = localStorage.getItem("userData");
    if (!raw) return;

    try {
        const user = JSON.parse(raw);

        // Tên người dùng
        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = user.hoTen || "Người dùng";

        // Avatar
        const avatarEl = document.getElementById("userAvatar");
        if (avatarEl) {
            const name = encodeURIComponent(user.hoTen || "User");
            avatarEl.src = user.anhDaiDien
                || `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff`;
            avatarEl.onerror = function () {
                this.src = `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff`;
            };
        }
    } catch (e) {
        console.error("Lỗi parse userData:", e);
    }
}

// ==========================
// USER MENU DROPDOWN
// ==========================
function initUserMenu() {
    const wrapper = document.getElementById("userMenuWrapper");
    const dropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!wrapper || !dropdown) return;

    // Toggle dropdown khi click vào user menu
    wrapper.addEventListener("click", function (e) {
        e.stopPropagation();
        const isVisible = dropdown.style.display === "block";
        dropdown.style.display = isVisible ? "none" : "block";
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener("click", function () {
        if (dropdown) dropdown.style.display = "none";
    });

    // Đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }
}

// ==========================
// LOGOUT
// ==========================
function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "login.html";
}

// ==========================
// NOTIFICATION COUNT
// ==========================
async function loadNotificationCount() {
    const token = localStorage.getItem("token");
    const badge = document.getElementById("notifBadge");
    if (!badge) return;

    try {
        const res = await fetch(`${API_BASE}/ThongBao/unread-count`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const count = typeof data === "number" ? data : (data.count || data.soLuong || 0);

        if (count > 0) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = "inline-block";
        } else {
            badge.style.display = "none";
        }
    } catch (e) {
        console.log("Không lấy được số thông báo:", e);
    }
}

// ==========================
// FEATURED EVENTS
// ==========================
async function loadFeaturedEvents() {
    const token = localStorage.getItem("token");
    const container = document.querySelector(".events-grid");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Không lấy được sự kiện");

        const data = await res.json();
        // API có thể trả về mảng trực tiếp hoặc { data: [...] }
        const events = Array.isArray(data) ? data : (data.data || data.items || []);

        renderFeaturedEvents(events, container);

    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">
                <i class="fas fa-exclamation-circle" style="font-size:32px; margin-bottom:12px; display:block;"></i>
                Không thể tải sự kiện. Vui lòng thử lại sau.
            </div>`;
    }
}

function renderFeaturedEvents(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">
                Hiện chưa có sự kiện nào.
            </div>`;
        return;
    }

    // Chỉ hiển thị tối đa 3 sự kiện nổi bật
    container.innerHTML = "";
    events.slice(0, 3).forEach(event => {
        const startDate = event.thoiGianBatDau
            ? new Date(event.thoiGianBatDau).toLocaleDateString("vi-VN")
            : "Chưa có";
        const endDate = event.thoiGianKetThuc
            ? new Date(event.thoiGianKetThuc).toLocaleDateString("vi-VN")
            : "";
        const dateStr = endDate ? `${startDate} - ${endDate}` : startDate;

        const diaDiem = event.tenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";
        const trangThai = event.trangThai || "";
        const badgeClass = getBadgeClass(trangThai);
        const badgeText = trangThai || "Sự kiện";
        const isFeatured = events.indexOf(event) === 0 ? "featured" : "";

        container.innerHTML += `
            <div class="event-card ${isFeatured}">
                <div class="event-badge ${badgeClass}">${escapeHtml(badgeText)}</div>
                <div class="event-card-content">
                    <h3>${escapeHtml(event.tenSuKien || "Chưa có tên")}</h3>
                    <div class="event-meta">
                        <span><i class="far fa-calendar"></i> ${dateStr}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
                    </div>
                    <a href="event-detail.html?id=${event.idSuKien}" class="btn-view-detail">Xem chi tiết</a>
                </div>
            </div>`;
    });
}

function getBadgeClass(trangThai) {
    switch (trangThai) {
        case "Đang diễn ra": return "blue";
        case "Đã duyệt":
        case "Kết thúc":    return "green";
        case "Hủy":         return "red";
        default:            return "";
    }
}

// ==========================
// SCROLL ANIMATIONS
// ==========================
function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".event-card, .feature-item, .stat-item").forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        observer.observe(el);
    });
}

// ==========================
// HELPERS
// ==========================
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
}
