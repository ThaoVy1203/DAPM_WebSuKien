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

    // Load sự kiện gần đây từ API SuKien
    await loadRecentEventsCatalog();

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
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!raw) return;
    try {
        const userObj = JSON.parse(raw);
        const idNguoiDung = userObj.IdNguoiDung || userObj.idNguoiDung || userObj.id;
        if (!idNguoiDung) return;

        const res = await fetch(`${API_BASE}/NguoiDung/${idNguoiDung}`, {
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
        const registrations = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

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

        const certElement = document.querySelector('.activity-stat-item:nth-child(3) .stat-number');
        if (certElement) certElement.textContent = attendedCount;

        // Update Diem Ren Luyen
        const statsScoreElement = document.querySelector('.stats-score');
        if (statsScoreElement) {
            const points = attendedCount * 5;
            statsScoreElement.textContent = points;

            const statsRankElement = document.querySelector('.stats-rank');
            if (statsRankElement) {
                let rank = "Trung bình";
                if (points >= 90) rank = "Xuất sắc";
                else if (points >= 80) rank = "Tốt";
                else if (points >= 65) rank = "Khá";
                else if (points >= 50) rank = "Trung bình";
                else rank = "Yếu";
                statsRankElement.textContent = `Hạng: ${rank}`;
            }
        }

    } catch (error) {
        console.error('Lỗi load thống kê:', error);
    }
}

// ==========================
// LOAD SỰ KIỆN GẦN ĐÂY TỪ CATALOG
// ==========================
async function loadRecentEventsCatalog() {
    try {
        const res = await fetch(`${API_BASE}/SuKien`);
        if (!res.ok) return;
        const events = await res.json();
        
        // Lọc các sự kiện đang hoạt động (không bị hủy hoặc từ chối)
        const activeEvents = events.filter(e => {
            const status = (e.trangThai || e.TrangThai || "").toLowerCase();
            return status !== "từ chối" && status !== "hủy" && status !== "nháp";
        });

        // Sắp xếp các sự kiện: Mới nhất lên trước
        activeEvents.sort((a, b) => {
            const dateA = new Date(a.thoiGianBatDau || a.ThoiGianBatDau);
            const dateB = new Date(b.thoiGianBatDau || b.ThoiGianBatDau);
            return dateB - dateA;
        });

        renderRecentEvents(activeEvents.slice(0, 2));
    } catch (error) {
        console.error('Lỗi load danh sách sự kiện gần đây:', error);
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
        const idSuKien = event.idSuKien || event.IdSuKien;

        const item = document.createElement('div');
        item.className = 'recent-event-item';
        item.style.cursor = 'pointer';
        item.onclick = () => {
            window.location.href = `event-detail.html?id=${idSuKien}`;
        };
        item.innerHTML = `
            <div class="event-date">
                <span class="date-day">${day}</span>
                <span class="date-month">${month}</span>
            </div>
            <div class="event-info">
                <h4 style="margin: 0; font-size: 14px; font-weight: 600;">${escapeHtml(tenSuKien)}</h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</p>
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
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!raw) return;
    try {
        const userObj = JSON.parse(raw);
        const idNguoiDung = userObj.IdNguoiDung || userObj.idNguoiDung || userObj.id;
        if (!idNguoiDung) return;

        const updatePayload = {
            hoTen: data.hoTen !== undefined ? data.hoTen : (userObj.hoTen || userObj.HoTen || ""),
            email: data.email !== undefined ? data.email : (userObj.email || userObj.Email || ""),
            sdt: data.sdt !== undefined ? data.sdt : (userObj.sdt || userObj.SDT || userObj.phone || ""),
            anhDaiDien: data.anhDaiDien !== undefined ? data.anhDaiDien : (userObj.anhDaiDien || userObj.AnhDaiDien || null),
            trangThai: userObj.trangThai !== undefined ? userObj.trangThai : (userObj.TrangThai !== undefined ? userObj.TrangThai : true)
        };

        const res = await fetch(`${API_BASE}/NguoiDung/${idNguoiDung}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatePayload)
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
// ĐỔI MẬT KHẨU
// ==========================
async function changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!raw) return;
    try {
        const userObj = JSON.parse(raw);
        const idNguoiDung = userObj.IdNguoiDung || userObj.idNguoiDung || userObj.id;
        if (!idNguoiDung) return;

        const res = await fetch(`${API_BASE}/NguoiDung/${idNguoiDung}/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const resText = await res.text();
        let resData = null;
        try {
            if (resText) {
                resData = JSON.parse(resText);
            }
        } catch (err) {
            console.warn("Response body is not JSON:", resText);
        }

        if (!res.ok) {
            throw new Error((resData && resData.message) || resText || `HTTP ${res.status}`);
        }

        showToast("Thay đổi mật khẩu thành công!", "success");
        return true;
    } catch (e) {
        console.error("Lỗi đổi mật khẩu:", e);
        showToast(e.message || "Không thể đổi mật khẩu.", "error");
        return false;
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
    // 1. Sửa thông tin cá nhân (hiển thị modal)
    document.getElementById("editPersonalInfo")?.addEventListener("click", () => {
        const raw = localStorage.getItem("userData") || localStorage.getItem("user");
        const user = raw ? JSON.parse(raw) : {};

        document.getElementById("editFullName").value = user.hoTen || user.HoTen || "";
        document.getElementById("editEmail").value = user.email || user.Email || "";
        document.getElementById("editPhone").value = user.sdt || user.SDT || user.phone || "";

        document.getElementById("editProfileModal").style.display = "flex";
    });

    // Close Personal Info Modal
    const closeEditModal = () => {
        document.getElementById("editProfileModal").style.display = "none";
    };
    document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
    document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);

    // Submit Personal Info Form
    document.getElementById("editProfileForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const hoTen = document.getElementById("editFullName").value.trim();
        const email = document.getElementById("editEmail").value.trim();
        const sdt = document.getElementById("editPhone").value.trim();

        if (!hoTen || !email) {
            showToast("Họ tên và Email không được để trống.", "error");
            return;
        }

        await updateProfile({ hoTen, email, sdt });
        closeEditModal();
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

    // 3. Button Xem Lịch sử / Vé
    document.querySelector(".btn-view-details")?.addEventListener("click", () => {
        window.location.href = "history.html";
    });

    // 4. Open Change Password Modal
    document.getElementById("changePasswordBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        
        document.getElementById("changePasswordModal").style.display = "flex";
    });

    // Close Change Password Modal
    const closePasswordModal = () => {
        document.getElementById("changePasswordModal").style.display = "none";
    };
    document.getElementById("closePasswordModal")?.addEventListener("click", closePasswordModal);
    document.getElementById("cancelPasswordBtn")?.addEventListener("click", closePasswordModal);

    // Submit Change Password Form
    document.getElementById("changePasswordForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            showToast("Mật khẩu mới và xác nhận mật khẩu không khớp.", "error");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Mật khẩu mới phải từ 6 ký tự trở lên.", "error");
            return;
        }

        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            closePasswordModal();
        }
    });

    // 5. Click outside modals to close
    window.addEventListener("click", (e) => {
        const editModal = document.getElementById("editProfileModal");
        const pwdModal = document.getElementById("changePasswordModal");
        if (e.target === editModal) {
            editModal.style.display = "none";
        }
        if (e.target === pwdModal) {
            pwdModal.style.display = "none";
        }
    });

    // 6. Menu Đăng xuất
    document.querySelectorAll(".setting-item").forEach(item => {
        item.addEventListener("click", function (e) {
            if (this.id === "changePasswordBtn") {
                return;
            }
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