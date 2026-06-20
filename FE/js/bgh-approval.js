// bgh-approval.js — Phê duyệt Cấp 2 (Ban Giám Hiệu / P.CTSV)
// Logic: Cấp 2 xem TẤT CẢ hồ sơ, nhưng chỉ duyệt được hồ sơ đã qua Cấp 1

const API_BASE = "http://localhost:5103/api";

let allEvents = [];       // Tất cả sự kiện từ API
let currentId = null;     // ID sự kiện đang xử lý
let currentFilter = "all";

// ── Trạng thái phân cấp ────────────────────────────────────────────
// Theo DB: trangThai IN ('Nháp','Chờ duyệt','Đã duyệt','Từ chối','Đang diễn ra','Kết thúc','Hủy')
// HoSoSuKien.trangThaiDuyet: 'Chờ duyệt' | 'Đã duyệt cấp 1' | 'Đã duyệt cấp 2' | 'Từ chối'

function getApprovalLevel(event) {
    // Dựa vào trangThai của SuKien và trangThaiDuyet của HoSo
    const ts = event.trangThai || "";
    const hoSo = event.trangThaiDuyet || event.hoSo?.trangThaiDuyet || "";

    if (ts === "Đã duyệt" || hoSo === "Đã duyệt cấp 2") return "approved";
    if (ts === "Từ chối"  || hoSo === "Từ chối")          return "rejected";
    if (hoSo === "Đã duyệt cấp 1")                        return "cap2-ready";  // Đã qua cấp 1, chờ cấp 2
    return "cap1-only";  // Chưa qua cấp 1
}

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    if (!checkAuth()) return;
    loadUserInfo();
    await loadAllEvents();
    initTabs();
    initSearch();
    initLogout();
});

// ── AUTH ───────────────────────────────────────────────────────────
function checkAuth() {
    const token = localStorage.getItem("token");
    const raw   = localStorage.getItem("userData");
    if (!token || !raw) { window.location.href = "login.html"; return false; }
    try {
        const user = JSON.parse(raw);
        if (!(user.vaiTros || []).includes("CanBoPheDuyetCap2")) {
            window.location.href = "../index.html";
            return false;
        }
    } catch (e) { window.location.href = "login.html"; return false; }
    return true;
}

function loadUserInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        const nameEl   = document.getElementById("userName");
        const avatarEl = document.getElementById("userAvatar");
        if (nameEl) nameEl.textContent = user.hoTen || "Cán bộ";
        if (avatarEl) {
            const n = encodeURIComponent(user.hoTen || "BGH");
            avatarEl.src = user.anhDaiDien
                || `https://ui-avatars.com/api/?name=${n}&background=dc2626&color=fff`;
        }
    } catch (e) { /* bỏ qua */ }
}

// ── LOAD TẤT CẢ SỰ KIỆN ───────────────────────────────────────────
async function loadAllEvents() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("approvalList");

    try {
        // Lấy tất cả sự kiện (cấp 2 có quyền xem hết)
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        allEvents = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

        updateStats();
        renderEvents(allEvents);

    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                Không thể tải dữ liệu. Vui lòng thử lại sau.
            </div>`;
    }
}

// ── CẬP NHẬT THỐNG KÊ ─────────────────────────────────────────────
function updateStats() {
    const total        = allEvents.length;
    const pendingCap1  = allEvents.filter(e => getApprovalLevel(e) === "cap1-only").length;
    const waitingCap2  = allEvents.filter(e => getApprovalLevel(e) === "cap2-ready").length;
    const approved     = allEvents.filter(e => getApprovalLevel(e) === "approved").length;
    const rejected     = allEvents.filter(e => getApprovalLevel(e) === "rejected").length;

    setText("statTotal",       total);
    setText("statPendingCap1", pendingCap1);
    setText("statWaitingCap2", waitingCap2);
    setText("statApproved",    approved);
    setText("statRejected",    rejected);
}

// ── RENDER DANH SÁCH ──────────────────────────────────────────────
function renderEvents(events) {
    const container = document.getElementById("approvalList");
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#666;">
                <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                Không có hồ sơ nào.
            </div>`;
        return;
    }

    container.innerHTML = "";
    events.forEach(event => {
        const level = getApprovalLevel(event);
        container.appendChild(buildEventCard(event, level));
    });
}

