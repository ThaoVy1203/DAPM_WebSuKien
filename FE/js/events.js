<<<<<<< HEAD
"use strict";
// js/events.js — Load sự kiện từ API, bộ lọc động, tìm kiếm realtime

const API_BASE = "https://localhost:7160/api";

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

let allEvents   = [];
let myRegMap    = {};
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
        // Không ảnh hưởng UX
    }
}

// ─── BỘ LỌC ───────────────────────────────────────────────────────────────────
function initFilters() {
    document.querySelectorAll(".status-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentPage = 1;
            applyFiltersAndRender();
        });
    });

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
=======
// Events page functionality

// Global state
let allEvents = [];         // Toàn bộ sự kiện từ API
let filteredEvents = [];    // Sự kiện sau khi lọc
let allCategories = [];     // Danh mục từ API
let allDiaDiems = [];       // Địa điểm từ API
const PAGE_SIZE = 5;        // Số sự kiện mỗi trang
let currentPage = 1;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Events page loaded');
    
    // Load danh mục và địa điểm song song
    await Promise.all([loadCategories(), loadDiaDiems()]);
    
    // Load events from API
    await loadEvents();
    
    // Initialize filter functionality
    initializeFilters();
});

// Load danh mục từ API để điền vào checkbox lọc
async function loadCategories() {
    try {
        const categories = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        if (categories && categories.length > 0) {
            allCategories = categories;
            renderCategoryFilters(categories);
        }
    } catch (error) {
        console.warn('Không thể tải danh mục, dùng danh mục mặc định:', error);
    }
}

// Load địa điểm từ API để điền vào dropdown lọc
async function loadDiaDiems() {
    try {
        const diaDiems = await API.get(API_CONFIG.ENDPOINTS.DIADIEM);
        if (diaDiems && diaDiems.length > 0) {
            allDiaDiems = diaDiems;
            renderDiaDiemFilter(diaDiems);
        }
    } catch (error) {
        console.warn('Không thể tải địa điểm:', error);
    }
}

// Render dropdown địa điểm động
function renderDiaDiemFilter(diaDiems) {
    const select = document.getElementById('filterDiaDiem');
    if (!select) return;
    // Giữ option đầu "Tất cả địa điểm"
    select.innerHTML = '<option value="">Tất cả địa điểm</option>';
    diaDiems.forEach(dd => {
        const opt = document.createElement('option');
        opt.value = dd.idDiaDiem;
        opt.textContent = dd.tenDiaDiem;
        select.appendChild(opt);
    });
}

