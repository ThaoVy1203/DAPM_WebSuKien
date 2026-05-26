// js/history.js
const API_BASE = "https://localhost:7160/api";

let historyData = [];
let currentPage = 1;

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await loadHistory();
    setupSearch();
    setupPagination();
});

// ==========================
// LOAD LỊCH SỬ THAM GIA
// ==========================
async function loadHistory(page = 1) {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("historyTableBody");

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#666;">
            <i class="fas fa-spinner fa-spin"></i> Đang tải...
        </td></tr>`;
    }

    try {
        // Lấy idNguoiDung từ userData (BE trả PascalCase)
        const raw = localStorage.getItem("userData");
        if (!raw) { window.location.href = "login.html"; return; }
        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;
        if (!idNguoiDung) throw new Error("Không xác định được tài khoản");

        // Endpoint đúng: GET /api/DangKy/nguoi-dung/{idNguoiDung}
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        // API trả về mảng trực tiếp (PascalCase từ BE)
        const raw2 = Array.isArray(data) ? data : (data.items || data.data || []);

        // Chuẩn hóa về camelCase
        historyData = raw2.map(item => ({
            idDangKy:         item.IdDangKy         ?? item.idDangKy,
            idSuKien:         item.IdSuKien         ?? item.idSuKien,
            tenSuKien:        item.TenSuKien        ?? item.tenSuKien        ?? "Chưa có tên",
            trangThai:        item.TrangThai        ?? item.trangThai        ?? "-",
            thoiGianDangKy:   item.ThoiGianDangKy   ?? item.thoiGianDangKy,
            thoiGianCheckin:  item.ThoiGianCheckin  ?? item.thoiGianCheckin  ?? null,
            thoiGianCheckout: item.ThoiGianCheckout ?? item.thoiGianCheckout ?? null,
            tenDiaDiem:       item.TenDiaDiem       ?? item.tenDiaDiem       ?? "-",
            thoiGianBatDau:   item.ThoiGianBatDau   ?? item.thoiGianBatDau   ?? null,
        }));

        currentPage = page;
        renderHistoryTable(historyData);
        updateStats(historyData);

    } catch (e) {
        console.error("Lỗi load lịch sử:", e);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#999;">
                <i class="fas fa-exclamation-circle"></i> Không thể tải dữ liệu. Vui lòng thử lại sau.
            </td></tr>`;
        }
    }
}

// ==========================
// RENDER BẢNG
// ==========================
function renderHistoryTable(data) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#999;">
            <i class="fas fa-calendar-times" style="font-size:32px;display:block;margin-bottom:8px;"></i>
            Bạn chưa tham gia sự kiện nào.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    data.forEach(item => {
        const tenSuKien   = item.tenSuKien || "Chưa có tên";
        const diaDiem     = item.tenDiaDiem || "-";
        const trangThai   = item.trangThai || "-";
        const ngayDangKy  = item.thoiGianDangKy
            ? new Date(item.thoiGianDangKy).toLocaleDateString("vi-VN")
            : "-";
        const ngayCheckin = item.thoiGianCheckin
            ? new Date(item.thoiGianCheckin).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })
            : "-";

        const statusClass = getStatusClass(trangThai);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div style="font-weight:600;color:#1a1a2e;">${escapeHtml(tenSuKien)}</div>
                <div style="font-size:12px;color:#888;">${escapeHtml(diaDiem)}</div>
            </td>
            <td>${ngayDangKy}</td>
            <td>${escapeHtml("Người tham gia")}</td>
            <td><span class="status-badge ${statusClass}" style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${escapeHtml(trangThai)}</span></td>
            <td>${ngayCheckin}</td>
            <td>
                <a href="event-detail.html?id=${item.idSuKien || ''}"
                   style="color:#0D5A9C;text-decoration:none;font-size:13px;font-weight:500;margin-right:8px;">
                    <i class="fas fa-eye"></i> Xem
                </a>
                ${item.idDangKy && ["Đã xác nhận", "Chờ xác nhận", "Đã tham gia"].includes(trangThai) ? `
                <a href="ticket-detail.html?id=${item.idDangKy}"
                   style="color:#059669;text-decoration:none;font-size:13px;font-weight:500;">
                    <i class="fas fa-qrcode"></i> Vé
                </a>` : ""}
            </td>`;
        tbody.appendChild(row);
    });
}

function getStatusClass(trangThai) {
    switch (trangThai) {
        case "Đã tham gia": return "completed";
        case "Đã xác nhận": return "confirmed";
        case "Chờ xác nhận": return "pending";
        case "Đã hủy":      return "cancelled";
        case "Vắng mặt":    return "absent";
        default:            return "";
    }
}

// ==========================
// CẬP NHẬT THỐNG KÊ
// ==========================
function updateStats(items) {
    const total    = items.length;
    const attended = items.filter(i => i.trangThai === "Đã tham gia").length;

    const statNumbers = document.querySelectorAll(".stat-number");
    if (statNumbers[0]) statNumbers[0].textContent = total;
    if (statNumbers[1]) statNumbers[1].textContent = attended;
}

// ==========================
// TÌM KIẾM
// ==========================
function setupSearch() {
    const searchInput = document.querySelector(".search-box input");
    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
        const keyword = this.value.trim().toLowerCase();
        if (!keyword) {
            renderHistoryTable(historyData);
            return;
        }
        const filtered = historyData.filter(item => {
            const name = (item.tenSuKien || item.suKien?.tenSuKien || "").toLowerCase();
            return name.includes(keyword);
        });
        renderHistoryTable(filtered);
    });
}

// ==========================
// PHÂN TRANG
// ==========================
function setupPagination() {
    document.querySelectorAll(".page-btn:not([disabled])").forEach(btn => {
        btn.addEventListener("click", async function () {
            if (this.classList.contains("active")) return;
            const page = parseInt(this.dataset.page || this.textContent) || 1;
            document.querySelectorAll(".page-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            await loadHistory(page);
        });
    });
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
