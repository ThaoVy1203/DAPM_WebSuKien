// js/history.js
const API_BASE = "http://localhost:5103/api";

let historyData = [];
let currentPage = 1;

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        alert('Vui lòng đăng nhập để xem lịch sử');
        window.location.href = "login.html";
        return;
    }

    await loadHistory();
    setupSearch();
    setupPagination();
    initializeExtraHandlers();
});

// ==========================
// LOAD LỊCH SỬ THAM GIA
// ==========================
async function loadHistory(page = 1) {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("historyTableBody");

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">
            <i class="fas fa-spinner fa-spin" style="font-size:32px;display:block;margin-bottom:16px;"></i>
            Đang tải dữ liệu...
        </td></tr>`;
    }

    try {
        const raw = localStorage.getItem("userData") || localStorage.getItem("user");
        if (!raw) { window.location.href = "login.html"; return; }

        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;

        if (!idNguoiDung) {
            console.error("Không tìm thấy idNguoiDung trong userData:", user);
            throw new Error("Không xác định được tài khoản");
        }

        console.log("[history] Đang tải lịch sử cho:", idNguoiDung);

        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) { window.location.href = "login.html"; return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

        console.log(`[history] API trả về ${rawItems.length} bản ghi`);

        historyData = rawItems.map(item => ({
            idDangKy:         item.IdDangKy         ?? item.idDangKy,
            idSuKien:         item.IdSuKien         ?? item.idSuKien,
            tenSuKien:        item.TenSuKien        ?? item.tenSuKien        ?? "Chưa có tên",
            trangThai:        item.TrangThai        ?? item.trangThai        ?? "-",
            thoiGianDangKy:   item.ThoiGianDangKy   ?? item.thoiGianDangKy,
            thoiGianCheckin:  item.ThoiGianCheckin  ?? item.thoiGianCheckin  ?? null,
            thoiGianCheckout: item.ThoiGianCheckout ?? item.thoiGianCheckout ?? null,
            tenDiaDiem:       item.TenDiaDiem       ?? item.tenDiaDiem       ?? "Chưa xác định",
            thoiGianBatDau:   item.ThoiGianBatDau   ?? item.thoiGianBatDau   ?? null,
            anhBia:           item.AnhBia           ?? item.anhBia           ?? null,
        }));

        currentPage = page;
        renderHistoryTable(historyData);
        updateStats(historyData);

    } catch (e) {
        console.error("Lỗi load lịch sử:", e);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc2626;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;display:block;margin-bottom:16px;"></i>
                <strong>Không thể tải dữ liệu</strong><br>
                <span style="font-size:13px;color:#666;">${e.message}</span><br>
                <button onclick="loadHistory()" style="margin-top:12px;padding:8px 20px;background:#0D5A9C;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </td></tr>`;
        }
    }
}

// ==========================
// RENDER BẢNG (Kết hợp UI từ HEAD và an toàn từ Incoming)
// ==========================
function renderHistoryTable(data) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">
            <i class="fas fa-inbox" style="font-size:48px;display:block;margin-bottom:16px;color:#ddd;"></i>
            Bạn chưa tham gia sự kiện nào.
        </td></tr>`;
        const paginationEl = document.querySelector('.pagination');
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }

    const ITEMS_PER_PAGE = 5;
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const paginationEl = document.querySelector('.pagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
        } else {
            paginationEl.style.display = 'flex';
            // Cập nhật info text
            const pInfo = document.getElementById("paginationInfo");
            if (pInfo) {
                const s2 = (currentPage - 1) * ITEMS_PER_PAGE;
                pInfo.textContent = `Hiển thị ${s2 + 1}–${Math.min(totalItems, s2 + ITEMS_PER_PAGE)} trong số ${totalItems} sự kiện`;
            }
            // Render nút vào #paginationControls
            const controls = document.getElementById("paginationControls");
            if (controls) {
                let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changeHistoryPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
                for (let i = 1; i <= totalPages; i++) {
                    html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changeHistoryPage(${i})">${i}</button>`;
                }
                html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeHistoryPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
                controls.innerHTML = html;
            }
        }
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = data.slice(start, end);

    tbody.innerHTML = "";
    pageItems.forEach(item => {
        const tenSuKien  = item.tenSuKien || "Chưa có tên";
        const diaDiem    = item.tenDiaDiem || "Chưa xác định";
        const trangThai  = item.trangThai || "-";
        const ngayDangKy = item.thoiGianDangKy
            ? new Date(item.thoiGianDangKy).toLocaleDateString("vi-VN")
            : "-";

        const statusClass = getStatusClass(trangThai);
        const role = trangThai === 'Đã tham gia' ? 'Thành viên' : 'Người tham gia';
        const points = trangThai === 'Đã tham gia' ? '5 điểm' : '-';

        const imgSrc = getHistoryEventImg(item);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${imgSrc}" 
                         alt="${escapeHtml(tenSuKien)}" 
                         style="width:50px;height:50px;border-radius:8px;object-fit:cover;background:#e5e7eb;flex-shrink:0;"
                         onerror="this.src='https://picsum.photos/seed/${item.idSuKien || 'ev'}/50/50'">
                    <div>
                        <div style="font-weight:600;color:#1a1a2e;">${escapeHtml(tenSuKien)}</div>
                        <div style="font-size:12px;color:#666;margin-top:4px;">
                            <i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}
                        </div>
                    </div>
                </div>
            </td>
            <td>${ngayDangKy}</td>
            <td>${escapeHtml(role)}</td>
            <td><span class="status-badge ${statusClass}" style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${escapeHtml(trangThai)}</span></td>
            <td><strong>${points}</strong></td>
            <td>
                <div class="action-buttons" style="display: flex; gap: 8px;">
                    <button class="btn-action view" onclick="window.location.href='event-detail.html?id=${item.idSuKien || ''}'" title="Xem chi tiết" style="border:none;background:none;color:#0D5A9C;cursor:pointer;">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    ${item.idDangKy && ["Đã xác nhận", "Chờ xác nhận", "Đã tham gia"].includes(trangThai) ? `
                    <button class="btn-action ticket" onclick="window.location.href='ticket-detail.html?id=${item.idDangKy}'" title="Xem Vé" style="border:none;background:none;color:#059669;cursor:pointer;">
                        <i class="fas fa-qrcode"></i> Vé
                    </button>` : ""}
                </div>
            </td>`;
        tbody.appendChild(row);
    });
}

// ==========================
// FALLBACK ẢNH THEO TÊN SỰ KIỆN (dùng picsum seed)
// ==========================
function getHistoryEventImg(item) {
    if (item.anhBia) return item.anhBia;
    const ten = (item.tenSuKien || "").toLowerCase();
    if (ten.includes("hội thảo") || ten.includes("học thuật") || ten.includes("seminar") || ten.includes("chuyển đổi"))
        return "https://picsum.photos/seed/conference/50/50";
    if (ten.includes("tình nguyện"))
        return "https://picsum.photos/seed/volunteer/50/50";
    if (ten.includes("workshop") || ten.includes("kỹ năng") || ten.includes("khởi nghiệp"))
        return "https://picsum.photos/seed/workshop/50/50";
    if (ten.includes("văn nghệ") || ten.includes("văn hóa") || ten.includes("festival"))
        return "https://picsum.photos/seed/festival/50/50";
    if (ten.includes("hackathon") || ten.includes("công nghệ") || ten.includes("ai"))
        return "https://picsum.photos/seed/tech/50/50";
    if (ten.includes("thể thao") || ten.includes("sport"))
        return "https://picsum.photos/seed/sport/50/50";
    // Dùng idSuKien làm seed — mỗi sự kiện ảnh khác nhau, nhất quán
    return `https://picsum.photos/seed/${item.idSuKien || "event"}/50/50`;
}