// Render checkbox danh mục động
function renderCategoryFilters(categories) {
    const container = document.querySelector('.filter-section .category-checkboxes');
    if (!container) return;

    container.innerHTML = '';
    categories.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="category-filter" value="${cat.idDanhMuc}" checked>
            <span>${cat.tenDanhMuc}</span>
        `;
        container.appendChild(label);
    });
}

// Load events from API
async function loadEvents() {
    try {
        console.log('Fetching events from API...');
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        console.log('Events loaded:', events);
        
        if (events && events.length > 0) {
            allEvents = events;
            filteredEvents = [...allEvents];
            currentPage = 1;
            renderPage();
        } else {
            showNoEventsMessage();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showErrorMessage('Không thể tải danh sách sự kiện. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render trang hiện tại (có phân trang)
function renderPage() {
    const eventsSection = document.querySelector('.events-section');
    // Xóa card cũ
    eventsSection.querySelectorAll('.event-card, .no-events-message, .error-message').forEach(el => el.remove());

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageEvents = filteredEvents.slice(start, start + PAGE_SIZE);
    const pagination = eventsSection.querySelector('.pagination');

    if (pageEvents.length === 0) {
        showNoEventsMessage();
    } else {
        pageEvents.forEach(event => {
            const card = createEventCard(event);
            eventsSection.insertBefore(card, pagination);
        });
    }

    updateResultsCount(filteredEvents.length);
    renderPagination(filteredEvents.length);
}

// Render phân trang động
function renderPagination(total) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    pagination.innerHTML = '';

    // Nút prev
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pagination.appendChild(prevBtn);

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => { currentPage = i; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        pagination.appendChild(btn);
    }

    // Nút next
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pagination.appendChild(nextBtn);
>>>>>>> origin/Nguyen
}

// ─── LỌC + RENDER ─────────────────────────────────────────────────────────────
function applyFiltersAndRender() {
    const statusBtn    = document.querySelector(".status-btn.active");
    const statusFilter = statusBtn?.dataset.status || "open";
    const keyword      = (document.querySelector(".search-box input")?.value || "").trim().toLowerCase();

    let filtered = allEvents.filter(ev => {
        const ts = ev.TrangThai || ev.trangThai || "";
        if (statusFilter === "open")    return ts === "Đã duyệt";
        if (statusFilter === "ongoing") return ts === "Đang diễn ra";
        if (statusFilter === "ended")   return ["Kết thúc", "Hủy"].includes(ts);
        return true;
    });

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
    const countEl    = document.getElementById("resultsCount") || document.querySelector('.results-count');
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

    const totalPages = Math.ceil(events.length / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = events.slice(start, start + PAGE_SIZE);

    container.innerHTML = "";
    paged.forEach((event, idx) => {
        container.appendChild(buildEventCard(event, start + idx));
    });

    if (pagination) {
        if (totalPages > 1) {
            pagination.style.display = "flex";
            const pageInfo = document.getElementById("pageInfo");
            if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

            const btnPrev = document.getElementById("btnPrevPage");
            const btnNext = document.getElementById("btnNextPage");
            if (btnPrev) {
                btnPrev.disabled = currentPage <= 1;
                btnPrev.onclick = () => {
                    if (currentPage > 1) {
                        currentPage--;
                        applyFiltersAndRender();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                };
            }
            if (btnNext) {
                btnNext.disabled = currentPage >= totalPages;
                btnNext.onclick = () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        applyFiltersAndRender();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                };
            }
        } else {
            pagination.style.display = "none";
        }
    }
}

// ─── BUILD EVENT CARD ─────────────────────────────────────────────────────────
function buildEventCard(event, idx) {
    const idSuKien    = event.IdSuKien    ?? event.idSuKien;
    const tenSuKien   = event.TenSuKien   ?? event.tenSuKien   ?? "Sự kiện";
    const moTa        = event.MoTa        ?? event.moTa        ?? "";
    const trangThaiDB = event.TrangThai   ?? event.trangThai   ?? "";
    const diaDiem     = event.TenDiaDiem  ?? event.tenDiaDiem  ?? event.diaDiem?.tenDiaDiem ?? "Đang cập nhật";
    const soToiDa     = event.SoLuongToiDa ?? event.soLuongToiDa;
    const soDaDK      = event.SoDaDangKy   ?? event.soDaDangKy  ?? event.soLuongDaDangKy ?? 0;
    const conLai      = soToiDa ? soToiDa - soDaDK : null;

    const batDau  = event.ThoiGianBatDau  ?? event.thoiGianBatDau;
    const ketThuc = event.ThoiGianKetThuc ?? event.thoiGianKetThuc;

    const now = new Date();
    const batDauDate  = batDau  ? new Date(batDau)  : null;
    const ketThucDate = ketThuc ? new Date(ketThuc) : null;

    let trangThai;
    if (["Hủy","Nháp","Chờ duyệt","Từ chối"].includes(trangThaiDB)) {
        trangThai = trangThaiDB;
    } else if (ketThucDate && now > ketThucDate) {
        trangThai = "Kết thúc";
    } else if (batDauDate && now >= batDauDate) {
        trangThai = "Đang diễn ra";
    } else {
        trangThai = trangThaiDB === "Đã duyệt" ? "Đã duyệt" : trangThaiDB;
    }

    let timeStr = "";
    if (batDau) {
        const s = new Date(batDau);
        timeStr = s.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" });
        if (ketThucDate) timeStr += ` - ${ketThucDate.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}`;
    }

    const imgSrc = EVENT_IMAGES[idx % EVENT_IMAGES.length];

    const badgeCfg = {
        "Đã duyệt":     { cls:"badge-approved",  text:"MỞ ĐĂNG KÝ" },
        "Đang diễn ra": { cls:"badge-ongoing",   text:"ĐANG DIỄN RA" },
        "Kết thúc":     { cls:"badge-ended",     text:"ĐÃ KẾT THÚC" },
        "Hủy":          { cls:"badge-cancelled", text:"ĐÃ HỦY" },
        "Chờ duyệt":    { cls:"badge-pending",   text:"CHỜ DUYỆT" },
        "Từ chối":      { cls:"badge-cancelled", text:"TỪ CHỐI" },
        "Nháp":         { cls:"badge-pending",   text:"NHÁP" },
    };
    const badge = badgeCfg[trangThai] || { cls:"badge-pending", text: trangThai.toUpperCase() };

    const myReg       = myRegMap[idSuKien];
    const myRegStatus = myReg?.trangThai ?? null;
    const myRegId     = myReg?.idDangKy;

    let regBadge = "";
    if (myRegStatus) {
        const regCfg = {
            "Đã xác nhận":  { bg:"#d1fae5", color:"#065f46", icon:"fa-check-circle",  text:"Đã đăng ký" },
            "Chờ xác nhận": { bg:"#fef3c7", color:"#92400e", icon:"fa-clock",         text:"Chờ xác nhận" },
            "Đã tham gia":  { bg:"#dbeafe", color:"#1e40af", icon:"fa-star",          text:"Đã tham gia" },
            "Chờ chỗ":      { bg:"#fef3c7", color:"#92400e", icon:"fa-hourglass-half",text:"Chờ chỗ" },
            "Chờ người dùng xác nhận": { bg:"#fef3c7", color:"#92400e", icon:"fa-bell", text:"Mời xác nhận (24h)" },
            "Vắng mặt":     { bg:"#fee2e2", color:"#991b1b", icon:"fa-user-times",    text:"Vắng mặt" },
        };
        const rc = regCfg[myRegStatus];
        if (rc) {
            regBadge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${rc.bg};color:${rc.color};">
                <i class="fas ${rc.icon}"></i> ${rc.text}
            </span>`;
        }
    }

    const canOpenRegister = ["Đã duyệt","Đang diễn ra"].includes(trangThai);
    const isFull      = conLai !== null && conLai <= 0;
    const canRegister = canOpenRegister && !myRegStatus && !isFull;
    const canWaitlist = canOpenRegister && !myRegStatus && isFull;
    const isEnded     = ["Kết thúc","Hủy"].includes(trangThai);

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
        <div class="event-image" style="position:relative;">
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

    card.addEventListener("click", function (e) {
        if (e.target.closest("button") || e.target.closest("a")) return;
        window.location.href = `event-detail.html?id=${idSuKien}`;
    });

    return card;
}

