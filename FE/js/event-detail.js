// js/event-detail.js
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

let currentEventId     = null;
let currentEvent       = null;
let currentDangKyId    = null;
let currentIdNguoiDung = null;

function getEventId() {
    return new URLSearchParams(window.location.search).get("id");
}

function getIdNguoiDung() {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    try {
        const u = JSON.parse(raw);
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
    initializeEventHandlers();

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
        showError("Không thể tải thông tin sự kiện. Vui lòng thử lại sau.");
    }
}

function renderEventDetail(ev) {
    if (!ev) return;

    const get = (pascal, camel) => ev[pascal] ?? ev[camel];

    const title = get("TenSuKien","tenSuKien") || "Chi tiết sự kiện";
    document.title = `${title} - UTE Events`;
    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl) pageTitleEl.textContent = `${title} - UTE Events`;

    // Cập nhật banner sự kiện
    const bannerEl = document.getElementById("eventBanner");
    if (bannerEl) {
        const imgSrc = ev.hinhAnh || ev.HinhAnh || getEventFallbackImage(ev);
        bannerEl.src = imgSrc;
        bannerEl.onerror = function () {
            this.src = getEventFallbackImage(ev);
        };
    }

    setText("eventTitle",       title);
    setText("eventDescription", get("MoTa","moTa") || "Không có mô tả");

    // Legacy querySelector fallback (HEAD HTML)
    const titleEl = document.querySelector('.event-detail-header h1');
    if (titleEl) titleEl.textContent = title;
    const descEl = document.querySelector('.event-description');
    if (descEl) descEl.textContent = get("MoTa","moTa") || "Không có mô tả";

    const batDau  = get("ThoiGianBatDau","thoiGianBatDau");
    const ketThuc = get("ThoiGianKetThuc","thoiGianKetThuc");
    if (batDau) {
        const s = new Date(batDau);
        const e = ketThuc ? new Date(ketThuc) : null;
        const dateStr = s.toLocaleDateString("vi-VN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
        const timeStr = e ? `${fmt(s)} - ${fmt(e)}` : fmt(s);
        setText("eventDate", dateStr);
        setText("eventTime", timeStr);
        // Legacy
        const dateEl = document.querySelector('.event-date');
        if (dateEl) dateEl.innerHTML = `<i class="far fa-calendar"></i> ${dateStr}`;
        const timeEl = document.querySelector('.event-time');
        if (timeEl) timeEl.innerHTML = `<i class="far fa-clock"></i> ${timeStr}`;
    }

    const diaDiem = get("TenDiaDiem","tenDiaDiem")
        || ev.DiaDiem?.TenDiaDiem || ev.diaDiem?.tenDiaDiem || "Đang cập nhật";
    setText("eventLocation", diaDiem);
    const locEl = document.querySelector('.event-location');
    if (locEl) locEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${diaDiem}`;

    const trangThai = get("TrangThai","trangThai") || "";
    setText("eventStatus", trangThai || "SẮP DIỄN RA");
    const statusBadge = document.querySelector('.event-status');
    if (statusBadge) {
        statusBadge.textContent = trangThai;
        statusBadge.className = 'event-status ' + getStatusClass(trangThai);
    }

    const tenNguoiTao = get("TenNguoiTao","tenNguoiTao") || "Ban tổ chức";
    const orgEl = document.querySelector('.event-organizer');
    if (orgEl) orgEl.innerHTML = `<i class="fas fa-user"></i> ${tenNguoiTao}`;

    const soDaDK  = get("SoDaDangKy","soDaDangKy") ?? get("SoLuongDaDangKy","soLuongDaDangKy") ?? 0;
    const soToiDa = get("SoLuongToiDa","soLuongToiDa") ?? null;

    setText("registeredCount", `Đã có ${soDaDK} đăng ký`);
    setText("statRegistered",  soDaDK);
    setText("statCapacity",    soToiDa != null ? `${soDaDK}/${soToiDa}` : "Không giới hạn");
    setText("statStatus",      trangThai || "-");

    // Legacy registration info
    const regEl = document.querySelector('.registered-count');
    if (regEl) regEl.textContent = soDaDK;
    const maxEl = document.querySelector('.max-count');
    if (maxEl) maxEl.textContent = soToiDa || "Không giới hạn";
    const availEl = document.querySelector('.available-count');
    if (availEl) availEl.textContent = soToiDa != null ? (soToiDa - soDaDK) : "Không giới hạn";
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar && soToiDa > 0) {
        progressBar.style.width = `${(soDaDK / soToiDa) * 100}%`;
    }

    // Slot status
    const now = new Date();
    const batDauDate  = batDau  ? new Date(batDau)  : null;
    const ketThucDate = ketThuc ? new Date(ketThuc) : null;
    if (ketThucDate && now > ketThucDate) {
        setText("eventSlot", "ĐÃ KẾT THÚC");
    } else if (batDauDate && now >= batDauDate) {
        setText("eventSlot", "ĐANG DIỄN RA");
    } else if (soToiDa != null) {
        const con = soToiDa - Number(soDaDK);
        setText("eventSlot", con > 0 ? `CÒN ${con} CHỖ` : "HẾT CHỖ");
    }
}

// ── KIỂM TRA ĐÃ ĐĂNG KÝ CHƯA ─────────────────────────────────────
async function checkRegistrationStatus(eventId) {
    const token = localStorage.getItem("token");
    if (!token || !currentIdNguoiDung) return;

    try {
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${currentIdNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.Data || data.data || []);

        const myReg = items.find(item => {
            const id = item.IdSuKien ?? item.idSuKien;
            const ts = item.TrangThai ?? item.trangThai ?? "";
            return String(id) === String(eventId) && ts !== "Đã hủy";
        });

        if (myReg) {
            currentDangKyId = myReg.IdDangKy ?? myReg.idDangKy;
            const ts = myReg.TrangThai ?? myReg.trangThai ?? "Đã xác nhận";
            showRegisteredState(ts, currentDangKyId);

            // Cập nhật nút đăng ký (legacy .btn-register)
            const registerBtn = document.querySelector('.btn-register');
            if (registerBtn) {
                registerBtn.textContent = 'Đã đăng ký';
                registerBtn.classList.add('registered');
                registerBtn.disabled = true;
            }
        } else {
            // Kiểm tra trạng thái sự kiện để disable nút đăng ký
            const registerBtn = document.querySelector('.btn-register');
            if (registerBtn && currentEvent) {
                const trangThai = currentEvent.TrangThai ?? currentEvent.trangThai;
                if (trangThai !== 'Đã duyệt' && trangThai !== 'Đang diễn ra') {
                    registerBtn.textContent = 'Chưa mở đăng ký';
                    registerBtn.disabled = true;
                }
            }
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
            btnCancel.style.display = ["Đã xác nhận","Chờ xác nhận"].includes(trangThai) ? "" : "none";
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
        ["regName","regMSSV","regEmail"].forEach(id => {
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
            window.location.href = `ticket-detail.html?id=${currentDangKyId}`;
            return;
        }

        currentIdNguoiDung = getIdNguoiDung();
        if (!currentIdNguoiDung) {
            showRegisterResult("Không xác định được tài khoản. Vui lòng đăng nhập lại.", false);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        hideRegisterResult();

        try {
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
            const ok  = data.Success ?? data.success;
            const msg = data.Message || data.message || "";

            if (res.ok && ok !== false) {
                currentDangKyId = data.IdDangKy || data.idDangKy || data.Data?.IdDangKy;
                showRegisterResult("🎉 " + (msg || "Đăng ký thành công!"), true);
                // QR modal
                if (currentDangKyId) showSuccessModal(currentDangKyId);
                await checkRegistrationStatus(eventId);
                await loadEventDetail(eventId);
            } else {
                const dupId = data.IdDangKy || data.idDangKy;
                if (dupId) {
                    showToast("Bạn đã đăng ký sự kiện này. Đang chuyển đến vé...", "info");
                    setTimeout(() => { window.location.href = `ticket-detail.html?id=${dupId}`; }, 800);
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

        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "login.html"; return; }

        currentIdNguoiDung = getIdNguoiDung();
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';

        try {
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

// ── EVENT HANDLERS (từ HEAD) ──────────────────────────────────────
function initializeEventHandlers() {
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) shareBtn.addEventListener('click', shareEvent);

    const backBtn = document.querySelector('.btn-back');
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());
}

// ── SHARE (từ HEAD) ───────────────────────────────────────────────
function shareEvent() {
    if (navigator.share && currentEvent) {
        const title = currentEvent.TenSuKien || currentEvent.tenSuKien || "";
        const text  = currentEvent.MoTa      || currentEvent.moTa      || "";
        navigator.share({ title, text, url: window.location.href })
            .catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("Đã sao chép link sự kiện!", "success");
    }
}

// ── QR MODAL (từ HEAD) ────────────────────────────────────────────
function showSuccessModal(idDangKy) {
    const userId  = currentIdNguoiDung || "user";
    const eventId = currentEventId || "event";
    const qrData  = `UTE-CHECKIN-S-${idDangKy || `${userId}-${eventId}`}`;
    const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.7);display:flex;justify-content:center;
        align-items:center;z-index:9999;`;
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:40px;max-width:500px;text-align:center;">
            <i class="fas fa-check-circle" style="font-size:64px;color:#10B981;margin-bottom:20px;display:block;"></i>
            <h2 style="color:#333;margin-bottom:10px;">Đăng ký thành công!</h2>
            <p style="color:#666;margin-bottom:24px;">Vui lòng lưu mã QR này để check-in tại sự kiện</p>
            <div style="background:#f9fafb;padding:20px;border-radius:12px;display:inline-block;margin-bottom:24px;">
                <img src="${qrUrl}" alt="QR Code" style="width:250px;height:250px;">
            </div>
            <br>
            <button onclick="goToMyTickets()" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
                color:white;border:none;padding:15px 40px;border-radius:10px;
                font-size:16px;font-weight:600;cursor:pointer;">
                Xem vé của tôi
            </button>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    setTimeout(goToMyTickets, 8000);
}

