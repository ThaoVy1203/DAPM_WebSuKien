<<<<<<< HEAD
// History Page - API Integration
let currentUser = null;
let allRegistrations = [];
let filteredRegistrations = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('History page loaded');
    
    // Get user from localStorage
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem lịch sử');
        window.location.href = 'login.html';
        return;
    }
    
    // Load user's event history
    await loadEventHistory();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load event history from API
async function loadEventHistory() {
    try {
        console.log('Loading event history for user:', currentUser.idNguoiDung);
        
        // Fetch user's registrations
        allRegistrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY_BY_NGUOIDUNG(currentUser.idNguoiDung));
        filteredRegistrations = [...allRegistrations];
        
        console.log('User registrations:', allRegistrations);
        
        // Update statistics
        updateStatistics(allRegistrations);
        
        // Render history table
        await renderHistoryTable(filteredRegistrations);
        
    } catch (error) {
        console.error('Error loading history:', error);
        showError('Không thể tải lịch sử tham gia. Vui lòng thử lại sau.');
    }
}

// Update statistics
function updateStatistics(registrations) {
    // Total events attended
    const totalEvents = registrations.filter(r => 
        r.trangThai === 'Đã tham gia' || r.trangThai === 'Đã xác nhận'
    ).length;
    
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) {
        totalElement.textContent = totalEvents;
    }
    
    // Calculate mock training points (each event = ~3-5 points)
    const trainingPoints = Math.min(100, totalEvents * 4);
    const pointsElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (pointsElement) {
        pointsElement.textContent = trainingPoints;
    }
    
    // Calculate mock community hours (each event = ~2-8 hours)
    const communityHours = (totalEvents * 5).toFixed(1);
    const hoursElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (hoursElement) {
        hoursElement.textContent = communityHours;
    }
}

// Render history table
async function renderHistoryTable(registrations) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 16px; color: #ddd;"></i>
                    Bạn chưa tham gia sự kiện nào
                </td>
            </tr>
        `;
        return;
    }
    
    // Load event details for each registration
    for (const reg of registrations) {
        try {
            const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(reg.idSuKien));
            const row = createHistoryRow(reg, event);
            tbody.appendChild(row);
        } catch (error) {
            console.error('Error loading event:', error);
=======
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
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
        }
    }
}

<<<<<<< HEAD
// Create history table row
function createHistoryRow(registration, event) {
    const row = document.createElement('tr');
    
    const startDate = new Date(event.thoiGianBatDau);
    const dateStr = startDate.toLocaleDateString('vi-VN');
    
    // Determine role (mock data)
    const role = registration.trangThai === 'Đã tham gia' ? 'Thành viên' : 'Người tham gia';
    
    // Calculate points/hours (mock data)
    const points = registration.trangThai === 'Đã tham gia' ? '5 điểm' : '-';
    
    // Status badge
    const statusClass = getStatusClass(registration.trangThai);
    const statusText = getStatusText(registration.trangThai);
    
    row.innerHTML = `
        <td>
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="../images/event${event.idSuKien}.png" 
                     alt="Event" 
                     style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;"
                     onerror="this.src='https://via.placeholder.com/50x50/1976D2/FFFFFF?text=Event'">
                <div>
                    <strong>${event.tenSuKien}</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        <i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}
                    </div>
                </div>
            </div>
        </td>
        <td>${dateStr}</td>
        <td>${role}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td><strong>${points}</strong></td>
        <td>
            <div class="action-buttons">
                <button class="btn-action view" onclick="viewEventDetail(${event.idSuKien})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action certificate" onclick="downloadCertificate(${registration.idDangKy})" title="Tải chứng nhận">
                    <i class="fas fa-certificate"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'Chờ xác nhận': 'pending',
        'Đã xác nhận': 'confirmed',
        'Đã tham gia': 'attended',
        'Vắng mặt': 'absent',
        'Đã hủy': 'cancelled'
    };
    return statusMap[status] || 'default';
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'Chờ xác nhận': 'Chờ xác nhận',
        'Đã xác nhận': 'Đã xác nhận',
        'Đã tham gia': 'Đã tham gia',
        'Vắng mặt': 'Vắng mặt',
        'Đã hủy': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// View event detail
function viewEventDetail(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

// Download certificate
function downloadCertificate(registrationId) {
    alert('Tính năng tải chứng nhận đang được phát triển');
    // TODO: Implement certificate download
}

// Initialize event handlers
function initializeEventHandlers() {
    // Search box
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterHistory(e.target.value);
        });
    }
    
    // Analyze button
    const analyzeBtn = document.querySelector('.btn-analyze');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            alert('Tính năng phân tích hiệu điểm đang được phát triển');
        });
    }
    
    // View ranking button
    const rankingBtn = document.querySelector('.btn-banner');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            alert('Tính năng bảng xếp hạng đang được phát triển');
        });
    }
}

// Filter history by search term
async function filterHistory(searchTerm) {
    if (!searchTerm.trim()) {
        filteredRegistrations = [...allRegistrations];
    } else {
        // Filter registrations (need to load events to search by name)
        filteredRegistrations = [];
        
        for (const reg of allRegistrations) {
            try {
                const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(reg.idSuKien));
                if (event.tenSuKien.toLowerCase().includes(searchTerm.toLowerCase())) {
                    filteredRegistrations.push(reg);
                }
            } catch (error) {
                console.error('Error loading event:', error);
            }
        }
    }
    
    await renderHistoryTable(filteredRegistrations);
}

// Show error message
function showError(message) {
    const container = document.querySelector('.history-content');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
                <h3 style="margin-top: 20px; color: #333;">${message}</h3>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// Make functions global for onclick handlers
window.viewEventDetail = viewEventDetail;
window.downloadCertificate = downloadCertificate;
=======
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
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