// ─── NAVIGATE (giữ tương thích với onclick cũ) ────────────────────────────────
function goToEventDetail(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}
window.goToEventDetail = goToEventDetail;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function showError(msg) {
    const loading = document.getElementById("eventsLoading");
    const container = document.getElementById("eventsContainer");
    const target = loading || container;
    if (target) {
        target.innerHTML = `
            <div style="text-align:center;padding:40px;color:#dc2626;background:#fee2e2;border-radius:8px;margin:20px 0;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:16px;display:block;"></i>
                <h3>Có lỗi xảy ra</h3>
                <p>${msg}</p>
                <button class="btn-primary" onclick="location.reload()" style="margin-top:16px;">Thử lại</button>
            </div>`;
    }
}

<<<<<<< HEAD
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m])
    );
}
=======
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

// Initialize filters — kết nối tất cả bộ lọc với logic applyFilters()
function initializeFilters() {
    // Nút "Áp dụng bộ lọc"
    const applyFilterBtn = document.querySelector('.btn-apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }

    // Nút "Đặt lại"
    const resetFilterBtn = document.querySelector('.btn-reset-filter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }

    // Tìm kiếm realtime khi gõ (debounce 400ms)
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 400);
        });
        // Tìm kiếm khi nhấn Enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { clearTimeout(debounceTimer); applyFilters(); }
        });
    }

    // Nút trạng thái (Sắp diễn ra / Đã đóng / Tất cả)
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            statusButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });

    // Lọc theo ngày — áp dụng ngay khi thay đổi
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) dateFrom.addEventListener('change', applyFilters);
    if (dateTo) dateTo.addEventListener('change', applyFilters);

    // Dropdown địa điểm — áp dụng ngay khi thay đổi
    const diaDiemSelect = document.getElementById('filterDiaDiem');
    if (diaDiemSelect) diaDiemSelect.addEventListener('change', applyFilters);

    // Checkbox danh mục — áp dụng ngay
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('category-filter')) applyFilters();
    });
}

