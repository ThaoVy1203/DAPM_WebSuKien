/**
 * header-user.js
 * Script dùng chung cho tất cả trang của người dùng đã đăng nhập.
 * Khởi tạo: user menu, dropdown, notification badge, logout.
 * Include sau script chính của từng trang.
 */

(function () {
    const API_BASE = "https://localhost:7160/api";

    document.addEventListener("DOMContentLoaded", function () {
        initHeaderUser();
    });

    function initHeaderUser() {
        const token = localStorage.getItem("token");
        if (!token) {
            // Chưa đăng nhập → về login
            window.location.href = "login.html";
            return;
        }

        fillUserInfo();
        initUserMenuDropdown();
        loadNotifCount();
    }

    // ── Điền tên + avatar từ localStorage ──────────────────────────
    function fillUserInfo() {
        const raw = localStorage.getItem("userData");
        if (!raw) return;
        try {
            const user = JSON.parse(raw);
            const nameEl = document.getElementById("userName");
            const avatarEl = document.getElementById("userAvatar");
            const qaAvatarEl = document.getElementById("qaUserAvatar");

            // Hỗ trợ cả PascalCase (BE trả) và camelCase
            const hoTen = user.HoTen || user.hoTen || "Người dùng";
            if (nameEl) nameEl.textContent = hoTen;

            const encodedName = encodeURIComponent(hoTen);
            const avatarSrc = user.AnhDaiDien || user.anhDaiDien
                || `https://ui-avatars.com/api/?name=${encodedName}&background=0D5A9C&color=fff`;

            if (avatarEl) {
                avatarEl.src = avatarSrc;
                avatarEl.onerror = function () {
                    this.src = `https://ui-avatars.com/api/?name=${encodedName}&background=0D5A9C&color=fff`;
                };
            }

            // Avatar trong Q&A
            if (qaAvatarEl) {
                const img = qaAvatarEl.querySelector("img");
                if (img) {
                    img.src = avatarSrc;
                    img.alt = user.hoTen || "User";
                }
            }
        } catch (e) {
            console.error("header-user: lỗi parse userData", e);
        }
    }

    // ── Toggle dropdown ─────────────────────────────────────────────
    function initUserMenuDropdown() {
        const wrapper = document.getElementById("userMenuWrapper");
        const dropdown = document.getElementById("userDropdown");
        const logoutBtn = document.getElementById("logoutBtn");

        if (!wrapper || !dropdown) return;

        // Đảm bảo wrapper có position:relative
        wrapper.style.position = "relative";

        wrapper.addEventListener("click", function (e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", function () {
            if (dropdown) dropdown.style.display = "none";
        });

        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                localStorage.removeItem("token");
                localStorage.removeItem("userData");
                window.location.href = "login.html";
            });
        }
    }

    // ── Notification badge ──────────────────────────────────────────
    async function loadNotifCount() {
        const badge = document.getElementById("notifBadge");
        if (!badge) return;
        const token = localStorage.getItem("token");
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
            // Không hiển thị lỗi — badge ẩn là ổn
        }
    }
})();
