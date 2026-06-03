<<<<<<< HEAD
// Events page functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Events page loaded');
    
    // Load events from API
    await loadEvents();
    
    // Initialize filter functionality
    initializeFilters();
    
    // Initialize pagination
    initializePagination();
});

// Load events from API
async function loadEvents() {
    try {
        console.log('Fetching events from API...');
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        console.log('Events loaded:', events);
        
        if (events && events.length > 0) {
            renderEvents(events);
            updateResultsCount(events.length);
        } else {
            showNoEventsMessage();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showErrorMessage('Không thể tải danh sách sự kiện. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render events to the page
function renderEvents(events) {
    const eventsSection = document.querySelector('.events-section');
    const existingCards = eventsSection.querySelectorAll('.event-card');
    
    // Remove existing event cards
    existingCards.forEach(card => card.remove());
    
    // Get pagination element to insert before it
    const pagination = eventsSection.querySelector('.pagination');
    
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsSection.insertBefore(eventCard, pagination);
    });
}

// Create event card HTML
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Format dates
    const startDate = new Date(event.thoiGianBatDau);
    const endDate = new Date(event.thoiGianKetThuc);
    const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    // Determine badge class based on category
    let badgeClass = 'hoi-thao';
    let badgeText = 'SỰ KIỆN';
    
    // Calculate event status based on registration count
    const registered = event.soLuongDaDangKy || 0;
    const max = event.soLuongToiDa || 999999;
    const isFull = registered >= max;
    
    // Get status badge and button
    let statusBadge = '';
    let statusButton = '';
    
    if (event.trangThai === 'Đã duyệt') {
        if (isFull) {
            statusBadge = '<button class="btn-secondary">Hết chỗ</button>';
            statusButton = '<button class="btn-disabled" disabled>Hết chỗ</button>';
        } else {
            statusBadge = '<button class="btn-secondary">Sắp diễn ra</button>';
            statusButton = '<button class="btn-primary" onclick="goToEventDetail(' + event.idSuKien + ')">Đăng ký ngay</button>';
        }
    } else if (event.trangThai === 'Chờ duyệt') {
        statusBadge = '<button class="btn-secondary">Chờ duyệt</button>';
        statusButton = '<button class="btn-notify"><i class="fas fa-bell"></i> Nhận thông báo</button>';
    } else {
        statusBadge = '<button class="btn-secondary">' + event.trangThai + '</button>';
        statusButton = '<button class="btn-primary" onclick="goToEventDetail(' + event.idSuKien + ')">Xem chi tiết</button>';
    }
    
    card.innerHTML = `
        <div class="event-image">
            <img src="../images/event${event.idSuKien}.png" alt="Event" onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Event'">
            <span class="event-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="event-content">
            <div class="event-header">
                <h3>${event.tenSuKien}</h3>
                <span class="event-date-badge">${dateStr}</span>
            </div>
            <p class="event-description">${event.moTa || 'Không có mô tả'}</p>
            <div class="event-meta">
                <span><i class="far fa-clock"></i> ${timeStr}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</span>
                <span><i class="fas fa-users"></i> ${registered}/${max === 999999 ? 'Không giới hạn' : max}</span>
                <span><i class="fas fa-building"></i> ${isFull ? 'Hết chỗ' : 'Còn chỗ'}</span>
            </div>
            <div class="event-actions">
                ${statusBadge}
                ${statusButton}
            </div>
        </div>
    `;
    
    // Add click event to view details (except on buttons)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            goToEventDetail(event.idSuKien);
        }
    });
    
    // Add cursor pointer
    card.style.cursor = 'pointer';
    
    return card;
}

// Navigate to event detail page
function goToEventDetail(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

// Make function global for onclick handlers
window.goToEventDetail = goToEventDetail;

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `Kết quả: ${count} sự kiện`;
    }
}

