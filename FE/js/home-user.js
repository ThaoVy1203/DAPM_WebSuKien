// js/home-user.js
const API_BASE = "http://localhost:5103/api";

// ===== Fallback Images (Consistent with events.js) =====
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

// ===== State sự kiện =====
let huAllEvents = [];
let huAllDanhMucs = [];

document.addEventListener("DOMContentLoaded", async function () {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") || localStorage.getItem("userData");
    if (!token && !user) {
        window.location.href = "login.html";
        return;
    }

    // 2. Load các cấu phần UI
    loadUserInfo();
    initUserMenu();
    await loadNotificationCount();
    
    // 3. Tải dữ liệu danh mục & sự kiện qua API
    try {
        await loadHuDanhMucs();
        await loadHuEvents();
        initHuSearch();
    } catch (e) {
        console.error("Lỗi khi load dữ liệu trang chủ:", e);
    }
    
    // 4. Khởi tạo hiệu ứng UI
    initScrollAnimations();
    initUIEnhancements();
});

// ==========================
// USER INFO
// ==========================
function loadUserInfo() {
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!raw) return;

    try {
        const user = JSON.parse(raw);
        const hoTen = user.hoTen || user.HoTen || "Người dùng";

        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = hoTen;

        const avatarEl = document.getElementById("userAvatar") || document.querySelector(".user-avatar");
        if (avatarEl) {
            const name = encodeURIComponent(hoTen);
            avatarEl.src = user.anhDaiDien || user.AnhDaiDien
                || `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff`;
            avatarEl.onerror = function () {
                this.src = `https://ui-avatars.com/api/?name=${name}&background=0D5A9C&color=fff`;
            };
            avatarEl.alt = hoTen;
        }
    } catch (e) {
        console.error("Lỗi parse userData:", e);
    }
}

// ==========================
// USER MENU DROPDOWN
// ==========================
function initUserMenu() {
    const wrapper = document.getElementById("userMenuWrapper") || document.querySelector(".user-menu");
    const dropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!wrapper || !dropdown) return;

    wrapper.addEventListener("click", function (e) {
        e.stopPropagation();
        const isVisible = dropdown.style.display === "block";
        dropdown.style.display = isVisible ? "none" : "block";
    });

    document.addEventListener("click", function () {
        if (dropdown) dropdown.style.display = "none";
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }
}

// ==========================
// LOGOUT
// ==========================
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        localStorage.removeItem("user");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
        sessionStorage.clear();
        window.location.href = "login.html";
    }
}

