// js/profile.js
const API_BASE = "https://localhost:7160/api";

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Điền ngay từ localStorage để tránh màn hình trống
    prefillFromLocalStorage();

    // Sau đó load từ API để cập nhật mới nhất
    await loadUserProfile();
    setupEventListeners();
});

// ==========================
// ĐIỀN TỪ LOCALSTORAGE (nhanh)
// ==========================
function prefillFromLocalStorage() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        fillProfileUI(user);
    } catch (e) { /* bỏ qua */ }
}

// ==========================
// LOAD PROFILE TỪ API
// ==========================
async function loadUserProfile() {
    const token = localStorage.getItem("token");
    try {
        // Thử endpoint profile trước
        const res = await fetch(`${API_BASE}/NguoiDung/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const user = await res.json();
        fillProfileUI(user);

        // Cập nhật lại localStorage
        const existing = JSON.parse(localStorage.getItem("userData") || "{}");
        localStorage.setItem("userData", JSON.stringify({ ...existing, ...user }));

    } catch (e) {
        console.warn("Không load được profile từ API, dùng localStorage:", e.message);
        // Đã prefill từ localStorage rồi, không cần làm gì thêm
    }
}

// ==========================
// ĐIỀN DỮ LIỆU VÀO UI
// ==========================
function fillProfileUI(user) {
    if (!user) return;

    // Header
    setText("profileName", user.hoTen || "Người dùng");
    setText("profileSSO", user.maSoSSO || user.maSinhVien || "-");
    const vaiTros = user.vaiTros || [];
    setText("profileRole", vaiTros[0] || "Thành viên");

    // Thông tin cá nhân
    setText("profileEmail", user.email || "-");
    setText("profilePhone", user.SDT || user.sdt || user.phone || "-");
    setText("profileSSOInfo", user.maSoSSO || "-");
    setText("profileRoleInfo", vaiTros.join(", ") || "-");

    // Avatar
    const avatarEl = document.querySelector(".profile-avatar");
    if (avatarEl) {
        const name = encodeURIComponent(user.hoTen || "User");
        avatarEl.src = user.anhDaiDien
            || `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff&size=150`;
        avatarEl.onerror = function () {
            this.src = `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff&size=150`;
        };
    }
}

// ==========================
// CẬP NHẬT PROFILE
// ==========================
async function updateProfile(data) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/NguoiDung/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast("Cập nhật thành công!", "success");
        await loadUserProfile();

    } catch (e) {
        console.error("Lỗi cập nhật profile:", e);
        showToast("Không thể cập nhật hồ sơ. Vui lòng thử lại.", "error");
    }
}

// ==========================
// UPLOAD AVATAR
// ==========================
async function uploadAvatar(file) {
    const token = localStorage.getItem("token");
    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/NguoiDung/upload-avatar`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast("Cập nhật ảnh thành công!", "success");
        await loadUserProfile();

    } catch (e) {
        console.error("Lỗi upload avatar:", e);
        showToast("Không thể upload ảnh.", "error");
    }
}

// ==========================
// EVENT LISTENERS
// ==========================
function setupEventListeners() {
    // Sửa thông tin cá nhân
    document.getElementById("editPersonalInfo")?.addEventListener("click", () => {
        const raw = localStorage.getItem("userData");
        const user = raw ? JSON.parse(raw) : {};
        const newName = prompt("Nhập họ tên mới:", user.hoTen || "");
        if (newName && newName.trim()) {
            updateProfile({ hoTen: newName.trim() });
        }
    });

    // Upload avatar
    document.querySelector(".edit-avatar-btn")?.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) uploadAvatar(file);
        };
        input.click();
    });

    // Toggle sở thích
    document.querySelectorAll(".interest-tag").forEach(tag => {
        tag.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });

    // Đăng xuất (trong setting-item)
    document.querySelectorAll(".setting-item").forEach(item => {
        item.addEventListener("click", function () {
            const title = this.querySelector("h4")?.textContent?.trim();
            if (title === "Đăng xuất") {
                if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userData");
                    window.location.href = "login.html";
                }
            }
        });
    });
}

// ==========================
// HELPERS
// ==========================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showToast(msg, type = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;
        background:${type === "success" ? "#276749" : "#c53030"};
        color:white;box-shadow:0 4px 12px rgba(0,0,0,0.2);
        animation:fadeIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
