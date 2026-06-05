// js/profile.js
const API_BASE = "http://localhost:5103/api";

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

    // Load profile từ API để cập nhật mới nhất
    await loadUserProfile();
    
    // Load thống kê sự kiện (từ lịch sử)
    await loadUserStatistics();

    setupEventListeners();
});

// ==========================
// ĐIỀN TỪ LOCALSTORAGE (nhanh)
// ==========================
function prefillFromLocalStorage() {
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
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
    }
}

// ==========================
// ĐIỀN DỮ LIỆU VÀO UI
// ==========================
function fillProfileUI(user) {
    if (!user) return;

    // Lấy dữ liệu (hỗ trợ cả chuẩn camelCase và PascalCase)
    const hoTen = user.hoTen || user.HoTen || "Người dùng";
    const email = user.email || user.Email || "Chưa cập nhật";
    const sdt = user.sdt || user.SDT || user.phone || "Chưa cập nhật";
    const maSo = user.maSoSSO || user.maSinhVien || user.idNguoiDung || user.IdNguoiDung || "-";
    const vaiTros = user.vaiTros || user.VaiTros || [];
    const role = vaiTros[0] || "Thành viên";

    // 1. Cập nhật theo ID (Chuẩn nhánh mới)
    setText("profileName", hoTen);
    setText("profileSSO", maSo);
    setText("profileRole", role);
    setText("profileEmail", email);
    setText("profilePhone", sdt);
    setText("profileSSOInfo", maSo);
    setText("profileRoleInfo", vaiTros.join(", ") || role);

    // 2. Cập nhật theo Class (Fallback cho bản HTML cũ từ HEAD)
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = hoTen);
    
    const idEl = document.querySelector('.profile-meta span:first-child');
    if (idEl && !document.getElementById("profileSSO")) {
        idEl.innerHTML = `<i class="fas fa-id-card"></i> ID: ${maSo}`;
    }
    const emailEl = document.querySelector('.info-item:nth-child(1) p');
    if (emailEl && !document.getElementById("profileEmail")) {
        emailEl.textContent = email;
    }
    const phoneEl = document.querySelector('.info-item:nth-child(2) p');
    if (phoneEl && !document.getElementById("profilePhone")) {
        phoneEl.textContent = sdt;
    }

    // 3. Avatar
    const avatarUrl = user.anhDaiDien || user.AnhDaiDien 
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0D5A9C&color=fff&size=150`;
    
    document.querySelectorAll(".profile-avatar, .user-avatar").forEach(el => {
        el.src = avatarUrl;
        el.onerror = function () {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0D5A9C&color=fff&size=150`;
        };
    });
}

// ==========================
// LOAD THỐNG KÊ (Khôi phục từ HEAD)
// ==========================
async function loadUserStatistics() {
    try {
        const token = localStorage.getItem("token");
        const raw = localStorage.getItem("userData") || localStorage.getItem("user");
        if (!raw) return;
        
        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;

        if (!idNguoiDung) return;

        // Fetch danh sách đăng ký của user hiện tại
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();
        const registrations = Array.isArray(data) ? data : (data.items || data.data || []);

        // Đếm số lượng
        const attendedCount = registrations.filter(r => 
            (r.trangThai || r.TrangThai) === 'Đã tham gia' || 
            (r.trangThai || r.TrangThai) === 'Hoàn thành'
        ).length;

        const upcomingEvents = registrations.filter(r => 
            (r.trangThai || r.TrangThai) === 'Đã xác nhận' || 
            (r.trangThai || r.TrangThai) === 'Chờ xác nhận'
        );

        // Update UI Thống kê
        const attendedElement = document.querySelector('.activity-stat-item:nth-child(1) .stat-number');
        if (attendedElement) attendedElement.textContent = attendedCount;
        
        const upcomingElement = document.querySelector('.activity-stat-item:nth-child(2) .stat-number');
        if (upcomingElement) upcomingElement.textContent = upcomingEvents.length;

        // Update UI Sự kiện gần đây
        renderRecentEvents(upcomingEvents.slice(0, 2));

    } catch (error) {
        console.error('Lỗi load thống kê:', error);
    }
}

