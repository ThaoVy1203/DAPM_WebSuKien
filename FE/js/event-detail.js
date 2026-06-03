<<<<<<< HEAD
// Event Detail Page - API Integration
let currentEvent = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Event detail page loaded');
    
    // Get user from localStorage
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem chi tiết sự kiện');
        window.location.href = 'login.html';
        return;
    }
    
    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        await loadEventDetail(eventId);
    } else {
        showError('Không tìm thấy ID sự kiện');
    }
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load event detail from API
async function loadEventDetail(eventId) {
    try {
        console.log('Loading event detail for ID:', eventId);
        
        // Show loading state
        showLoading();
        
        // Fetch event detail
        const event = await API.get(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(eventId));
        console.log('Event loaded:', event);
        
        currentEvent = event;
        
        // Render event detail
        renderEventDetail(event);
        
        // Check registration status
        await checkRegistrationStatus(eventId);
        
    } catch (error) {
        console.error('Error loading event:', error);
        showError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.');
    }
}

// Render event detail
function renderEventDetail(event) {
    // Update page title
    document.title = event.tenSuKien + ' - UTE Events';
    
    // Update event title
    const titleElement = document.querySelector('.event-detail-header h1');
    if (titleElement) {
        titleElement.textContent = event.tenSuKien;
    }
    
    // Update event status badge
    const statusBadge = document.querySelector('.event-status');
    if (statusBadge) {
        statusBadge.textContent = event.trangThai;
        statusBadge.className = 'event-status ' + getStatusClass(event.trangThai);
    }
    
    // Update event meta info
    updateEventMeta(event);
    
    // Update event description
    const descElement = document.querySelector('.event-description');
    if (descElement) {
        descElement.textContent = event.moTa || 'Không có mô tả';
    }
    
    // Update registration info
    updateRegistrationInfo(event);
    
    // Hide loading
    hideLoading();
}

// Update event meta information
function updateEventMeta(event) {
    const startDate = new Date(event.thoiGianBatDau);
    const endDate = new Date(event.thoiGianKetThuc);
    
    // Format date
    const dateStr = startDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Format time
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    // Update date
    const dateElement = document.querySelector('.event-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class="far fa-calendar"></i> ${dateStr}`;
    }
    
    // Update time
    const timeElement = document.querySelector('.event-time');
    if (timeElement) {
        timeElement.innerHTML = `<i class="far fa-clock"></i> ${timeStr}`;
    }
    
    // Update location
    const locationElement = document.querySelector('.event-location');
    if (locationElement) {
        locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.tenDiaDiem || 'Chưa xác định'}`;
    }
    
    // Update organizer
    const organizerElement = document.querySelector('.event-organizer');
    if (organizerElement) {
        organizerElement.innerHTML = `<i class="fas fa-user"></i> ${event.tenNguoiTao || 'Ban tổ chức'}`;
    }
}

// Update registration information
function updateRegistrationInfo(event) {
    const registered = event.soDaDangKy || 0;
    const max = event.soLuongToiDa || 0;
    const available = max - registered;
    
    // Update registered count
    const registeredElement = document.querySelector('.registered-count');
    if (registeredElement) {
        registeredElement.textContent = registered;
    }
    
    // Update max count
    const maxElement = document.querySelector('.max-count');
    if (maxElement) {
        maxElement.textContent = max || 'Không giới hạn';
    }
    
    // Update available count
    const availableElement = document.querySelector('.available-count');
    if (availableElement) {
        availableElement.textContent = max ? available : 'Không giới hạn';
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar && max > 0) {
        const percentage = (registered / max) * 100;
        progressBar.style.width = percentage + '%';
    }
}

// Check if user already registered
async function checkRegistrationStatus(eventId) {
    try {
        // Fetch user's registrations
        const registrations = await API.get(API_CONFIG.ENDPOINTS.DANGKY_BY_NGUOIDUNG(currentUser.idNguoiDung));
        
        // Check if already registered for this event
        const isRegistered = registrations.some(r => 
            r.idSuKien === parseInt(eventId) && 
            (r.trangThai === 'Chờ xác nhận' || r.trangThai === 'Đã xác nhận')
        );
        
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            if (isRegistered) {
                registerBtn.textContent = 'Đã đăng ký';
                registerBtn.classList.add('registered');
                registerBtn.disabled = true;
            } else if (currentEvent.trangThai !== 'Đã duyệt') {
                registerBtn.textContent = 'Chưa mở đăng ký';
                registerBtn.disabled = true;
            } else {
                // Check if event is full
                const registered = currentEvent.soLuongDaDangKy || 0;
                const max = currentEvent.soLuongToiDa || 999999;
                if (registered >= max) {
                    registerBtn.textContent = 'Hết chỗ';
                    registerBtn.disabled = true;
                }
            }
        }
    } catch (error) {
        console.error('Error checking registration:', error);
    }
}

// Register for event
async function registerEvent() {
    if (!currentEvent || !currentUser) return;
    
    try {
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.textContent = 'Đang đăng ký...';
        }
        
        // Create registration
        const registrationData = {
            idSuKien: currentEvent.idSuKien,
            idNguoiDung: currentUser.idNguoiDung
        };
        
        const response = await API.post(API_CONFIG.ENDPOINTS.DANGKY_REGISTER, registrationData);
        
        if (response.success) {
            // Show success modal with QR code
            showSuccessModal();
        } else {
            alert(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Đăng ký ngay';
            }
        }
        
    } catch (error) {
        console.error('Error registering:', error);
        alert('Đăng ký thất bại. Vui lòng thử lại sau.');
        
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Đăng ký ngay';
        }
    }
}

// Show success modal with QR code
function showSuccessModal() {
    const qrData = `UTE-EVENT-${currentUser.idNguoiDung}-${currentEvent.idSuKien}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            animation: slideUp 0.3s ease;
        ">
            <div class="modal-header">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #10B981; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 10px;">Đăng ký thành công!</h2>
                <p style="color: #666;">Bạn đã đăng ký sự kiện thành công</p>
            </div>
            <div class="modal-body" style="margin: 30px 0;">
                <div class="qr-code" style="background: #f9fafb; padding: 20px; border-radius: 12px; display: inline-block;">
                    <img src="${qrUrl}" alt="QR Code" style="width: 250px; height: 250px;">
                </div>
                <p style="color: #666; margin-top: 20px; font-size: 14px;">
                    Vui lòng lưu mã QR này để check-in tại sự kiện
                </p>
            </div>
            <div class="modal-footer">
                <button onclick="goToMyTickets()" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    Xem vé của tôi
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto redirect after 5 seconds
    setTimeout(() => {
        goToMyTickets();
    }, 5000);
}