function buildEventCard(event, level) {
    const div = document.createElement("div");
    div.className = `approval-item ${level}`;
    div.dataset.id = event.idSuKien;

    const startDate = event.thoiGianBatDau
        ? new Date(event.thoiGianBatDau).toLocaleDateString("vi-VN")
        : "Chưa có";
    const diaDiem = event.tenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";
    const nguoiTao = event.tenNguoiTao || event.nguoiTao?.hoTen || "Không rõ";

    // Badge trạng thái
    let badgeHtml = "";
    if (level === "cap2-ready") {
        badgeHtml = `<span class="badge-cap1">✓ Đã qua Cấp 1</span>
                     <span class="badge-cap2-wait">⏳ Chờ duyệt Cấp 2</span>`;
    } else if (level === "cap1-only") {
        badgeHtml = `<span class="badge-pending-cap1">⏳ Chờ duyệt Cấp 1</span>`;
    } else if (level === "approved") {
        badgeHtml = `<span class="badge-cap1">✓ Đã duyệt Cấp 2</span>`;
    } else if (level === "rejected") {
        badgeHtml = `<span class="badge-rejected">✗ Từ chối</span>`;
    }

    // Nút hành động
    let actionsHtml = `
        <button class="btn-view" onclick="viewDetail(${event.idSuKien})">
            <i class="fas fa-eye"></i> Xem chi tiết
        </button>`;

    if (level === "cap2-ready") {
        // Đã qua cấp 1 → cấp 2 có thể duyệt
        actionsHtml += `
            <button class="btn-reject" onclick="openRejectModal(${event.idSuKien}, '${escapeHtml(event.tenSuKien)}')">
                <i class="fas fa-times"></i> Từ chối
            </button>
            <button class="btn-approve" onclick="openApproveModal(${event.idSuKien}, '${escapeHtml(event.tenSuKien)}')">
                <i class="fas fa-check"></i> Phê duyệt chính thức
            </button>`;
    } else if (level === "cap1-only") {
        // Chưa qua cấp 1 → chỉ xem
        actionsHtml += `
            <div class="notice-cap1">
                <i class="fas fa-lock"></i>
                Hồ sơ chưa được Cấp 1 phê duyệt. Cấp 2 không thể duyệt trực tiếp.
            </div>`;
    }

    div.innerHTML = `
        <div class="approval-header">
            <div class="approval-info">
                ${badgeHtml}
                <span class="approval-id">#SK${event.idSuKien}</span>
                <span class="approval-date">
                    <i class="fas fa-calendar"></i> ${startDate}
                </span>
            </div>
        </div>
        <div class="approval-body">
            <h3>${escapeHtml(event.tenSuKien || "Chưa có tên")}</h3>
            <div class="approval-meta">
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>Người tạo: <strong>${escapeHtml(nguoiTao)}</strong></span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Địa điểm: <strong>${escapeHtml(diaDiem)}</strong></span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>Sức chứa: <strong>${event.soLuongToiDa ? event.soLuongToiDa + " người" : "Không giới hạn"}</strong></span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-info-circle"></i>
                    <span>Trạng thái: <strong>${escapeHtml(event.trangThai || "-")}</strong></span>
                </div>
            </div>
            ${event.moTa ? `<div class="approval-description"><p>${escapeHtml(event.moTa)}</p></div>` : ""}
        </div>
        <div class="approval-footer">
            ${actionsHtml}
        </div>`;

    return div;
}

// ── XEM CHI TIẾT ──────────────────────────────────────────────────
function viewDetail(id) {
    window.location.href = `event-detail.html?id=${id}`;
}

// ── MODAL PHÊ DUYỆT ───────────────────────────────────────────────
function openApproveModal(id, name) {
    currentId = id;
    const el = document.getElementById("approveEventName");
    if (el) el.textContent = name || `Sự kiện #${id}`;
    document.getElementById("approveComment").value = "";
    document.getElementById("approveModal").classList.add("active");
}

function closeApproveModal() {
    document.getElementById("approveModal").classList.remove("active");
    currentId = null;
}

async function confirmApprove() {
    if (!currentId) return;
    const token   = localStorage.getItem("token");
    const comment = document.getElementById("approveComment").value.trim();
    const notify  = document.getElementById("notifyOrganizer").checked;

    const btn = document.querySelector("#approveModal .btn-submit.success");
    if (btn) { btn.disabled = true; btn.textContent = "Đang xử lý..."; }

    try {
        // Gọi API phê duyệt cấp 2
        const res = await fetch(`${API_BASE}/SuKien/${currentId}/duyet`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                capDuyet: "Cấp 2 - P.CTSV",
                ketQua: "Đồng ý",
                ghiChu: comment || "Phê duyệt chính thức bởi Ban Giám Hiệu",
                guiThongBao: notify
            })
        });

        if (res.ok) {
            showToast("Phê duyệt chính thức thành công!", "success");
            closeApproveModal();
            await loadAllEvents();
        } else {
            const data = await res.json().catch(() => ({}));
            showToast(data.message || "Phê duyệt thất bại. Vui lòng thử lại.", "error");
        }
    } catch (e) {
        console.error("Lỗi phê duyệt:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Xác nhận phê duyệt'; }
    }
}