// Show no events message
function showNoEventsMessage() {
    const eventsSection = document.querySelector('.events-section');
    const pagination = eventsSection.querySelector('.pagination');
    
    const message = document.createElement('div');
    message.className = 'no-events-message';
    message.style.cssText = 'text-align: center; padding: 40px; color: #666;';
    message.innerHTML = `
        <i class="fas fa-calendar-times" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
        <h3>Chưa có sự kiện nào</h3>
        <p>Hiện tại chưa có sự kiện nào được tổ chức. Vui lòng quay lại sau.</p>
    `;
    
    eventsSection.insertBefore(message, pagination);
}

// Show error message
function showErrorMessage(message) {
    const eventsSection = document.querySelector('.events-section');
    const pagination = eventsSection.querySelector('.pagination');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'text-align: center; padding: 40px; color: #dc2626; background: #fee2e2; border-radius: 8px; margin: 20px 0;';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
        <h3>Có lỗi xảy ra</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="location.reload()" style="margin-top: 16px;">Thử lại</button>
    `;
    
    eventsSection.insertBefore(errorDiv, pagination);
}

// Initialize filters
function initializeFilters() {
    // Apply filter button
    const applyFilterBtn = document.querySelector('.btn-apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            console.log('Applying filters...');
            // TODO: Add filter logic here
        });
    }

    // Status buttons
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            statusButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // TODO: Filter events by status
        });
=======
"use strict";
// js/events.js — Load sự kiện từ API, bộ lọc động, tìm kiếm realtime

const API_BASE = "https://localhost:7160/api";

// Ảnh mẫu xoay vòng cho các sự kiện
const EVENT_IMAGES = [
    "../images/event1.png",
    "../images/event2.png",
    "../images/event3.png",
    "../images/UTE Tech Showcase.png",
    "../images/Skills Talk.png",
    "../images/Culture Festival.png",
    "../images/Workshop.png",
    "../images/Festival.png"
];

let allEvents   = [];   // Toàn bộ sự kiện từ API
let myRegMap    = {};   // { idSuKien: { trangThai, idDangKy } }
let currentPage = 1;
const PAGE_SIZE = 6;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    await Promise.all([
        loadAllEvents(),
        loadMyRegistrations()
    ]);
    initFilters();
    initSearch();
    applyFiltersAndRender();
});

// ─── LOAD SỰ KIỆN TỪ API ──────────────────────────────────────────────────────
async function loadAllEvents() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allEvents = Array.isArray(data) ? data : (data.data || data.items || []);
    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
        showError("Không thể tải danh sách sự kiện. Vui lòng kiểm tra Backend đã chạy chưa.");
    }
}

// ─── LOAD ĐĂNG KÝ CỦA USER ────────────────────────────────────────────────────
async function loadMyRegistrations() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
        const raw = localStorage.getItem("userData");
        if (!raw) return;
        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;
        if (!idNguoiDung) return;

        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || data.items || []);

        // Tạo map { idSuKien → trangThai } để tra nhanh
        myRegMap = {};
        items.forEach(item => {
            const id = item.IdSuKien ?? item.idSuKien;
            const ts = item.TrangThai ?? item.trangThai ?? "";
            if (ts !== "Đã hủy") {
                myRegMap[id] = {
                    trangThai: ts,
                    idDangKy: item.IdDangKy ?? item.idDangKy
                };
            }
        });
    } catch (e) {
        // Không ảnh hưởng UX — chỉ mất badge "Đã đăng ký"
    }
}

// ─── BỘ LỌC ───────────────────────────────────────────────────────────────────
function initFilters() {
    // Status buttons
    document.querySelectorAll(".status-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentPage = 1;
            applyFiltersAndRender();
        });
    });

    // Nút áp dụng bộ lọc
    const applyBtn = document.querySelector(".btn-apply-filter");
    if (applyBtn) {
        applyBtn.addEventListener("click", function () {
            currentPage = 1;
            applyFiltersAndRender();
        });
    }
}

function initSearch() {
    const searchInput = document.querySelector(".search-box input");
    if (!searchInput) return;
    let debounceTimer;
    searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            applyFiltersAndRender();
        }, 300);
    });
}

// ─── LỌC + RENDER ─────────────────────────────────────────────────────────────
function applyFiltersAndRender() {
    const statusBtn  = document.querySelector(".status-btn.active");
    const statusFilter = statusBtn?.dataset.status || "open";
    const keyword    = (document.querySelector(".search-box input")?.value || "").trim().toLowerCase();

    let filtered = allEvents.filter(ev => {
        // Lọc theo trạng thái
        const ts = ev.TrangThai || ev.trangThai || "";
        if (statusFilter === "open")    return ts === "Đã duyệt";
        if (statusFilter === "ongoing") return ts === "Đang diễn ra";
        if (statusFilter === "ended")   return ["Kết thúc", "Hủy"].includes(ts);
        return true; // "all"
    });

    // Lọc theo từ khóa
    if (keyword) {
        filtered = filtered.filter(ev => {
            const name = (ev.TenSuKien || ev.tenSuKien || "").toLowerCase();
            const desc = (ev.MoTa || ev.moTa || "").toLowerCase();
            const dd   = (ev.TenDiaDiem || ev.tenDiaDiem || "").toLowerCase();
            return name.includes(keyword) || desc.includes(keyword) || dd.includes(keyword);
        });
    }

    renderEvents(filtered);
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────
function renderEvents(events) {
    const container  = document.getElementById("eventsContainer");
    const loading    = document.getElementById("eventsLoading");
    const countEl    = document.getElementById("resultsCount");
    const pagination = document.getElementById("paginationBar");

    if (loading) loading.style.display = "none";
    if (!container) return;

    if (countEl) countEl.textContent = `Kết quả: ${events.length} sự kiện`;

    if (!events || events.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#666;">
                <i class="fas fa-calendar-times" style="font-size:48px;display:block;margin-bottom:16px;color:#d1d5db;"></i>
                <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">Không có sự kiện nào</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>`;
        if (pagination) pagination.style.display = "none";
        return;
    }

    // Phân trang
    const totalPages = Math.ceil(events.length / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = events.slice(start, start + PAGE_SIZE);

    container.innerHTML = "";
    paged.forEach((event, idx) => {
        container.appendChild(buildEventCard(event, start + idx));
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
    });
}