// Go to my tickets page
function goToMyTickets() {
    window.location.href = 'my-tickets.html';
}

// Make function global
window.goToMyTickets = goToMyTickets;

// Initialize event handlers
function initializeEventHandlers() {
    // Register button
    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', registerEvent);
    }
    
    // Share button
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareEvent);
    }
    
    // Back button
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
}

// Share event
function shareEvent() {
    if (navigator.share && currentEvent) {
        navigator.share({
            title: currentEvent.tenSuKien,
            text: currentEvent.moTa,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy link
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép link sự kiện!');
    }
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'Đã duyệt': 'approved',
        'Chờ duyệt': 'pending',
        'Từ chối': 'rejected',
        'Đang diễn ra': 'ongoing',
        'Kết thúc': 'ended'
    };
    return statusMap[status] || 'default';
}

// Show loading state
function showLoading() {
    const container = document.querySelector('.event-detail-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #0D5A9C;"></i>
                <p style="margin-top: 20px; color: #666;">Đang tải thông tin sự kiện...</p>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading() {
    // Loading is replaced by actual content
}

// Show error message
function showError(message) {
    const container = document.querySelector('.event-detail-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
                <h3 style="margin-top: 20px; color: #333;">${message}</h3>
                <button onclick="window.history.back()" class="btn-primary" style="margin-top: 20px;">
                    Quay lại
                </button>
            </div>
        `;
=======
// js/event-detail.js
// BE endpoints: POST /api/DangKy/dang-ky | POST /api/DangKy/huy-dang-ky
//               POST /api/DangKy/check-in | POST /api/DangKy/check-out
//               GET  /api/DangKy/nguoi-dung/{idNguoiDung}
const API_BASE = "https://localhost:7160/api";

let currentEventId     = null;
let currentEvent       = null;
let currentDangKyId    = null;
let currentIdNguoiDung = null;

function getEventId() {
    return new URLSearchParams(window.location.search).get("id");
}

// ── Lấy idNguoiDung từ userData (BE trả PascalCase: IdNguoiDung) ──
function getIdNguoiDung() {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    try {
        const u = JSON.parse(raw);
        // Hỗ trợ cả PascalCase (từ BE) và camelCase
        return u.IdNguoiDung || u.idNguoiDung || u.id || null;
    } catch { return null; }
}

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    currentEventId     = getEventId();
    currentIdNguoiDung = getIdNguoiDung();

    if (!currentEventId) {
        showError("Không tìm thấy sự kiện. Vui lòng quay lại danh sách sự kiện.");
        return;
    }

    await loadEventDetail(currentEventId);
    prefillUserInfo();

    if (currentIdNguoiDung) {
        await checkRegistrationStatus(currentEventId);
    }

    initRegisterBtn(currentEventId);
    initCancelBtn(currentEventId);
    initSubmitQuestion(currentEventId);
    initSmoothScroll();

    const btnFull = document.getElementById("btnRegisterFull");
    if (btnFull) btnFull.href = `register-event.html?id=${currentEventId}`;
});

// ── LOAD CHI TIẾT SỰ KIỆN ─────────────────────────────────────────
async function loadEventDetail(eventId) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/SuKien/${eventId}`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const event = await res.json();
        currentEvent = event;
        renderEventDetail(event);
    } catch (e) {
        console.error("Lỗi load chi tiết sự kiện:", e);
    }
}

function renderEventDetail(ev) {
    if (!ev) return;

    // BE trả PascalCase — hỗ trợ cả hai
    const get = (pascal, camel) => ev[pascal] ?? ev[camel];

    const title = get("TenSuKien","tenSuKien") || "Chi tiết sự kiện";
    document.title = `${title} - UTE Events`;
    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl) pageTitleEl.textContent = `${title} - UTE Events`;

    setText("eventTitle",       title);
    setText("eventDescription", get("MoTa","moTa") || "");

    const batDau  = get("ThoiGianBatDau","thoiGianBatDau");
    const ketThuc = get("ThoiGianKetThuc","thoiGianKetThuc");
    if (batDau) {
        const s = new Date(batDau);
        const e = ketThuc ? new Date(ketThuc) : null;
        setText("eventDate", s.toLocaleDateString("vi-VN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }));
        setText("eventTime", e ? `${fmt(s)} - ${fmt(e)}` : fmt(s));
    }

    const diaDiem = get("TenDiaDiem","tenDiaDiem")
        || ev.DiaDiem?.TenDiaDiem || ev.diaDiem?.tenDiaDiem || "Đang cập nhật";
    setText("eventLocation", diaDiem);

    const trangThai = get("TrangThai","trangThai") || "";
    setText("eventStatus", trangThai || "SẮP DIỄN RA");

    const soDaDK   = get("SoDaDangKy","soDaDangKy") ?? get("SoLuongDaDangKy","soLuongDaDangKy") ?? "-";
    const soToiDa  = get("SoLuongToiDa","soLuongToiDa") ?? "-";

    setText("registeredCount", `Đã có ${soDaDK} đăng ký`);
    setText("statRegistered",  soDaDK);
    setText("statCapacity",    soToiDa !== "-" ? `${soDaDK}/${soToiDa}` : "-");
    setText("statStatus",      trangThai || "-");

    if (soToiDa !== "-" && soDaDK !== "-") {
        const con = Number(soToiDa) - Number(soDaDK);
        // Kiểm tra thời gian để hiển thị đúng trạng thái
        const now = new Date();
        const batDauDate  = batDau  ? new Date(batDau)  : null;
        const ketThucDate = ketThuc ? new Date(ketThuc) : null;

        if (ketThucDate && now > ketThucDate) {
            setText("eventSlot", "ĐÃ KẾT THÚC");
        } else if (batDauDate && now >= batDauDate) {
            setText("eventSlot", "ĐANG DIỄN RA");
        } else if (con > 0) {
            setText("eventSlot", `CÒN ${con} CHỖ`);
        } else {
            setText("eventSlot", "HẾT CHỖ");
        }
    } else if (batDau) {
        // Không có giới hạn chỗ — vẫn kiểm tra thời gian
        const now = new Date();
        const batDauDate  = new Date(batDau);
        const ketThucDate = ketThuc ? new Date(ketThuc) : null;
        if (ketThucDate && now > ketThucDate) {
            setText("eventSlot", "ĐÃ KẾT THÚC");
        } else if (now >= batDauDate) {
            setText("eventSlot", "ĐANG DIỄN RA");
        }
    }
}

// ── KIỂM TRA ĐÃ ĐĂNG KÝ CHƯA ─────────────────────────────────────
async function checkRegistrationStatus(eventId) {
    const token = localStorage.getItem("token");
    if (!token || !currentIdNguoiDung) return;

    try {
        // GET /api/DangKy/nguoi-dung/{idNguoiDung}
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${currentIdNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.Data || data.data || []);

        // Response PascalCase: IdSuKien, TrangThai, IdDangKy
        const myReg = items.find(item => {
            const id = item.IdSuKien ?? item.idSuKien;
            const ts = item.TrangThai ?? item.trangThai ?? "";
            return String(id) === String(eventId) && ts !== "Đã hủy";
        });

        if (myReg) {
            currentDangKyId = myReg.IdDangKy ?? myReg.idDangKy;
            const ts = myReg.TrangThai ?? myReg.trangThai ?? "Đã xác nhận";
            showRegisteredState(ts, currentDangKyId);
        }
    } catch (e) {
        console.warn("Không kiểm tra được trạng thái đăng ký:", e.message);
    }
}

// ── HIỂN THỊ TRẠNG THÁI ĐÃ ĐĂNG KÝ ──────────────────────────────
function showRegisteredState(trangThai, idDangKy) {
    const form = document.getElementById("registerForm");
    if (form) form.style.display = "none";

    const statusBox  = document.getElementById("registrationStatus");
    const statusIcon = document.getElementById("statusIcon");
    const statusText = document.getElementById("statusText");
    const statusSub  = document.getElementById("statusSub");

    if (statusBox) {
        const cfgs = {
            "Đã xác nhận":  { bg:"#f0fff4", bd:"#9ae6b4", icon:"✅", text:"Đã đăng ký thành công",  sub:"Vui lòng check-in đúng giờ bằng mã QR" },
            "Chờ xác nhận": { bg:"#fffbeb", bd:"#fcd34d", icon:"⏳", text:"Đang chờ xác nhận",      sub:"Ban tổ chức sẽ xác nhận đăng ký của bạn" },
            "Đã tham gia":  { bg:"#eff6ff", bd:"#93c5fd", icon:"🎉", text:"Đã tham gia sự kiện",    sub:"Cảm ơn bạn đã tham gia!" },
            "Vắng mặt":     { bg:"#fff5f5", bd:"#feb2b2", icon:"😔", text:"Vắng mặt",               sub:"Bạn đã không tham gia sự kiện này" }
        };
        const c = cfgs[trangThai] || { bg:"#f0fff4", bd:"#9ae6b4", icon:"✅", text:`Trạng thái: ${trangThai}`, sub:"" };
        statusBox.style.cssText = `display:block;margin-bottom:16px;padding:14px;border-radius:10px;text-align:center;background:${c.bg};border:1px solid ${c.bd};`;
        if (statusIcon) statusIcon.textContent = c.icon;
        if (statusText) statusText.textContent = c.text;
        if (statusSub)  statusSub.textContent  = c.sub;
    }

    const actions = document.getElementById("registeredActions");
    if (actions) {
        actions.style.display = "block";
        const btnView = document.getElementById("btnViewTicket");
        if (btnView) btnView.href = `ticket-detail.html?id=${idDangKy}`;
        const btnCancel = document.getElementById("btnCancelReg");
        if (btnCancel) {
            const canCancel = ["Đã xác nhận","Chờ xác nhận"].includes(trangThai);
            btnCancel.style.display = canCancel ? "" : "none";
        }
    }
}

// ── ĐIỀN THÔNG TIN NGƯỜI DÙNG ─────────────────────────────────────
function prefillUserInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const u = JSON.parse(raw);
        setVal("regName",  u.HoTen   || u.hoTen   || "");
        setVal("regMSSV",  u.MaSoSSO || u.maSoSSO || "");
        setVal("regEmail", u.Email   || u.email   || "");
        ["regName", "regMSSV", "regEmail"].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.readOnly = true; el.title = "Thông tin từ tài khoản — không chỉnh sửa"; }
        });
    } catch (e) { /* bỏ qua */ }
}