function renderRecentEvents(events) {
    const container = document.querySelector('.recent-events');
    if (!container) return;
    
    const title = container.querySelector('h3');
    container.innerHTML = '';
    if (title) container.appendChild(title);

    if (events.length === 0) {
        container.innerHTML += '<p style="color:#666; font-size:14px; margin-top:10px;">Chưa có sự kiện sắp tới.</p>';
        return;
    }

    events.forEach(event => {
        const batDau = event.thoiGianBatDau || event.ThoiGianBatDau;
        const startDate = batDau ? new Date(batDau) : new Date();
        const day = startDate.getDate();
        const month = `T${startDate.getMonth() + 1}`;
        const tenSuKien = event.tenSuKien || event.TenSuKien || "Sự kiện";
        const diaDiem = event.tenDiaDiem || event.TenDiaDiem || "Chưa xác định";

        const item = document.createElement('div');
        item.className = 'recent-event-item';
        item.innerHTML = `
            <div class="event-date">
                <span class="date-day">${day}</span>
                <span class="date-month">${month}</span>
            </div>
            <div class="event-info">
                <h4>${escapeHtml(tenSuKien)}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</p>
            </div>
        `;
        container.appendChild(item);
    });
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
    // 1. Sửa thông tin cá nhân
    document.getElementById("editPersonalInfo")?.addEventListener("click", () => {
        const raw = localStorage.getItem("userData") || localStorage.getItem("user");
        const user = raw ? JSON.parse(raw) : {};
        const newName = prompt("Nhập họ tên mới:", user.hoTen || user.HoTen || "");
        if (newName && newName.trim()) {
            updateProfile({ hoTen: newName.trim() });
        }
    });

    // 2. Upload avatar
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

    // 3. Toggle Tags Sở thích
    document.querySelectorAll(".interest-tag").forEach(tag => {
        tag.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });

    // 4. Button Lưu Sở Thích
    document.getElementById("editInterests")?.addEventListener("click", () => {
        const activeTags = Array.from(document.querySelectorAll('.interest-tag.active span'))
                                .map(span => span.textContent);
        showToast(`Đã lưu ${activeTags.length} sở thích! Tính năng API đang phát triển.`, "info");
    });

    // 5. Button Xem Lịch sử / Vé
    document.querySelector(".btn-view-details")?.addEventListener("click", () => {
        window.location.href = "history.html";
    });

    // 6. Menu Cài đặt & Đăng xuất
    document.querySelectorAll(".setting-item").forEach(item => {
        item.addEventListener("click", function () {
            const isDanger = this.classList.contains("danger");
            const title = this.querySelector("h4")?.textContent?.trim();
            
            if (isDanger || title === "Đăng xuất") {
                if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userData");
                    localStorage.removeItem("user");
                    sessionStorage.clear();
                    window.location.href = "login.html";
                }
            } else {
                showToast("Tính năng này đang được phát triển.", "info");
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

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}

function showToast(msg, type = "success") {
    // Xóa toast cũ nếu có
    const oldToast = document.querySelector('.custom-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = 'custom-toast';
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:99999;
        padding:14px 24px; border-radius:10px; font-size:14px; font-weight:500;
        background: ${type === "success" ? "#059669" : (type === "info" ? "#0D5A9C" : "#dc2626")};
        color: white; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        display: flex; align-items: center; gap: 12px;
        animation: fadeIn 0.3s ease;
    `;
    
    const iconClass = type === "success" ? "fa-check-circle" : (type === "info" ? "fa-info-circle" : "fa-times-circle");
    toast.innerHTML = `<i class="fas ${iconClass}" style="font-size: 18px;"></i> <span>${msg}</span>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.4s ease";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}