<<<<<<< HEAD
// Initialize pagination
function initializePagination() {
    const pageButtons = document.querySelectorAll('.page-btn:not(.active)');
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.querySelector('i')) {
                document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
=======
    // Cập nhật pagination
    if (pagination) {
        if (totalPages > 1) {
            pagination.style.display = "flex";
            const pageInfo = document.getElementById("pageInfo");
            if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

            const btnPrev = document.getElementById("btnPrevPage");
            const btnNext = document.getElementById("btnNextPage");
            if (btnPrev) btnPrev.disabled = currentPage <= 1;
            if (btnNext) btnNext.disabled = currentPage >= totalPages;

            // Gắn sự kiện (tránh duplicate)
            if (btnPrev) {
                btnPrev.onclick = () => { if (currentPage > 1) { currentPage--; applyFiltersAndRender(); window.scrollTo({top:0,behavior:"smooth"}); } };
            }
            if (btnNext) {
                btnNext.onclick = () => { if (currentPage < totalPages) { currentPage++; applyFiltersAndRender(); window.scrollTo({top:0,behavior:"smooth"}); } };
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
            }
        } else {
            pagination.style.display = "none";
        }
    }
}

function buildEventCard(event, idx) {
    const idSuKien  = event.IdSuKien  ?? event.idSuKien;
    const tenSuKien = event.TenSuKien ?? event.tenSuKien ?? "Sự kiện";
    const moTa      = event.MoTa      ?? event.moTa      ?? "";
    const trangThaiDB = event.TrangThai ?? event.trangThai ?? "";
    const diaDiem   = event.TenDiaDiem ?? event.tenDiaDiem ?? event.diaDiem?.tenDiaDiem ?? "Đang cập nhật";
    const soToiDa   = event.SoLuongToiDa ?? event.soLuongToiDa;
    const soDaDK    = event.SoDaDangKy   ?? event.soDaDangKy ?? 0;
    const conLai    = soToiDa ? soToiDa - soDaDK : null;

    const batDau  = event.ThoiGianBatDau  ?? event.thoiGianBatDau;
    const ketThuc = event.ThoiGianKetThuc ?? event.thoiGianKetThuc;

    // ── Tính trạng thái THỰC TẾ dựa vào thời gian hiện tại ──────────────────
    const now = new Date();
    const batDauDate  = batDau  ? new Date(batDau)  : null;
    const ketThucDate = ketThuc ? new Date(ketThuc) : null;

    let trangThai; // trạng thái thực tế để hiển thị
    if (["Hủy", "Nháp", "Chờ duyệt", "Từ chối"].includes(trangThaiDB)) {
        // Các trạng thái này không phụ thuộc thời gian
        trangThai = trangThaiDB;
    } else if (ketThucDate && now > ketThucDate) {
        trangThai = "Kết thúc";
    } else if (batDauDate && now >= batDauDate) {
        trangThai = "Đang diễn ra";
    } else {
        // Chưa bắt đầu — chỉ cho đăng ký nếu DB là "Đã duyệt"
        trangThai = trangThaiDB === "Đã duyệt" ? "Đã duyệt" : trangThaiDB;
    }

    let dateStr = "Chưa có";
    let timeStr = "";
    if (batDau) {
        const s = new Date(batDau);
        const e = ketThucDate;
        dateStr = s.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" });
        timeStr = s.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" });
        if (e) timeStr += ` - ${e.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}`;
    }

    // Ảnh xoay vòng
    const imgSrc = EVENT_IMAGES[idx % EVENT_IMAGES.length];

    // Badge trạng thái — dùng trangThai thực tế (tính từ thời gian)
    const badgeCfg = {
        "Đã duyệt":      { cls: "badge-approved",  text: "MỞ ĐĂNG KÝ" },
        "Đang diễn ra":  { cls: "badge-ongoing",   text: "ĐANG DIỄN RA" },
        "Kết thúc":      { cls: "badge-ended",     text: "ĐÃ KẾT THÚC" },
        "Hủy":           { cls: "badge-cancelled", text: "ĐÃ HỦY" },
        "Chờ duyệt":     { cls: "badge-pending",   text: "CHỜ DUYỆT" },
        "Từ chối":       { cls: "badge-cancelled", text: "TỪ CHỐI" },
        "Nháp":          { cls: "badge-pending",   text: "NHÁP" },
    };
    const badge = badgeCfg[trangThai] || { cls: "badge-pending", text: trangThai.toUpperCase() };

    // Trạng thái đăng ký của user
    const myReg = myRegMap[idSuKien];
    const myRegStatus = myReg?.trangThai ?? (typeof myReg === "string" ? myReg : null);
    const myRegId = myReg?.idDangKy;
    let regBadge = "";
    if (myRegStatus) {
        const regCfg = {
            "Đã xác nhận":  { bg:"#d1fae5", color:"#065f46", icon:"fa-check-circle", text:"Đã đăng ký" },
            "Chờ xác nhận": { bg:"#fef3c7", color:"#92400e", icon:"fa-clock",        text:"Chờ xác nhận" },
            "Đã tham gia":  { bg:"#dbeafe", color:"#1e40af", icon:"fa-star",         text:"Đã tham gia" },
            "Chờ chỗ":     { bg:"#fef3c7", color:"#92400e", icon:"fa-hourglass-half", text:"Chờ chỗ" },
            "Chờ người dùng xác nhận": { bg:"#fef3c7", color:"#92400e", icon:"fa-bell", text:"Mời xác nhận (24h)" },
            "Vắng mặt":     { bg:"#fee2e2", color:"#991b1b", icon:"fa-user-times",   text:"Vắng mặt" },
        };
        const rc = regCfg[myRegStatus];
        if (rc) {
            regBadge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${rc.bg};color:${rc.color};">
                <i class="fas ${rc.icon}"></i> ${rc.text}
            </span>`;
        }
    }

    // Nút hành động
    const canOpenRegister = ["Đã duyệt", "Đang diễn ra"].includes(trangThai);
    const canRegister = canOpenRegister && !myRegStatus && (conLai === null || conLai > 0);
    const isEnded     = ["Kết thúc", "Hủy"].includes(trangThai);
    const isFull      = conLai !== null && conLai <= 0;
    const canWaitlist = canOpenRegister && !myRegStatus && isFull;

    let actionBtn = "";
    if (myRegStatus && myRegId) {
        actionBtn = `<a href="ticket-detail.html?id=${myRegId}" class="btn-primary" style="text-decoration:none;text-align:center;">
            <i class="fas fa-qrcode"></i> Xem vé & QR
        </a>`;
    } else if (myRegStatus) {
        actionBtn = `<a href="my-tickets.html" class="btn-primary" style="text-decoration:none;text-align:center;">
            <i class="fas fa-qrcode"></i> Xem vé của tôi
        </a>`;
    } else if (canRegister) {
        actionBtn = `<button class="btn-primary" onclick="window.location.href='event-detail.html?id=${idSuKien}'">
            <i class="fas fa-user-plus"></i> Đăng ký ngay
        </button>`;
    } else if (canWaitlist) {
        actionBtn = `<button class="btn-primary" onclick="window.location.href='event-detail.html?id=${idSuKien}'">
            <i class="fas fa-hourglass-half"></i> Vào danh sách chờ
        </button>`;
    } else if (isFull) {
        actionBtn = `<button class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">
            <i class="fas fa-users-slash"></i> Hết chỗ
        </button>`;
    } else if (isEnded) {
        actionBtn = `<button class="btn-secondary" onclick="window.location.href='event-detail.html?id=${idSuKien}'">
            <i class="fas fa-eye"></i> Xem chi tiết
        </button>`;
    } else {
        actionBtn = `<button class="btn-secondary" onclick="window.location.href='event-detail.html?id=${idSuKien}'">
            <i class="fas fa-eye"></i> Xem chi tiết
        </button>`;
    }

    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.id = idSuKien;
    card.style.cursor = "pointer";
    card.innerHTML = `
        <div class="event-image">
            <img src="${imgSrc}" alt="${escapeHtml(tenSuKien)}"
                 onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Event'">
            <span class="event-badge ${badge.cls}">${badge.text}</span>
            ${conLai !== null && conLai <= 5 && conLai > 0
                ? `<span style="position:absolute;bottom:10px;left:10px;background:#ef4444;color:white;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;">
                    Còn ${conLai} chỗ
                   </span>` : ""}
        </div>
        <div class="event-content">
            <div class="event-header">
                <h3>${escapeHtml(tenSuKien)}</h3>
                <span class="event-date-badge">${batDau ? new Date(batDau).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"}) : "--"}</span>
            </div>
            ${regBadge ? `<div style="margin-bottom:8px;">${regBadge}</div>` : ""}
            <p class="event-description">${escapeHtml(moTa.length > 100 ? moTa.slice(0,100)+"..." : moTa)}</p>
            <div class="event-meta">
                ${timeStr ? `<span><i class="far fa-clock"></i> ${escapeHtml(timeStr)}</span>` : ""}
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
                ${soToiDa ? `<span><i class="fas fa-users"></i> ${soDaDK}/${soToiDa} người</span>` : ""}
            </div>
            <div class="event-actions">
                <button class="btn-secondary" onclick="event.stopPropagation();window.location.href='event-detail.html?id=${idSuKien}'">
                    <i class="fas fa-eye"></i> Chi tiết
                </button>
                ${actionBtn}
            </div>
        </div>`;

    // Click vào card → xem chi tiết
    card.addEventListener("click", function (e) {
        if (e.target.closest("button") || e.target.closest("a")) return;
        window.location.href = `event-detail.html?id=${idSuKien}`;
    });
<<<<<<< HEAD
=======

    return card;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function showError(msg) {
    const loading = document.getElementById("eventsLoading");
    if (loading) {
        loading.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size:32px;display:block;margin-bottom:12px;color:#ef4444;"></i>
            <p style="color:#666;">${msg}</p>`;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
}