// ── ĐĂNG KÝ SỰ KIỆN ──────────────────────────────────────────────
function initRegisterBtn(eventId) {
    const btn = document.getElementById("btnRegister");
    if (!btn) return;

    btn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "login.html"; return; }

        if (currentDangKyId) {
            window.location.href = TicketBiz.ticketDetailUrl(currentDangKyId);
            return;
        }

        if (currentEvent) {
            const chk = TicketBiz.eventEnded(
                currentEvent.ThoiGianBatDau || currentEvent.thoiGianBatDau,
                currentEvent.ThoiGianKetThuc || currentEvent.thoiGianKetThuc
            );
            if (chk.ended || chk.started) {
                showRegisterResult(chk.message, false);
                return;
            }
        }

        // Lấy lại idNguoiDung mỗi lần click (phòng trường hợp chưa load xong)
        currentIdNguoiDung = getIdNguoiDung();
        if (!currentIdNguoiDung) {
            showRegisterResult("Không xác định được tài khoản. Vui lòng đăng nhập lại.", false);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        hideRegisterResult();

        try {
            // POST /api/DangKy/dang-ky
            // Body: { IdSuKien: int, IdNguoiDung: string }
            const res = await fetch(`${API_BASE}/DangKy/dang-ky`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    IdSuKien:    parseInt(eventId),
                    IdNguoiDung: currentIdNguoiDung
                })
            });

            const data = await res.json();
            // BE trả: { Success, Message }
            const ok = data.Success ?? data.success;
            const msg = data.Message || data.message || "";

            if (res.ok && ok !== false) {
                currentDangKyId = data.IdDangKy || data.idDangKy || data.Data?.IdDangKy;
                showRegisterResult("🎉 " + (msg || "Đăng ký thành công!"), true);
                await checkRegistrationStatus(eventId);
                await loadEventDetail(eventId);
            } else {
                const dupId = data.IdDangKy || data.idDangKy;
                if (dupId) {
                    showToast("Bạn đã đăng ký sự kiện này. Đang chuyển đến vé...", "info");
                    setTimeout(() => { window.location.href = TicketBiz.ticketDetailUrl(dupId); }, 800);
                    return;
                }
                showRegisterResult(msg || "Đăng ký thất bại. Vui lòng thử lại.", false);
                btn.disabled = false;
                btn.innerHTML = "ĐĂNG KÝ NGAY";
            }
        } catch (e) {
            console.error("Lỗi đăng ký:", e);
            showRegisterResult("Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend đã chạy chưa.", false);
            btn.disabled = false;
            btn.innerHTML = "ĐĂNG KÝ NGAY";
        }
    });
}

