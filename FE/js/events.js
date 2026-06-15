"use strict";
// js/events.js — Load sự kiện từ API, bộ lọc động, tìm kiếm realtime

const API_BASE = "http://localhost:5103/api";

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

// Ảnh fallback theo danh mục — dùng picsum.photos (luôn hoạt động, không CORS)
const CATEGORY_FALLBACK_IMAGES = {
    "Học thuật":         "https://picsum.photos/seed/academic/400/200",
    "Hội thảo":          "https://picsum.photos/seed/conference/400/200",
    "Tình nguyện":       "https://picsum.photos/seed/volunteer/400/200",
    "Văn nghệ":          "https://picsum.photos/seed/culture/400/200",
    "Văn nghệ thể thao": "https://picsum.photos/seed/sport/400/200",
    "Kỹ năng mềm":       "https://picsum.photos/seed/skills/400/200",
    "Workshop":          "https://picsum.photos/seed/workshop/400/200",
    "Phong trào Đoàn":   "https://picsum.photos/seed/youth/400/200",
    "default":           "https://picsum.photos/seed/event/400/200"
};

function getEventFallbackImage(event) {
    const danhMucs = event.danhMucs || event.DanhMucs || [];
    if (danhMucs.length > 0) {
        const tenDM = (danhMucs[0].tenDanhMuc || danhMucs[0].TenDanhMuc || "").toLowerCase();
        if (tenDM.includes("học thuật") || tenDM.includes("hội thảo")) return CATEGORY_FALLBACK_IMAGES["Hội thảo"];
        if (tenDM.includes("tình nguyện")) return CATEGORY_FALLBACK_IMAGES["Tình nguyện"];
        if (tenDM.includes("workshop") || tenDM.includes("kỹ năng")) return CATEGORY_FALLBACK_IMAGES["Workshop"];
        if (tenDM.includes("văn nghệ") || tenDM.includes("văn hóa")) return CATEGORY_FALLBACK_IMAGES["Văn nghệ"];
        if (tenDM.includes("đoàn") || tenDM.includes("phong trào")) return CATEGORY_FALLBACK_IMAGES["Phong trào Đoàn"];
        if (tenDM.includes("thể thao")) return CATEGORY_FALLBACK_IMAGES["Văn nghệ thể thao"];
    }
    const ten = (event.tenSuKien || event.TenSuKien || "").toLowerCase();
    if (ten.includes("hội thảo") || ten.includes("học thuật") || ten.includes("seminar")) return CATEGORY_FALLBACK_IMAGES["Học thuật"];
    if (ten.includes("tình nguyện")) return CATEGORY_FALLBACK_IMAGES["Tình nguyện"];
    if (ten.includes("workshop") || ten.includes("kỹ năng") || ten.includes("khởi nghiệp")) return CATEGORY_FALLBACK_IMAGES["Workshop"];
    if (ten.includes("văn nghệ") || ten.includes("văn hóa") || ten.includes("festival")) return CATEGORY_FALLBACK_IMAGES["Văn nghệ"];
    if (ten.includes("hackathon") || ten.includes("công nghệ") || ten.includes("ai")) return "https://picsum.photos/seed/tech/400/200";
    if (ten.includes("thể thao") || ten.includes("sport")) return CATEGORY_FALLBACK_IMAGES["Văn nghệ thể thao"];
    if (ten.includes("đoàn") || ten.includes("phong trào")) return CATEGORY_FALLBACK_IMAGES["Phong trào Đoàn"];
    // Dùng idSuKien làm seed để mỗi sự kiện có ảnh khác nhau
    const seed = event.idSuKien || event.IdSuKien || Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/400/200`;
}

let allEvents   = [];
let myRegMap    = {};
let allCategories = [];
let allDiaDiems = [];
let currentPage = 1;
const PAGE_SIZE = 6;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    showLoading(true);
    await Promise.all([
        loadAllEvents(),
        loadMyRegistrations(),
        loadCategories(),
        loadDiaDiems()
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
        console.warn("Không load được thông tin đăng ký của user:", e);
    }
}

// ─── LOAD DANH MỤC ────────────────────────────────────────────────────────────
async function loadCategories() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/DanhMuc`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error();
        const categories = await res.json();
        if (categories && categories.length > 0) {
            allCategories = categories;
            renderCategoryFilters(categories);
        }
    } catch (error) {
        console.warn('Không thể tải danh mục:', error);
    }
}

