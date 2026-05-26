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
        if (btnView) btnView.href = TicketBiz.ticketDetailUrl(idDangKy);
        const btnCancel = document.getElementById("btnCancelReg");
        if (btnCancel) {
            const ketThuc = currentEvent?.ThoiGianKetThuc ?? currentEvent?.thoiGianKetThuc;
            btnCancel.style.display = TicketBiz.canCancel({
                trangThai,
                thoiGianCheckin: null,
                thoiGianKetThuc: ketThuc
            }) ? "" : "none";
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
    }
}