// ── HỦY ĐĂNG KÝ ──────────────────────────────────────────────────
function initCancelBtn(eventId) {
    const btn = document.getElementById("btnCancelReg");
    if (!btn) return;

    btn.addEventListener("click", async function () {
        if (!confirm("Bạn có chắc chắn muốn hủy đăng ký sự kiện này không?")) return;

        const ketThuc = currentEvent?.ThoiGianKetThuc ?? currentEvent?.thoiGianKetThuc;
        if (!TicketBiz.canCancel({ trangThai: "Đã xác nhận", thoiGianCheckin: null, thoiGianKetThuc: ketThuc })) {
            showToast("Không thể hủy: đã check-in hoặc sự kiện đã kết thúc.", "error");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "login.html"; return; }

        currentIdNguoiDung = getIdNguoiDung();
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';

        try {
            // POST /api/DangKy/huy-dang-ky
            // Body: { IdSuKien: int, IdNguoiDung: string }
            const res = await fetch(`${API_BASE}/DangKy/huy-dang-ky`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    IdSuKien:    parseInt(eventId),
                    IdNguoiDung: currentIdNguoiDung
                })
            });

            const data = await res.json().catch(() => ({}));
            const ok  = data.Success ?? data.success;
            const msg = data.Message || data.message || "";

            if (res.ok && ok !== false) {
                showCancelSuccess();
                await loadEventDetail(eventId);
            } else {
                showToast(msg || "Hủy đăng ký thất bại.", "error");
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-times-circle"></i> HỦY ĐĂNG KÝ';
            }
        } catch (e) {
            console.error("Lỗi hủy:", e);
            showToast("Không thể kết nối đến máy chủ.", "error");
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-times-circle"></i> HỦY ĐĂNG KÝ';
        }
    });
}

