// js/home-user.js
const API_BASE = "https://localhost:7160/api";

<<<<<<< HEAD
// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    // Kiểm tra đăng nhập - nếu chưa đăng nhập thì về trang login
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
=======
// ===== State sự kiện =====
let huAllEvents = [];
let huAllDanhMucs = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserInfo();
    initializeUserMenu();
    initializeNotifications();
    initializeScrollAnimations();

    // Load sự kiện từ API
    loadHuDanhMucs().then(() => loadHuEvents());
    initHuSearch();
});

// Check if user is logged in
function checkAuthentication() {
    const user = localStorage.getItem('user');
    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
>>>>>>> origin/Nguyen
        return;
    }

    loadUserInfo();
    initUserMenu();
    await loadFeaturedEvents();
    await loadNotificationCount();
    initScrollAnimations();
    initUIEnhancements(); // Khởi tạo các hiệu ứng UI từ nhánh cũ
});

// ==========================
// USER INFO
// ==========================
function loadUserInfo() {
    // Hỗ trợ cả 2 key lưu trữ
    const raw = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!raw) return;

    try {
        const user = JSON.parse(raw);

        // Hỗ trợ cả PascalCase (BE trả) và camelCase
        const hoTen = user.HoTen || user.hoTen || "Người dùng";

        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = hoTen;

        const avatarEl = document.getElementById("userAvatar") || document.querySelector(".user-avatar");
        if (avatarEl) {
            const name = encodeURIComponent(hoTen);
            avatarEl.src = user.AnhDaiDien || user.anhDaiDien
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

    // Toggle dropdown khi click vào user menu
    wrapper.addEventListener("click", function (e) {
        e.stopPropagation();
        const isVisible = dropdown.style.display === "block";
        dropdown.style.display = isVisible ? "none" : "block";
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener("click", function () {
        if (dropdown) dropdown.style.display = "none";
    });

    // Đăng xuất
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
        // Clear toàn bộ user session 
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        localStorage.removeItem("user");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
        sessionStorage.clear();
        
        // Redirect to login page
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

    try {
        const res = await fetch(`${API_BASE}/ThongBao/unread-count`, {
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
// FEATURED EVENTS
// ==========================
async function loadFeaturedEvents() {
    const token = localStorage.getItem("token");
    const container = document.querySelector(".events-grid");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Không lấy được sự kiện");

        const data = await res.json();
        // API có thể trả về mảng trực tiếp hoặc { data: [...] }
        const events = Array.isArray(data) ? data : (data.data || data.items || []);

        renderFeaturedEvents(events, container);

    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">
                <i class="fas fa-exclamation-circle" style="font-size:32px; margin-bottom:12px; display:block;"></i>
                Không thể tải sự kiện. Vui lòng thử lại sau.
            </div>`;
    }
}

<<<<<<< HEAD
function renderFeaturedEvents(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">
                Hiện chưa có sự kiện nào.
            </div>`;
        return;
    }

    // Chỉ hiển thị tối đa 3 sự kiện nổi bật
    container.innerHTML = "";
    events.slice(0, 3).forEach(event => {
        const idSuKien = event.IdSuKien ?? event.idSuKien;
        const tenSuKien = event.TenSuKien ?? event.tenSuKien ?? "Chưa có tên";
        const batDau = event.ThoiGianBatDau ?? event.thoiGianBatDau;
        const ketThuc = event.ThoiGianKetThuc ?? event.thoiGianKetThuc;
        const startDate = batDau ? new Date(batDau).toLocaleDateString("vi-VN") : "Chưa có";
        const endDate = ketThuc ? new Date(ketThuc).toLocaleDateString("vi-VN") : "";
        const dateStr = endDate ? `${startDate} - ${endDate}` : startDate;

        const diaDiem = event.TenDiaDiem ?? event.tenDiaDiem ?? event.DiaDiem?.TenDiaDiem ?? "Đang cập nhật";
        const trangThai = event.TrangThai ?? event.trangThai ?? "";
        const badgeClass = getBadgeClass(trangThai);
        const badgeText = trangThai || "Sự kiện";
        const isFeatured = events.indexOf(event) === 0 ? "featured" : "";

        container.innerHTML += `
            <div class="event-card ${isFeatured}">
                <div class="event-badge ${badgeClass}">${escapeHtml(badgeText)}</div>
                <div class="event-card-content">
                    <h3>${escapeHtml(tenSuKien)}</h3>
                    <div class="event-meta">
                        <span><i class="far fa-calendar"></i> ${dateStr}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
                    </div>
                    <a href="event-detail.html?id=${idSuKien}" class="btn-view-detail">Xem chi tiết</a>
                </div>
            </div>`;
    });
}

function getBadgeClass(trangThai) {
    switch (trangThai) {
        case "Đang diễn ra": return "blue";
        case "Đã duyệt":
        case "Kết thúc":    return "green";
        case "Hủy":         return "red";
        default:            return "";
    }
}

// ==========================
// SCROLL ANIMATIONS & UI ENHANCEMENTS
// ==========================
function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
=======
// Event Cards Functionality (legacy — giữ cho các card tĩnh nếu còn)
function initializeEventCards() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        const detailBtn = card.querySelector('.btn-view-detail');
        if (detailBtn) {
            detailBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = card.dataset.eventId || '1';
                window.location.href = `event-detail.html?id=${eventId}`;
            });
        }
    });
}

// ===== Load danh mục =====
async function loadHuDanhMucs() {
    try {
        const data = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        huAllDanhMucs = data || [];
        const sel = document.getElementById('huFilterDanhMuc');
        if (!sel) return;
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

// ===== Load sự kiện từ API =====
async function loadHuEvents() {
    showHuLoading(true);
    try {
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        huAllEvents = events || [];
        renderHuEvents(huAllEvents);
    } catch (e) {
        console.error('Lỗi tải sự kiện:', e);
        showHuError('Không thể tải sự kiện. Vui lòng thử lại sau.');
    } finally {
        showHuLoading(false);
    }
}

// ===== Render card sự kiện =====
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
        // Hiển thị tối đa 6 sự kiện nổi bật ở trang chủ
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

    const startDate = new Date(event.thoiGianBatDau);
    const dateStr = `${String(startDate.getDate()).padStart(2,'0')}/${String(startDate.getMonth()+1).padStart(2,'0')}/${startDate.getFullYear()}`;
    const endDate = new Date(event.thoiGianKetThuc);
    const endDateStr = `${String(endDate.getDate()).padStart(2,'0')}/${String(endDate.getMonth()+1).padStart(2,'0')}`;

    let badgeClass = '';
    let badgeText = event.trangThai || 'Nháp';
    if (event.trangThai === 'Đã duyệt') { badgeClass = ''; badgeText = 'Sắp diễn ra'; }
    else if (event.trangThai === 'Đang diễn ra') { badgeClass = 'blue'; badgeText = 'Đang diễn ra'; }
    else if (event.trangThai === 'Đã kết thúc') { badgeClass = 'green'; badgeText = 'Đã kết thúc'; }

    card.innerHTML = `
        <div class="event-badge ${badgeClass}">${badgeText}</div>
        <img src="../images/event${event.idSuKien}.png" alt="${event.tenSuKien}"
             onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Su+Kien'">
        <div class="event-card-content">
            <h3>${event.tenSuKien}</h3>
            <div class="event-meta">
                <span><i class="far fa-calendar"></i> ${dateStr} - ${endDateStr}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}</span>
            </div>
            <a href="event-detail.html?id=${event.idSuKien}" class="btn-view-detail">Xem chi tiết</a>
        </div>
    `;
    return card;
}

// ===== Tìm kiếm & lọc =====
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
            const target = [event.tenSuKien || '', event.moTa || '', event.tenDiaDiem || ''].join(' ').toLowerCase();
            if (!target.includes(keyword)) return false;
        }
        if (idDanhMuc) {
            const ids = event.danhMucIds || [];
            if (!ids.includes(parseInt(idDanhMuc))) return false;
        }
        if (trangThai && event.trangThai !== trangThai) return false;
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

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
>>>>>>> origin/Nguyen
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
    // Hero Section Parallax Effect
    window.addEventListener('scroll', function() {
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            const scrolled = window.pageYOffset;
            heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Trigger counter animation when stats section is visible
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

    const statsSection = document.querySelector('.stats-section, .stat-item');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Smooth scroll for anchor links
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

// Stats Counter Animation
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

// ==========================
// HELPERS
// ==========================
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
}