// Hàm lọc chính — gọi API server-side search
async function applyFilters() {
    const keyword = (document.querySelector('.search-box input')?.value || '').trim();
    const activeStatusBtn = document.querySelector('.status-btn.active');
    const selectedStatus = activeStatusBtn ? activeStatusBtn.dataset.status : 'all';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const idDiaDiem = document.getElementById('filterDiaDiem')?.value || '';

    // Lấy danh mục được chọn (nếu không chọn hết thì lọc theo cái đầu tiên được chọn)
    const checkedCategories = [...document.querySelectorAll('.category-filter:checked')].map(cb => parseInt(cb.value));
    const allCatIds = allCategories.map(c => c.idDanhMuc);
    // Nếu chọn tất cả hoặc không có danh mục nào → không lọc theo danh mục
    const idDanhMuc = (allCategories.length > 0 && checkedCategories.length === 1)
        ? checkedCategories[0]
        : '';

    // Xây dựng params cho API search
    const params = {
        keyword: keyword || undefined,
        idDanhMuc: idDanhMuc || undefined,
        idDiaDiem: idDiaDiem || undefined,
        trangThai: (selectedStatus && selectedStatus !== 'all') ? mapStatusToTrangThai(selectedStatus) : undefined,
        tuNgay: dateFrom || undefined,
        denNgay: dateTo || undefined,
    };

    try {
        showLoadingState();
        const results = await API.getWithParams(API_CONFIG.ENDPOINTS.SUKIEN_SEARCH, params);
        filteredEvents = results || [];

        // Lọc thêm phía client theo danh mục nếu nhiều checkbox được chọn (nhưng không phải tất cả)
        if (allCategories.length > 0 && checkedCategories.length > 0 && checkedCategories.length < allCatIds.length) {
            filteredEvents = filteredEvents.filter(event => {
                if (!event.danhMucIds || event.danhMucIds.length === 0) return false;
                return event.danhMucIds.some(id => checkedCategories.includes(id));
            });
        }

        currentPage = 1;
        renderPage();
        showSearchFeedback(keyword, filteredEvents.length);
    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        // Fallback: lọc client-side từ allEvents
        applyFiltersClientSide(keyword, selectedStatus, dateFrom, dateTo, checkedCategories);
    }
}

// Map trạng thái button → giá trị TrangThai trong DB
function mapStatusToTrangThai(status) {
    const map = {
        'upcoming': 'Đã duyệt',
        'closed': 'Đã kết thúc',
        'pending': 'Chờ duyệt',
    };
    return map[status] || '';
}

// Fallback lọc client-side (dùng khi API lỗi)
function applyFiltersClientSide(keyword, selectedStatus, dateFrom, dateTo, checkedCategories) {
    filteredEvents = allEvents.filter(event => {
        if (keyword) {
            const searchTarget = [event.tenSuKien || '', event.moTa || '', event.tenDiaDiem || ''].join(' ').toLowerCase();
            if (!searchTarget.includes(keyword.toLowerCase())) return false;
        }
        if (selectedStatus && selectedStatus !== 'all') {
            const trangThai = mapStatusToTrangThai(selectedStatus);
            if (trangThai && event.trangThai !== trangThai) return false;
        }
        if (dateFrom && new Date(event.thoiGianBatDau) < new Date(dateFrom)) return false;
        if (dateTo && new Date(event.thoiGianBatDau) > new Date(dateTo + 'T23:59:59')) return false;
        if (checkedCategories.length > 0 && allCategories.length > 0) {
            const eventCatIds = event.danhMucIds || [];
            if (eventCatIds.length > 0 && !eventCatIds.some(id => checkedCategories.includes(id))) return false;
        }
        return true;
    });
    currentPage = 1;
    renderPage();
    showSearchFeedback(keyword, filteredEvents.length);
}

// Hiển thị trạng thái đang tải
function showLoadingState() {
    const eventsSection = document.querySelector('.events-section');
    eventsSection.querySelectorAll('.event-card, .no-events-message, .error-message, .loading-state').forEach(el => el.remove());
    const pagination = eventsSection.querySelector('.pagination');
    const loading = document.createElement('div');
    loading.className = 'loading-state';
    loading.style.cssText = 'text-align:center;padding:40px;color:#6B7280;';
    loading.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:32px;margin-bottom:12px;display:block;color:#0D5A9C"></i><p>Đang tìm kiếm...</p>';
    eventsSection.insertBefore(loading, pagination);
}

// Đặt lại tất cả bộ lọc
function resetFilters() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) searchInput.value = '';

    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach((btn, i) => btn.classList.toggle('active', i === 0));

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    const diaDiemSelect = document.getElementById('filterDiaDiem');
    if (diaDiemSelect) diaDiemSelect.value = '';

    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = true);

    filteredEvents = [...allEvents];
    currentPage = 1;
    renderPage();

    const feedback = document.querySelector('.search-feedback');
    if (feedback) feedback.remove();
}

// Hiển thị phản hồi tìm kiếm
function showSearchFeedback(keyword, count) {
    let feedback = document.querySelector('.search-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'search-feedback';
        const header = document.querySelector('.section-header');
        if (header) header.after(feedback);
    }
    if (keyword) {
        feedback.innerHTML = `<i class="fas fa-search"></i> Tìm kiếm "<strong>${keyword}</strong>": tìm thấy <strong>${count}</strong> sự kiện`;
        feedback.style.display = 'flex';
    } else {
        feedback.style.display = 'none';
    }
}
>>>>>>> origin/Nguyen