function showCancelSuccess() {
    const actions = document.getElementById("registeredActions");
    if (actions) actions.style.display = "none";

    const statusBox = document.getElementById("registrationStatus");
    if (statusBox) {
        statusBox.style.cssText = "display:block;margin-bottom:16px;padding:14px;border-radius:10px;text-align:center;background:#fff5f5;border:1px solid #feb2b2;";
        const icon = document.getElementById("statusIcon");
        const text = document.getElementById("statusText");
        const sub  = document.getElementById("statusSub");
        if (icon) icon.textContent = "❌";
        if (text) text.textContent = "Đã hủy đăng ký";
        if (sub)  sub.textContent  = "Bạn có thể đăng ký lại nếu còn chỗ trống";
    }

    const form = document.getElementById("registerForm");
    if (form) {
        form.style.display = "block";
        const btn = document.getElementById("btnRegister");
        if (btn) { btn.disabled = false; btn.innerHTML = "ĐĂNG KÝ NGAY"; }
    }

    currentDangKyId = null;
    showToast("Đã hủy đăng ký thành công.", "success");
}

// ── GỬI CÂU HỎI ──────────────────────────────────────────────────
function initSubmitQuestion(eventId) {
    const btn = document.getElementById("btnSubmitQuestion");
    if (!btn) return;

    btn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "login.html"; return; }

        const textarea = document.getElementById("qaTextarea");
        const question = textarea ? textarea.value.trim() : "";
        if (!question) { showQAResult("Vui lòng nhập câu hỏi trước khi gửi.", false); return; }

        btn.disabled = true;
        btn.textContent = "Đang gửi...";

        try {
            const res = await fetch(`${API_BASE}/SuKien/${eventId}/CauHoi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ noiDung: question })
            });
            if (res.ok) {
                showQAResult("Câu hỏi đã được gửi thành công!", true);
                if (textarea) textarea.value = "";
            } else {
                const data = await res.json().catch(() => ({}));
                showQAResult(data.Message || data.message || "Gửi câu hỏi thất bại.", false);
            }
        } catch (e) {
            showQAResult("Không thể kết nối đến máy chủ.", false);
        } finally {
            btn.disabled = false;
            btn.textContent = "Gửi câu hỏi";
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", function (e) {
            const target = document.querySelector(this.getAttribute("href"));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
        });
    });
}

// ── HELPERS ───────────────────────────────────────────────────────
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setVal(id, val)   { const el = document.getElementById(id); if (el) el.value = val; }
function fmt(date)         { return date.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }); }

function showRegisterResult(msg, success) {
    const el = document.getElementById("registerResult");
    if (!el) return;
    el.style.display = "block";
    el.style.background = success ? "#f0fff4" : "#fff5f5";
    el.style.color      = success ? "#276749" : "#c53030";
    el.style.border     = `1px solid ${success ? "#9ae6b4" : "#feb2b2"}`;
    el.textContent = msg;
}
function hideRegisterResult() {
    const el = document.getElementById("registerResult");
    if (el) el.style.display = "none";
}
function showQAResult(msg, success) {
    const el = document.getElementById("qaResult");
    if (!el) return;
    el.style.display = "block";
    el.style.background = success ? "#f0fff4" : "#fff5f5";
    el.style.color      = success ? "#276749" : "#c53030";
    el.style.border     = `1px solid ${success ? "#9ae6b4" : "#feb2b2"}`;
    el.textContent = msg;
    setTimeout(() => { el.style.display = "none"; }, 4000);
}
function showToast(msg, type = "success") {
    const colors = { success:"#059669", error:"#dc2626", info:"#0D5A9C" };
    const toast = document.createElement("div");
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;
        padding:14px 20px;border-radius:10px;font-size:14px;font-weight:500;
        background:${colors[type]};color:white;box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:360px;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
function showError(msg) {
    const main = document.querySelector(".main-content .container");
    if (main) {
        main.innerHTML = `<div style="text-align:center;padding:60px;color:#666;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#e53e3e;margin-bottom:16px;display:block;"></i>
            <p>${msg}</p>
            <a href="events.html" style="color:#0D5A9C;text-decoration:none;font-weight:600;">← Quay lại danh sách sự kiện</a>
        </div>`;
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
    }
}