function goToMyTickets() {
    window.location.href = 'my-tickets.html';
}

// ── STATUS CLASS (từ HEAD) ────────────────────────────────────────
function getStatusClass(status) {
    const statusMap = {
        'Đã duyệt':      'approved',
        'Chờ duyệt':     'pending',
        'Từ chối':       'rejected',
        'Đang diễn ra':  'ongoing',
        'Kết thúc':      'ended'
    };
    return statusMap[status] || 'default';
}

// ── HELPERS ───────────────────────────────────────────────────────
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setVal(id, val)   { const el = document.getElementById(id); if (el) el.value = val; }
function fmt(date)         { return date.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }); }

function showRegisterResult(msg, success) {
    const el = document.getElementById("registerResult");
    if (!el) return;
    el.style.display    = "block";
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
    el.style.display    = "block";
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
    const main = document.querySelector(".main-content .container") ||
                 document.querySelector('.event-detail-container');
    if (main) {
        main.innerHTML = `<div style="text-align:center;padding:60px;color:#666;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#e53e3e;margin-bottom:16px;display:block;"></i>
            <p>${msg}</p>
            <a href="events.html" style="color:#0D5A9C;text-decoration:none;font-weight:600;">← Quay lại danh sách sự kiện</a>
        </div>`;
    }
}

window.goToMyTickets = goToMyTickets;
window.shareEvent    = shareEvent;