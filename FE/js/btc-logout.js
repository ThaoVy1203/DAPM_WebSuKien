/**
 * btc-logout.js
 * Script dùng chung cho TẤT CẢ trang BTC.
 * - Bind nút đăng xuất trong sidebar
 * - Điền tên/avatar người dùng vào header
 * Include ở cuối body, SAU btc-auth.js và script chính của trang.
 */
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        bindLogoutButtons();
        fillBTCUserInfo();
    });

    // ── Bind TẤT CẢ nút/link đăng xuất ──────────────────────────────
    function bindLogoutButtons() {
        // Tìm theo nhiều cách: class danger, id logoutBtn, text "Đăng xuất"
        const selectors = [
            '.nav-item.danger',
            '#logoutBtn',
            'a[onclick*="logout"]'
        ];

        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                // Xóa onclick inline cũ để tránh gọi 2 lần
                el.removeAttribute("onclick");
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    doLogout();
                });
            });
        });

        // Tìm thêm theo text content
        document.querySelectorAll("a, button").forEach(el => {
            const text = el.textContent.trim();
            if (text === "Đăng xuất" || text.includes("Đăng xuất")) {
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    doLogout();
                });
            }
        });
    }

    // ── Thực hiện đăng xuất ──────────────────────────────────────────
    function doLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        window.location.href = "login.html";
    }

    // ── Điền thông tin user vào header BTC ───────────────────────────
    function fillBTCUserInfo() {
        const raw = localStorage.getItem("userData");
        if (!raw) return;

        try {
            const user = JSON.parse(raw);
            const hoTen = user.hoTen || "Người dùng";
            const vaiTros = user.vaiTros || [];
            const isTruong = vaiTros.includes("TruongBanToChuc");
            const roleText = isTruong ? "Trưởng Ban Tổ chức" : "Thành viên Ban Tổ chức";
            const avatarSrc = user.anhDaiDien
                || `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0D5A9C&color=fff`;

            // Điền tên
            const nameEls = document.querySelectorAll(
                ".user-name, #userName, [id='userName']"
            );
            nameEls.forEach(el => { el.textContent = hoTen; });

            // Điền vai trò
            const roleEls = document.querySelectorAll(
                ".user-role, #userRole, [id='userRole']"
            );
            roleEls.forEach(el => { el.textContent = roleText; });

            // Điền avatar
            const avatarEls = document.querySelectorAll(
                ".user-avatar, #userAvatar, [id='userAvatar']"
            );
            avatarEls.forEach(el => {
                if (el.tagName === "IMG") {
                    el.src = avatarSrc;
                    el.onerror = function () {
                        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0D5A9C&color=fff`;
                    };
                }
            });

        } catch (e) {
            console.error("btc-logout: lỗi parse userData", e);
        }
    }
})();
