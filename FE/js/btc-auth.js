// BTC Authorization Management
// Sửa: đọc đúng field vaiTros từ API và localStorage

if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
}

// User roles — khớp với tenVaiTro trong DB
const BTC_ROLES = {
    LEADER: 'TruongBanToChuc',
    MEMBER: 'ThanhVienBanToChuc'
};

// Quyền theo vai trò
// Trưởng BTC có toàn quyền, Thành viên BTC bị giới hạn
const PERMISSIONS = {
    [BTC_ROLES.LEADER]: {
        canAccessDashboard: true,
        canAccessEvents: true,
        canAccessBudget: true,
        canAccessApproval: true,
        canAccessTasks: true,
        canAccessAttendance: true,
        canAccessReports: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canViewAll: true
    },
    [BTC_ROLES.MEMBER]: {
        canAccessDashboard: true,
        canAccessEvents: true,
        canAccessBudget: false,
        canAccessApproval: false,
        canAccessTasks: true,
        canAccessAttendance: false,
        canAccessReports: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canViewAll: false,
        canUpdateTaskStatus: true
    }
};

let currentUser = null;

// ==========================
// LOAD USER — ưu tiên localStorage, fallback API
// ==========================
async function loadCurrentUser() {
    // 1. Thử lấy từ localStorage trước (nhanh, không cần network)
    const raw = localStorage.getItem("userData");
    if (raw) {
        try {
            currentUser = JSON.parse(raw);
            console.log("BTC Auth - user từ localStorage:", currentUser);
            return currentUser;
        } catch (e) { /* bỏ qua */ }
    }

    // 2. Fallback: gọi API
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "login.html";
            return null;
        }

        const res = await fetch(`${window.API_BASE}/Auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error("Không lấy được user");

        currentUser = await res.json();
        console.log("BTC Auth - user từ API:", currentUser);
        return currentUser;

    } catch (error) {
        console.error("Lỗi load user:", error);
        // Không redirect — để trang tự xử lý
        return null;
    }
}

// ==========================
// LẤY VAI TRÒ HIỆN TẠI
// Hỗ trợ cả field: vaiTros (mảng), role (string), vaiTro (string)
// ==========================
function getCurrentUserRole() {
    if (!currentUser) return BTC_ROLES.MEMBER;

    // Trường hợp 1: vaiTros là mảng (cấu trúc từ login.js)
    const vaiTros = currentUser.vaiTros || currentUser.roles || [];
    if (Array.isArray(vaiTros) && vaiTros.length > 0) {
        if (vaiTros.includes(BTC_ROLES.LEADER)) return BTC_ROLES.LEADER;
        if (vaiTros.includes(BTC_ROLES.MEMBER)) return BTC_ROLES.MEMBER;
        // Hỗ trợ tên cũ (lowercase)
        if (vaiTros.includes('truong_btc')) return BTC_ROLES.LEADER;
        if (vaiTros.includes('thanh_vien_btc')) return BTC_ROLES.MEMBER;
    }

    // Trường hợp 2: role là string đơn
    const role = currentUser.role || currentUser.vaiTro || "";
    if (role === BTC_ROLES.LEADER || role === 'truong_btc') return BTC_ROLES.LEADER;
    if (role === BTC_ROLES.MEMBER || role === 'thanh_vien_btc') return BTC_ROLES.MEMBER;

    // Trường hợp 3: idVaiTro (số) — theo dữ liệu mẫu: 3=TruongBanToChuc, 4=ThanhVienBanToChuc
    const idVaiTro = currentUser.idVaiTro;
    if (idVaiTro === 3) return BTC_ROLES.LEADER;
    if (idVaiTro === 4) return BTC_ROLES.MEMBER;

    // Mặc định: nếu không xác định được → cấp quyền Trưởng BTC
    // (tránh block người dùng hợp lệ)
    console.warn("BTC Auth: không xác định được vai trò, cấp quyền Trưởng BTC mặc định");
    return BTC_ROLES.LEADER;
}

// ==========================
// KIỂM TRA QUYỀN
// ==========================
function hasPermission(permissionKey) {
    const role = getCurrentUserRole();
    const perms = PERMISSIONS[role];
    if (!perms) return true; // Không tìm thấy config → cho phép
    return perms[permissionKey] !== false; // undefined cũng coi là có quyền
}

// ==========================
// KHỞI TẠO SIDEBAR
// ==========================
function initializeSidebarPermissions() {
    const role = getCurrentUserRole();
    const permissions = PERMISSIONS[role] || PERMISSIONS[BTC_ROLES.LEADER];

    const sidebarItems = [
        { selector: 'a[href="btc-dashboard.html"]', permission: 'canAccessDashboard' },
        { selector: 'a[href="btc-events.html"]', permission: 'canAccessEvents' },
        { selector: 'a[href="btc-budget.html"]', permission: 'canAccessBudget' },
        { selector: 'a[href="btc-approval.html"]', permission: 'canAccessApproval' },
        { selector: 'a[href="btc-team-tasks.html"]', permission: 'canAccessTasks' },
        { selector: 'a[href="btc-attendance.html"]', permission: 'canAccessAttendance' },
        { selector: 'a[href="btc-reports.html"]', permission: 'canAccessReports' }
    ];

    sidebarItems.forEach(item => {
        const element = document.querySelector(item.selector);
        if (!element) return;

        if (permissions[item.permission] === false) {
            // Chỉ disable nếu rõ ràng là false
            element.classList.add("disabled");
            element.addEventListener("click", function (e) {
                e.preventDefault();
                showPermissionDeniedMessage();
            });
        } else {
            // Đảm bảo không bị disabled nhầm
            element.classList.remove("disabled");
        }
    });

    updateUserRoleDisplay(role);
}

// ==========================
// KIỂM TRA QUYỀN TRUY CẬP TRANG
// ==========================
function checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop();

    const pagePermissions = {
        'btc-budget.html':     'canAccessBudget',
        'btc-approval.html':   'canAccessApproval',
        'btc-attendance.html': 'canAccessAttendance',
        'btc-reports.html':    'canAccessReports'
    };

    const permKey = pagePermissions[currentPage];
    if (!permKey) return true; // Trang không cần kiểm tra

    if (!hasPermission(permKey)) {
        alert("Bạn không có quyền truy cập trang này.\nChỉ Trưởng Ban Tổ chức mới có quyền.");
        window.location.href = "btc-dashboard.html";
        return false;
    }

    return true;
}

// ==========================
// HIỂN THỊ TÊN VAI TRÒ
// ==========================
function updateUserRoleDisplay(role) {
    const roleEl = document.querySelector(".user-role");
    if (!roleEl) return;
    roleEl.textContent =
        role === BTC_ROLES.LEADER ? "Trưởng Ban Tổ chức" : "Thành viên Ban Tổ chức";
}

// ==========================
// THÔNG BÁO KHÔNG CÓ QUYỀN
// ==========================
function showPermissionDeniedMessage() {
    alert("Chức năng này chỉ dành cho Trưởng Ban Tổ chức.");
}

// ==========================
// LOAD TASKS
// ==========================
async function loadAssignedTasks() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/Task/my-tasks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (err) {
        console.error("Lỗi load task:", err);
        return [];
    }
}

// ==========================
// CẬP NHẬT TRẠNG THÁI TASK
// ==========================
async function submitTaskStatusUpdate() {
    const taskId = document.getElementById('taskSelectForUpdate')?.value;
    const status = document.getElementById('newTaskStatus')?.value;
    const progress = document.getElementById('taskProgress')?.value;
    const notes = document.getElementById('taskUpdateNotes')?.value;

    if (!taskId || !status) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/Task/update-status/${taskId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status, progress, notes })
        });
        if (!res.ok) throw new Error();
        alert("Cập nhật thành công");
        location.reload();
    } catch (error) {
        console.error(error);
        alert("Lỗi cập nhật trạng thái");
    }
}

// ==========================
// ROLE BADGE
// ==========================
function addRoleBadge() {
    const role = getCurrentUserRole();
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;

    // Xóa badge cũ nếu có
    userInfo.querySelector('.role-badge')?.remove();

    const badge = document.createElement('span');
    badge.className = 'role-badge';
    badge.textContent = role === BTC_ROLES.LEADER ? 'Trưởng ban' : 'Thành viên';
    userInfo.appendChild(badge);
}

// ==========================
// HIỂN THỊ THÔNG TIN NGƯỜI DÙNG (Tên, Avatar)
// ==========================
function updateUserProfileDisplay() {
    if (!currentUser) return;
    
    const nameEl = document.querySelector(".user-name");
    const avatarEl = document.querySelector(".user-avatar");
    
    const userName = currentUser.hoTen || currentUser.name || "Người dùng";
    
    if (nameEl) {
        nameEl.textContent = userName;
    }
    
    if (avatarEl) {
        if (currentUser.anhDaiDien) {
            avatarEl.src = currentUser.anhDaiDien;
        } else {
            const nameToUrl = encodeURIComponent(userName);
            avatarEl.src = `https://ui-avatars.com/api/?name=${nameToUrl}&background=0D5A9C&color=fff`;
        }
    }
}

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    await loadCurrentUser();
    initializeSidebarPermissions();
    checkPageAccess();
    addRoleBadge();
    updateUserProfileDisplay();
});

// Export
window.BTCAuth = {
    getCurrentUserRole,
    hasPermission,
    submitTaskStatusUpdate,
    BTC_ROLES
};