// ==========================
// NOTIFICATION COUNT
// ==========================
async function loadNotificationCount() {
    const token = localStorage.getItem("token");
    const badge = document.getElementById("notifBadge");
    if (!badge) return;

    let idNguoiDung = "";
    const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
    if (rawUser) {
        try {
            const u = JSON.parse(rawUser);
            idNguoiDung = u.IdNguoiDung || u.idNguoiDung || u.id || "";
        } catch (e) {}
    }

    try {
        const res = await fetch(`${API_BASE}/ThongBao/unread-count?idNguoiDung=${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const count = typeof data === "number" ? data : (data.count || data.soLuong || 0);

        if (count > 0) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = "inline-block";
        } else {
            badge.style.display = "none";
        }
    } catch (e) {
        console.log("Không lấy được số thông báo:", e);
    }
}

// ==========================
// CATEGORIES (DANH MỤC)
// ==========================
async function loadHuDanhMucs() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/DanhMuc`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        huAllDanhMucs = data || [];
        
        const sel = document.getElementById('huFilterDanhMuc');
        if (!sel) return;
        
        // Clear options except first
        sel.innerHTML = '<option value="">Tất cả danh mục</option>';
        huAllDanhMucs.forEach(dm => {
            const opt = document.createElement('option');
            opt.value = dm.idDanhMuc;
            opt.textContent = dm.tenDanhMuc;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn('Không tải được danh mục:', e);
    }
}

// ==========================
// EVENTS (SỰ KIỆN)
// ==========================
async function loadHuEvents() {
    showHuLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Không lấy được sự kiện");
        const data = await res.json();
        huAllEvents = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
        renderHuEvents(huAllEvents);
    } catch (e) {
        console.error('Lỗi tải sự kiện:', e);
        showHuError('Không thể tải sự kiện. Vui lòng thử lại sau.');
    } finally {
        showHuLoading(false);
    }
}

// ==========================
// RENDER CARD HELPER (Consistent with events.js)
// ==========================
function renderHuEvents(events) {
    const grid = document.getElementById('huEventsGrid');
    if (!grid) return;
    grid.querySelectorAll('.event-card, .hu-empty, .hu-error').forEach(el => el.remove());

    if (events.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'hu-empty';
        empty.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <h4>Không tìm thấy sự kiện nào</h4>
            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
        `;
        grid.appendChild(empty);
    } else {
        events.slice(0, 6).forEach(event => {
            grid.appendChild(createHuEventCard(event));
        });
    }

    const count = document.getElementById('huResultCount');
    if (count) {
        count.textContent = events.length > 0
            ? `Hiển thị ${Math.min(events.length, 6)} / ${huAllEvents.length} sự kiện`
            : '';
    }
}

function createHuEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const idSuKien = event.idSuKien || event.IdSuKien;
    const tenSuKien = event.tenSuKien || event.TenSuKien || "Chưa có tên";
    const batDau = event.thoiGianBatDau || event.ThoiGianBatDau;
    const ketThuc = event.thoiGianKetThuc || event.ThoiGianKetThuc;

    const startDate = batDau ? new Date(batDau) : null;
    const dateStr = startDate 
        ? `${String(startDate.getDate()).padStart(2,'0')}/${String(startDate.getMonth()+1).padStart(2,'0')}/${startDate.getFullYear()}`
        : "Chưa có";
    
    const endDate = ketThuc ? new Date(ketThuc) : null;
    const endDateStr = endDate 
        ? `${String(endDate.getDate()).padStart(2,'0')}/${String(endDate.getMonth()+1).padStart(2,'0')}`
        : "";

    const fullDateStr = endDateStr ? `${dateStr} - ${endDateStr}` : dateStr;
    const diaDiem = event.tenDiaDiem || event.TenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";

    let badgeClass = '';
    let badgeText = event.trangThai || event.TrangThai || 'Nháp';
    if (badgeText === 'Đã duyệt') { badgeClass = ''; badgeText = 'Sắp diễn ra'; }
    else if (badgeText === 'Đang diễn ra') { badgeClass = 'blue'; badgeText = 'Đang diễn ra'; }
    else if (badgeText === 'Đã kết thúc' || badgeText === 'Kết thúc') { badgeClass = 'green'; badgeText = 'Đã kết thúc'; }
    else if (badgeText === 'Hủy') { badgeClass = 'red'; badgeText = 'Đã hủy'; }

    const imgSrc = event.hinhAnh || event.HinhAnh || getEventFallbackImage(event);

    card.innerHTML = `
        <div class="event-badge ${badgeClass}">${badgeText}</div>
        <img src="${imgSrc}" alt="${escapeHtml(tenSuKien)}"
             onerror="this.src='${getEventFallbackImage(event)}'">
        <div class="event-card-content">
            <h3>${escapeHtml(tenSuKien)}</h3>
            <div class="event-meta">
                <span><i class="far fa-calendar"></i> ${fullDateStr}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
            </div>
            <a href="event-detail.html?id=${idSuKien}" class="btn-view-detail">Xem chi tiết</a>
        </div>
    `;
    return card;
}

// ==========================
// SEARCH & FILTERS
// ==========================
function initHuSearch() {
    const input = document.getElementById('huKeyword');
    const clearBtn = document.getElementById('huClearSearch');
    const selDanhMuc = document.getElementById('huFilterDanhMuc');
    const selTrangThai = document.getElementById('huFilterTrangThai');
    const resetBtn = document.getElementById('huResetFilter');

    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
        debounce = setTimeout(applyHuFilters, 300);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(debounce); applyHuFilters(); } });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            applyHuFilters();
            input.focus();
        });
    }
    if (selDanhMuc) selDanhMuc.addEventListener('change', applyHuFilters);
    if (selTrangThai) selTrangThai.addEventListener('change', applyHuFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetHuFilters);
}

function applyHuFilters() {
    const keyword = (document.getElementById('huKeyword')?.value || '').trim().toLowerCase();
    const idDanhMuc = document.getElementById('huFilterDanhMuc')?.value || '';
    const trangThai = document.getElementById('huFilterTrangThai')?.value || '';

    const filtered = huAllEvents.filter(event => {
        if (keyword) {
            const ten = event.tenSuKien || event.TenSuKien || '';
            const moTa = event.moTa || event.MoTa || '';
            const diaDiem = event.tenDiaDiem || event.TenDiaDiem || event.diaDiem?.tenDiaDiem || '';
            const target = [ten, moTa, diaDiem].join(' ').toLowerCase();
            if (!target.includes(keyword)) return false;
        }
        if (idDanhMuc) {
            const catId = event.idDanhMuc || event.IdDanhMuc;
            if (catId != idDanhMuc) return false;
        }
        if (trangThai) {
            const status = event.trangThai || event.TrangThai || '';
            if (status !== trangThai) return false;
        }
        return true;
    });

    renderHuEvents(filtered);
}

function resetHuFilters() {
    const input = document.getElementById('huKeyword');
    const clearBtn = document.getElementById('huClearSearch');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    const sel1 = document.getElementById('huFilterDanhMuc');
    const sel2 = document.getElementById('huFilterTrangThai');
    if (sel1) sel1.value = '';
    if (sel2) sel2.value = '';
    renderHuEvents(huAllEvents);
}

function showHuLoading(show) {
    const el = document.getElementById('huLoading');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function showHuError(msg) {
    const grid = document.getElementById('huEventsGrid');
    if (!grid) return;
    grid.querySelectorAll('.event-card, .hu-empty, .hu-error').forEach(el => el.remove());
    const err = document.createElement('div');
    err.className = 'hu-error';
    err.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h4>Có lỗi xảy ra</h4>
        <p>${msg}</p>
    `;
    grid.appendChild(err);
}

// ==========================
// SCROLL ANIMATIONS & UI ENHANCEMENTS
// ==========================
function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".event-card, .feature-item, .stat-item").forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        observer.observe(el);
    });
}

function initUIEnhancements() {
    window.addEventListener('scroll', function() {
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            const scrolled = window.scrollY;
            heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
                    if(!isNaN(target)) animateCounter(stat, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + ',000+';
    }
    return num + '+';
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
}