function getStatusClass(status) {
    const statusMap = {
        'Chờ xác nhận': 'pending',
        'Đã xác nhận': 'confirmed',
        'Đã tham gia': 'completed', // 'attended' ở bản cũ
        'Vắng mặt': 'absent',
        'Đã hủy': 'cancelled'
    };
    return statusMap[status] || 'default';
}

// ==========================
// CẬP NHẬT THỐNG KÊ từ dữ liệu SQL
// ==========================
function updateStats(items) {
    const totalEvents = items.filter(r => r.trangThai !== 'Đã hủy').length;
    const attendedEvents = items.filter(r =>
        r.trangThai === 'Đã tham gia' || r.trangThai === 'Hoàn thành'
    ).length;

    // Ưu tiên dùng id riêng nếu có
    const el0 = document.getElementById("statTotalEvents");
    const el1 = document.getElementById("statPoints");
    const el2 = document.getElementById("statHours");

    if (el0) el0.textContent = totalEvents;
    if (el1) el1.textContent = Math.min(100, attendedEvents * 5);
    if (el2) el2.textContent = (attendedEvents * 5).toFixed(1);

    // Fallback cho .stat-number nếu không có id
    const statNumbers = document.querySelectorAll(".stat-number");
    if (!el0 && statNumbers[0]) statNumbers[0].textContent = totalEvents;
    if (!el1 && statNumbers[1]) statNumbers[1].textContent = Math.min(100, attendedEvents * 5);
    if (!el2 && statNumbers[2]) statNumbers[2].textContent = (attendedEvents * 5).toFixed(1);
}

// ==========================
// TÌM KIẾM & PHÂN TRANG & HANDLERS
// ==========================
function setupSearch() {
    const searchInput = document.querySelector(".search-box input");
    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
        currentPage = 1;
        const keyword = this.value.trim().toLowerCase();
        if (!keyword) {
            renderHistoryTable(historyData);
            return;
        }
        const filtered = historyData.filter(item => {
            const name = (item.tenSuKien || "").toLowerCase();
            return name.includes(keyword);
        });
        renderHistoryTable(filtered);
    });
}

function setupPagination() {}

window.changeHistoryPage = function(page) {
    currentPage = page;
    const searchInput = document.querySelector(".search-box input");
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (keyword) {
        const filtered = historyData.filter(item => {
            const name = (item.tenSuKien || "").toLowerCase();
            return name.includes(keyword);
        });
        renderHistoryTable(filtered);
    } else {
        renderHistoryTable(historyData);
    }
};

function initializeExtraHandlers() {
    const analyzeBtn = document.querySelector('.btn-analyze');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => alert('Tính năng phân tích hiệu điểm đang được phát triển'));
    }
    
    const rankingBtn = document.querySelector('.btn-banner');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => alert('Tính năng bảng xếp hạng đang được phát triển'));
    }
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