// ─── LOAD ĐỊA ĐIỂM ────────────────────────────────────────────────────────────
async function loadDiaDiems() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/DiaDiem`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error();
        const diaDiems = await res.json();
        if (diaDiems && diaDiems.length > 0) {
            allDiaDiems = diaDiems;
            renderDiaDiemFilter(diaDiems);
        }
    } catch (error) {
        console.warn('Không thể tải địa điểm:', error);
    }
}

function renderDiaDiemFilter(diaDiems) {
    const select = document.getElementById('filterDiaDiem');
    if (!select) return;
    select.innerHTML = '<option value="">Tất cả địa điểm</option>';
    diaDiems.forEach(dd => {
        const opt = document.createElement('option');
        opt.value = dd.idDiaDiem || dd.IdDiaDiem;
        opt.textContent = dd.tenDiaDiem || dd.TenDiaDiem;
        select.appendChild(opt);
    });
}

function renderCategoryFilters(categories) {
    const container = document.querySelector('.filter-section .category-checkboxes');
    if (!container) return;

    container.innerHTML = '';
    categories.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="category-filter" value="${cat.idDanhMuc || cat.IdDanhMuc}" checked>
            <span>${cat.tenDanhMuc || cat.TenDanhMuc}</span>
        `;
        container.appendChild(label);
    });
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

    const resetBtn = document.querySelector(".btn-reset-filter");
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            resetFilters();
        });
    }

    const facultySelect = document.getElementById('facultyFilter');
    if (facultySelect) {
        facultySelect.addEventListener('change', () => {
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    const diaDiemSelect = document.getElementById('filterDiaDiem');
    if (diaDiemSelect) {
        diaDiemSelect.addEventListener('change', () => {
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('category-filter')) {
            currentPage = 1;
            applyFiltersAndRender();
        }
    });
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
    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            clearTimeout(debounceTimer);
            currentPage = 1;
            applyFiltersAndRender();
        }
    });
}

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

    const facultySelect = document.getElementById('facultyFilter');
    if (facultySelect) facultySelect.value = 'all';

    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = true);

    currentPage = 1;
    applyFiltersAndRender();
}

// ─── LỌC + RENDER ─────────────────────────────────────────────────────────────
function applyFiltersAndRender() {
    const statusBtn    = document.querySelector(".status-btn.active");
    const statusFilter = statusBtn?.dataset.status || "all";
    const keyword      = (document.querySelector(".search-box input")?.value || "").trim().toLowerCase();
    const idDiaDiem    = document.getElementById('filterDiaDiem')?.value || '';
    const facultyFilter = document.getElementById('facultyFilter')?.value || 'all';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;

    const checkedCategories = [...document.querySelectorAll('.category-filter:checked')].map(cb => cb.value);

    let filtered = allEvents.filter(ev => {
        // 1. Lọc theo trạng thái
        const ts = ev.TrangThai || ev.trangThai || "";
        if (statusFilter === "open") {
            if (ts !== "Đã duyệt") return false;
        } else if (statusFilter === "ongoing") {
            if (ts !== "Đang diễn ra") return false;
        } else if (statusFilter === "ended") {
            if (!["Kết thúc", "Hủy", "Đã kết thúc"].includes(ts)) return false;
        }

        // 2. Lọc theo keyword
        if (keyword) {
            const name = (ev.TenSuKien || ev.tenSuKien || "").toLowerCase();
            const desc = (ev.MoTa || ev.moTa || "").toLowerCase();
            const dd   = (ev.TenDiaDiem || ev.tenDiaDiem || "").toLowerCase();
            if (!name.includes(keyword) && !desc.includes(keyword) && !dd.includes(keyword)) return false;
        }

        // 3. Lọc theo địa điểm
        if (idDiaDiem) {
            const ddId = ev.IdDiaDiem || ev.idDiaDiem;
            if (ddId != idDiaDiem) return false;
        }

        // 4. Lọc theo danh mục
        if (checkedCategories.length > 0) {
            // Sự kiện có thể có nhiều danh mục (danhMucs[]) hoặc một danh mục đơn (IdDanhMuc)
            const danhMucs = ev.danhMucs || ev.DanhMucs || [];
            if (danhMucs.length > 0) {
                // Kiểm tra có ít nhất 1 danh mục được tick
                const matched = danhMucs.some(dm => {
                    const dmId = String(dm.idDanhMuc ?? dm.IdDanhMuc ?? dm.id ?? "");
                    return checkedCategories.includes(dmId);
                });
                if (!matched) return false;
            } else {
                // Fallback: trường đơn IdDanhMuc
                const catId = ev.IdDanhMuc ?? ev.idDanhMuc;
                if (catId != null && !checkedCategories.includes(String(catId))) return false;
                // Nếu không có danh mục nào thì vẫn hiển thị (không lọc ra)
            }
        }

        // 5. Lọc theo khoảng thời gian
        if (dateFrom) {
            const eventStart = new Date(ev.ThoiGianBatDau || ev.thoiGianBatDau);
            if (eventStart < new Date(dateFrom)) return false;
        }
        if (dateTo) {
            const eventStart = new Date(ev.ThoiGianBatDau || ev.thoiGianBatDau);
            if (eventStart > new Date(dateTo + 'T23:59:59')) return false;
        }

        return true;
    });

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
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
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

    const imgSrc = event.hinhAnh || event.HinhAnh || getEventFallbackImage(event);
    const imgHtml = `<img src="${imgSrc}" alt="${escapeHtml(tenSuKien)}"
           style="width:100%;height:100%;object-fit:cover;display:block;"
           onerror="this.src='${getEventFallbackImage(event)}'">`;

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
            ${imgHtml}
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
function showLoading(show) {
    const loading = document.getElementById("eventsLoading");
    if (loading) loading.style.display = show ? "block" : "none";
}

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

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m])
    );
}

function getFallbackImg() {
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#0D5A9C 0%,#1976D2 100%);display:flex;align-items:center;justify-content:center;">
        <i class="fas fa-calendar-alt" style="font-size:40px;color:rgba(255,255,255,0.35);"></i>
    </div>`;
}
window.getFallbackImg = getFallbackImg;