// ── MODAL TỪ CHỐI ─────────────────────────────────────────────────
function openRejectModal(id, name) {
    currentId = id;
    const el = document.getElementById("rejectEventName");
    if (el) el.textContent = name || `Sự kiện #${id}`;
    document.getElementById("rejectReason").value = "";
    document.getElementById("rejectSuggestion").value = "";
    document.getElementById("rejectModal").classList.add("active");
}

function closeRejectModal() {
    document.getElementById("rejectModal").classList.remove("active");
    currentId = null;
}

async function confirmReject() {
    if (!currentId) return;
    const reason = document.getElementById("rejectReason").value.trim();
    if (!reason) {
        showToast("Vui lòng nhập lý do từ chối.", "error");
        return;
    }

    const token      = localStorage.getItem("token");
    const suggestion = document.getElementById("rejectSuggestion").value.trim();

    const btn = document.querySelector("#rejectModal .btn-submit.danger");
    if (btn) { btn.disabled = true; btn.textContent = "Đang xử lý..."; }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${currentId}/duyet`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                capDuyet: "Cấp 2 - P.CTSV",
                ketQua: "Từ chối",
                ghiChu: suggestion ? `${reason}. Gợi ý: ${suggestion}` : reason
            })
        });

        if (res.ok) {
            showToast("Đã từ chối hồ sơ.", "success");
            closeRejectModal();
            await loadAllEvents();
        } else {
            const data = await res.json().catch(() => ({}));
            showToast(data.message || "Từ chối thất bại. Vui lòng thử lại.", "error");
        }
    } catch (e) {
        console.error("Lỗi từ chối:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-times"></i> Xác nhận từ chối'; }
    }
}

// ── TABS ──────────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentFilter = this.dataset.filter;
            applyFilter();
        });
    });
}

function applyFilter() {
    let filtered = [...allEvents];
    if (currentFilter !== "all") {
        filtered = allEvents.filter(e => getApprovalLevel(e) === currentFilter);
    }
    // Áp dụng thêm tìm kiếm nếu có
    const keyword = document.getElementById("searchInput")?.value.trim().toLowerCase();
    if (keyword) {
        filtered = filtered.filter(e =>
            (e.tenSuKien || "").toLowerCase().includes(keyword) ||
            String(e.idSuKien).includes(keyword)
        );
    }
    renderEvents(filtered);
}

// ── TÌM KIẾM ─────────────────────────────────────────────────────
function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    input.addEventListener("input", applyFilter);
}

// ── ĐĂNG XUẤT ────────────────────────────────────────────────────
function initLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        window.location.href = "login.html";
    });
}

// ── XUẤT DANH SÁCH ───────────────────────────────────────────────
function exportList() {
    showToast("Tính năng xuất danh sách đang được phát triển.", "info");
}

// ── DUYỆT HÀNG LOẠT ─────────────────────────────────────────────
async function bulkApprove() {
    const cap2Ready = allEvents.filter(e => getApprovalLevel(e) === "cap2-ready");
    if (cap2Ready.length === 0) {
        showToast("Không có hồ sơ nào đủ điều kiện duyệt hàng loạt (cần đã qua Cấp 1).", "error");
        return;
    }
    if (confirm(`Bạn có chắc muốn phê duyệt ${cap2Ready.length} hồ sơ đã qua Cấp 1?`)) {
        showToast(`Đang phê duyệt ${cap2Ready.length} hồ sơ...`, "info");
        const token = localStorage.getItem("token");
        let successCount = 0;
        let failCount = 0;

        await Promise.allSettled(cap2Ready.map(async event => {
            try {
                const res = await fetch(`${API_BASE}/SuKien/${event.idSuKien}/duyet`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        capDuyet: "Cấp 2 - BGH",
                        ketQua: "Đồng ý",
                        ghiChu: "Phê duyệt hàng loạt bởi Ban Giám Hiệu",
                        guiThongBao: true
                    })
                });
                if (res.ok) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
        }));

        if (successCount > 0 && failCount === 0) {
            showToast(`✅ Đã phê duyệt hàng loạt thành công ${successCount} hồ sơ!`, "success");
        } else if (successCount > 0) {
            showToast(`Đã duyệt ${successCount} hồ sơ thành công, ${failCount} thất bại.`, "warning");
        } else {
            showToast("Phê duyệt hàng loạt thất bại.", "error");
        }
        await loadAllEvents();
    }
}

// ── ĐÓNG MODAL KHI CLICK NGOÀI / ESC ────────────────────────────
document.addEventListener("click", function (e) {
    ["approveModal", "rejectModal"].forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) modal.classList.remove("active");
    });
});
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeApproveModal();
        closeRejectModal();
    }
});

// ── HELPERS ───────────────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
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
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        padding:14px 20px;border-radius:10px;font-size:14px;font-weight:500;
        background:${colors[type] || colors.success};color:white;
        box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:360px;
        animation:fadeIn .3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
