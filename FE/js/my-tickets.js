/**
 * my-tickets.js
 * Chức năng: Quản lý vé điện tử, QR Check-in/Check-out, Hủy đăng ký
 *
 * API endpoints:
 *   GET  /api/DangKySuKien/my                      — Lấy danh sách đăng ký của user
 *   PUT  /api/DangKySuKien/{idDangKy}/checkin       — Check-in (set thoiGianCheckin, trangThai='Đã tham gia')
 *   PUT  /api/DangKySuKien/{idDangKy}/checkout      — Check-out (set thoiGianCheckout)
 *   PUT  /api/DangKySuKien/{idDangKy}/huy           — Hủy đăng ký (set trangThai='Đã hủy')
 *
 * QR Code logic:
 *   - Mã QR: "UTE-CHECKIN-{idDangKy}-{timestamp}" (refresh 45s)
 *   - Tự động làm mới sau 45 giây (token ngắn hạn)
 *   - Dùng api.qrserver.com để generate ảnh QR (không cần thư viện)
 *
 * Trạng thái DangKySuKien (DB):
 *   'Chờ xác nhận' → 'Đã xác nhận' → 'Đã tham gia' (sau check-in) → 'Đã hủy'
 *   'Vắng mặt' (BTC set nếu không check-in)
 */

"use strict";

const API_BASE = "https://localhost:7160/api";

// ─── State toàn cục ───────────────────────────────────────────────────────────
let allTickets      = [];
let selectedTicket  = null;
let qrTimer         = null;
let qrSeconds       = 45;
let checkinTimer    = null;  // Timer cập nhật nút check-in theo thời gian thực

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    await loadMyTickets();

    // Nếu URL có dangKyId → auto-select vé đó (từ register-event.html redirect)
    const params    = new URLSearchParams(window.location.search);
    const dangKyId  = params.get("dangKyId");

    if (dangKyId) {
        window.location.replace(TicketBiz.ticketDetailUrl(dangKyId));
        return;
    }
});

/** Chọn vé mặc định: ưu tiên vé chưa hủy, chưa tham gia (cần check-in) */
function getDefaultTicket() {
    const get = (t, k1, k2) => t[k1] ?? t[k2];
    return (
        allTickets.find(t => get(t,"TrangThai","trangThai") === "Đã xác nhận") ||
        allTickets.find(t => get(t,"TrangThai","trangThai") === "Chờ xác nhận") ||
        allTickets.find(t => get(t,"TrangThai","trangThai") !== "Đã hủy") ||
        allTickets[0]
    );
}

// ─── LOAD TẤT CẢ VÉ ──────────────────────────────────────────────────────────
/**
 * BE endpoint: GET /api/DangKy/nguoi-dung/{idNguoiDung}
 * Response PascalCase: IdDangKy, IdSuKien, TenSuKien, TrangThai,
 *                      ThoiGianDangKy, ThoiGianCheckin, ThoiGianCheckout
 */
async function loadMyTickets() {
    const token = localStorage.getItem("token");
    showState("loading");

    // Lấy idNguoiDung từ userData (BE trả PascalCase)
    let idNguoiDung = null;
    try {
        const u = JSON.parse(localStorage.getItem("userData") || "{}");
        idNguoiDung = u.IdNguoiDung || u.idNguoiDung || u.id || null;
    } catch (e) { /* bỏ qua */ }

    if (!idNguoiDung) {
        showState("empty");
        showToast("Không xác định được tài khoản. Vui lòng đăng nhập lại.", "error");
        return;
    }

    try {
        // GET /api/DangKy/nguoi-dung/{idNguoiDung}
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) { window.location.href = "login.html"; return; }
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        // Response có thể là mảng trực tiếp hoặc { data: [...] }
        const raw  = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

        // Chuẩn hóa về camelCase để code phía dưới dùng thống nhất
        allTickets = raw.map(t => TicketBiz.normalizeTicket(t));

        if (allTickets.length === 0) {
            showState("empty");
            return;
        }

        showState("content");
        document.getElementById("ticketCount").textContent = allTickets.length;
        renderTicketsList();

    } catch (e) {
        console.error("Lỗi load vé:", e);
        showState("empty");
        showToast("Không thể tải danh sách vé. Vui lòng thử lại.", "error");
    }
}

/**
 * Chuẩn hóa response từ BE (PascalCase) về camelCase
 * để phần còn lại của code dùng nhất quán
 */
// ─── RENDER DANH SÁCH VÉ ─────────────────────────────────────────────────────
function renderTicketsList() {
    const list = document.getElementById("ticketsList");
    if (!list) return;
    list.innerHTML = "";

    // Sắp xếp: vé còn hiệu lực (chưa hủy/tham gia) lên trên
    const sorted = [...allTickets].sort((a, b) => {
        const order = { "Đã xác nhận": 0, "Chờ xác nhận": 1, "Đã tham gia": 2, "Vắng mặt": 3, "Đã hủy": 4 };
        return (order[a.trangThai] ?? 5) - (order[b.trangThai] ?? 5);
    });

    sorted.forEach(ticket => {
        const tenSuKien = ticket.tenSuKien || ticket.suKien?.tenSuKien || "Sự kiện";
        const ngay      = ticket.thoiGianBatDau || ticket.suKien?.thoiGianBatDau;
        const dateStr   = ngay ? new Date(ngay).toLocaleDateString("vi-VN") : "Chưa có";
        const diaDiem   = ticket.tenDiaDiem || ticket.suKien?.diaDiem?.tenDiaDiem || "";
        const trangThai = ticket.trangThai || "Chờ xác nhận";

        const item = document.createElement("div");
        item.className = "ticket-list-item";
        item.dataset.id = ticket.idDangKy;
        item.innerHTML = `
            <img src="https://via.placeholder.com/60x60/0D5A9C/FFFFFF?text=SK" alt="${escapeHtml(tenSuKien)}"
                 onerror="this.src='https://via.placeholder.com/60x60/0D5A9C/FFFFFF?text=SK'">
            <div class="ticket-item-info">
                <h4>${escapeHtml(tenSuKien)}</h4>
                <p>
                    <i class="fas fa-calendar" style="color:#0D5A9C;margin-right:4px;"></i>${dateStr}
                    ${diaDiem ? `<span style="margin-left:10px;">
                        <i class="fas fa-map-marker-alt" style="color:#0D5A9C;margin-right:4px;"></i>
                        ${escapeHtml(diaDiem)}
                    </span>` : ""}
                </p>
            </div>
            <span class="ticket-item-badge ${getBadgeClass(trangThai)}">${escapeHtml(trangThai)}</span>
        `;
        item.addEventListener("click", () => {
            // Navigate sang trang chi tiết vé riêng
            window.location.href = TicketBiz.ticketDetailUrl(ticket.idDangKy);
        });
        list.appendChild(item);
    });
}

// ─── CHỌN VÉ ĐỂ XEM CHI TIẾT ────────────────────────────────────────────────
/**
 * Điền toàn bộ panel bên phải:
 * 1. Status bar (màu theo trạng thái)
 * 2. Thông tin sự kiện (tên, ngày, địa điểm, người tham gia)
 * 3. QR Code (chỉ hiện khi trangThai phù hợp)
 * 4. Timeline check-in/out (3 bước: Đăng ký → Check-in → Check-out)
 * 5. Nút Check-in / Check-out (enable/disable theo điều kiện logic)
 * 6. Nút Hủy đăng ký (chỉ hiện khi có thể hủy)
 */
function selectTicket(ticket) {
    selectedTicket = ticket;

    // Highlight item trong danh sách
    document.querySelectorAll(".ticket-list-item").forEach(el => {
        el.classList.toggle("active", String(el.dataset.id) === String(ticket.idDangKy));
    });

    // Hiện panel chi tiết
    const detailPanel = document.getElementById("ticketDetail");
    if (detailPanel) detailPanel.style.display = "block";

    // ── Lấy dữ liệu ──────────────────────────────────────────────────────────
    const tenSuKien = ticket.tenSuKien || ticket.suKien?.tenSuKien || "Sự kiện";
    const ngayBD    = ticket.thoiGianBatDau  || ticket.suKien?.thoiGianBatDau;
    const ngayKT    = ticket.thoiGianKetThuc || ticket.suKien?.thoiGianKetThuc;
    const diaDiem   = ticket.tenDiaDiem      || ticket.suKien?.diaDiem?.tenDiaDiem || "Đang cập nhật";
    const trangThai = ticket.trangThai       || "Chờ xác nhận";

    // ── Điền thông tin vé ────────────────────────────────────────────────────
    setText("ticketEventName", tenSuKien);

    if (ngayBD) {
        const startDate = new Date(ngayBD);
        setText("ticketDate", startDate.toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        }));
        const endDate = ngayKT ? new Date(ngayKT) : null;
        setText("ticketTime",
            endDate
                ? `${formatTimeHM(startDate)} - ${formatTimeHM(endDate)}`
                : formatTimeHM(startDate)
        );
    } else {
        setText("ticketDate", "Chưa có thông tin");
        setText("ticketTime", "");
    }
    setText("ticketLocation", diaDiem);

    // Thông tin người tham gia từ localStorage
    try {
        const user = JSON.parse(localStorage.getItem("userData") || "{}");
        // Hỗ trợ cả PascalCase (BE trả) và camelCase
        const hoTen   = user.HoTen   || user.hoTen   || "Người dùng";
        const maSoSSO = user.MaSoSSO || user.maSoSSO || "";
        setText("ticketAttendee", `${hoTen}${maSoSSO ? " — " + maSoSSO : ""}`);
    } catch (e) {/* bỏ qua */}

    // ── Cập nhật các thành phần UI ───────────────────────────────────────────
    updateStatusBar(trangThai);
    renderQRSection(ticket);
    renderCheckinTimeline(ticket);
    renderCheckinButtons(ticket);
    renderCancelButton(ticket);

    // Bắt đầu (lại) đếm ngược QR
    if (shouldShowQR(trangThai)) {
        startQRCountdown(ticket);
    }

    // Timer cập nhật nút check-in mỗi 30 giây (để tự mở khi đến giờ)
    if (checkinTimer) clearInterval(checkinTimer);
    if (trangThai === "Đã xác nhận" && !ticket.thoiGianCheckin) {
        checkinTimer = setInterval(() => {
            if (selectedTicket) renderCheckinButtons(selectedTicket);
        }, 30000); // cập nhật mỗi 30 giây
    }
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    "Đã xác nhận":  { cls: "confirmed",  icon: "fa-check-circle",   label: "Đã xác nhận — Sẵn sàng check-in tại sự kiện" },
    "Chờ xác nhận": { cls: "pending",    icon: "fa-clock",           label: "Đang chờ ban tổ chức xác nhận đăng ký" },
    "Đã tham gia":  { cls: "attended",   icon: "fa-star",            label: "Đã tham gia sự kiện thành công" },
    "Vắng mặt":     { cls: "cancelled",  icon: "fa-user-times",      label: "Vắng mặt — Không có mặt tại sự kiện" },
    "Đã hủy":       { cls: "cancelled",  icon: "fa-ban",             label: "Đã hủy đăng ký" }
};

function updateStatusBar(trangThai) {
    const bar  = document.getElementById("ticketStatusBar");
    const text = document.getElementById("ticketStatusText");
    if (!bar || !text) return;

    const cfg = STATUS_CONFIG[trangThai] || {
        cls: "pending", icon: "fa-info-circle", label: trangThai
    };
    bar.className = `ticket-status-bar ${cfg.cls}`;
    bar.innerHTML = `<i class="fas ${cfg.icon}"></i><span>${cfg.label}</span>`;
}

// ─── QR CODE ─────────────────────────────────────────────────────────────────
/** Chỉ hiện QR khi trạng thái phù hợp để check-in */
function shouldShowQR(trangThai) {
    return TicketBiz.canShowQr(trangThai);
}

/**
 * Render QR section:
 *   - Ẩn nếu không nên hiện
 *   - Tạo URL QR từ api.qrserver.com với data = token duy nhất
 *   - Hiện mã vé dạng text (UTE-XXXXXX)
 *   - Hiện đếm ngược 45s
 */
function renderQRSection(ticket) {
    const section = document.getElementById("qrSection");
    if (!section) return;

    const trangThai = ticket.trangThai || "";

    if (!shouldShowQR(trangThai)) {
        section.style.display = "none";
        return;
    }
    section.style.display = "block";

    // Tạo QR data: encode thông tin vé + timestamp để mỗi lần refresh là khác nhau
    const qrData = buildQRData(ticket);
    const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?` +
        `size=200x200&` +
        `data=${encodeURIComponent(qrData)}&` +
        `bgcolor=ffffff&color=0D5A9C&margin=10`;

    const qrImg = document.getElementById("qrImage");
    if (qrImg) {
        qrImg.src = "";  // reset để trigger loading
        qrImg.style.opacity = "0.5";
        qrImg.src = qrUrl;
        qrImg.onload = () => { qrImg.style.opacity = "1"; };
        qrImg.onerror = () => {
            qrImg.style.opacity = "1";
            // Fallback: hiện placeholder
            qrImg.src = "https://via.placeholder.com/200x200/e2e8f0/555?text=QR+Error";
        };
    }

    // Hiện mã vé text
    const code = `UTE-${String(ticket.idDangKy).padStart(6, "0")}`;
    setText("qrTicketCode", code);
}

/** Tạo chuỗi dữ liệu nhúng vào QR */
function buildQRData(ticket) {
    return TicketBiz.buildQrPayload(ticket.idDangKy);
}

// ─── QR COUNTDOWN ─────────────────────────────────────────────────────────────
/**
 * Đếm ngược 45 giây rồi tự động refresh QR.
 * Đảm bảo không chạy nhiều timer cùng lúc khi user click nhiều vé.
 */
function startQRCountdown(ticket) {
    // Dừng timer cũ
    if (qrTimer) clearInterval(qrTimer);
    qrSeconds = TicketBiz.QR_REFRESH_SEC;
    setText("qrCountdown", qrSeconds);

    qrTimer = setInterval(() => {
        qrSeconds--;
        setText("qrCountdown", qrSeconds);

        if (qrSeconds <= 0) {
            // Auto-refresh QR
            renderQRSection(ticket);
            qrSeconds = TicketBiz.QR_REFRESH_SEC;
        }
    }, 1000);
}

/** Gọi khi user bấm nút "Làm mới QR" */
function refreshQR() {
    if (!selectedTicket) return;
    renderQRSection(selectedTicket);
    qrSeconds = TicketBiz.QR_REFRESH_SEC;
    setText("qrCountdown", qrSeconds);
    showToast("Đã làm mới mã QR.", "info");
}

// ─── TIMELINE CHECK-IN / CHECK-OUT ───────────────────────────────────────────
/**
 * Cập nhật visual timeline 3 bước:
 *   [Đăng ký ✓] → [Check-in ●/✓] → [Check-out ●/✓]
 *   - done:   border xanh lá, tick ✓
 *   - active: border xanh dương, đang chờ hành động
 *   - (none): border xám
 */
function renderCheckinTimeline(ticket) {
    const stepReg  = document.getElementById("stepRegister");
    const stepCI   = document.getElementById("stepCheckin");
    const stepCO   = document.getElementById("stepCheckout");

    const stepRegTime = document.getElementById("stepRegisterTime");
    const stepCITime  = document.getElementById("stepCheckinTime");
    const stepCOTime  = document.getElementById("stepCheckoutTime");

    // Reset
    [stepReg, stepCI, stepCO].forEach(el => { if (el) el.className = "checkin-step"; });

    // Bước 1: Đăng ký (luôn done khi có record)
    if (stepReg) stepReg.className = "checkin-step done";
    if (stepRegTime && ticket.thoiGianDangKy) {
        stepRegTime.textContent = formatDDMM(ticket.thoiGianDangKy);
    }

    // Bước 2: Check-in
    if (ticket.thoiGianCheckin) {
        if (stepCI) stepCI.className = "checkin-step done";
        if (stepCITime) stepCITime.textContent = formatDDMM(ticket.thoiGianCheckin);
    } else if (ticket.trangThai === "Đã xác nhận") {
        if (stepCI) stepCI.className = "checkin-step active";
    }

    // Bước 3: Check-out
    if (ticket.thoiGianCheckout) {
        if (stepCO) stepCO.className = "checkin-step done";
        if (stepCOTime) stepCOTime.textContent = formatDDMM(ticket.thoiGianCheckout);
    } else if (ticket.thoiGianCheckin && !ticket.thoiGianCheckout) {
        if (stepCO) stepCO.className = "checkin-step active";
    }
}

// ─── NÚT CHECK-IN / CHECK-OUT ────────────────────────────────────────────────
/**
 * Logic check-in đúng:
 *   - trangThai = "Đã xác nhận"
 *   - Chưa check-in
 *   - Thời gian hiện tại >= thoiGianBatDau - 30 phút (cho phép check-in sớm 30')
 *   - Thời gian hiện tại <= thoiGianKetThuc (sự kiện chưa kết thúc)
 *
 * Logic check-out:
 *   - Đã check-in
 *   - Chưa check-out
 *   - Thời gian hiện tại >= thoiGianBatDau (sự kiện đã bắt đầu)
 */
function renderCheckinButtons(ticket) {
    const btnCI = document.getElementById("btnCheckin");
    const btnCO = document.getElementById("btnCheckout");
    if (!btnCI || !btnCO) return;

    const trangThai  = ticket.trangThai || "";
    const checkedIn  = !!ticket.thoiGianCheckin;
    const checkedOut = !!ticket.thoiGianCheckout;
    const now        = new Date();

    // Phân tích thời gian sự kiện
    const batDau  = ticket.thoiGianBatDau  ? new Date(ticket.thoiGianBatDau)  : null;
    const ketThuc = ticket.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;

    // Cửa sổ check-in: từ 30 phút trước khi bắt đầu đến khi kết thúc
    const checkInOpen  = batDau  ? new Date(batDau.getTime() - 30 * 60 * 1000) : null;
    const checkInClose = ketThuc ? ketThuc : null;

    const inCheckInWindow = checkInOpen && checkInClose
        ? (now >= checkInOpen && now <= checkInClose)
        : checkInOpen
            ? now >= checkInOpen
            : true; // Không có thời gian → cho phép (fallback)

    const eventStarted = batDau ? now >= batDau : true;

    // ── Nút Check-in ─────────────────────────────────────────────────────────
    const canCheckin = trangThai === "Đã xác nhận" && !checkedIn && inCheckInWindow;
    btnCI.className  = `btn-checkin check-in${canCheckin ? "" : " disabled"}`;
    btnCI.disabled   = !canCheckin;

    if (checkedIn) {
        btnCI.innerHTML = '<i class="fas fa-check"></i> ĐÃ CHECK-IN';
    } else if (trangThai === "Chờ xác nhận") {
        btnCI.innerHTML = '<i class="fas fa-clock"></i> CHỜ BTC XÁC NHẬN';
    } else if (trangThai === "Đã hủy" || trangThai === "Vắng mặt") {
        btnCI.innerHTML = '<i class="fas fa-ban"></i> KHÔNG THỂ CHECK-IN';
    } else if (checkInOpen && now < checkInOpen) {
        // Tính thời gian còn lại đến khi mở check-in
        const minutesLeft = Math.ceil((checkInOpen - now) / 60000);
        const hoursLeft   = Math.floor(minutesLeft / 60);
        const minsLeft    = minutesLeft % 60;
        const timeStr     = hoursLeft > 0 ? `${hoursLeft}h${minsLeft}p` : `${minsLeft} phút`;
        btnCI.innerHTML   = `<i class="fas fa-hourglass-half"></i> MỞ SAU ${timeStr}`;
    } else if (checkInClose && now > checkInClose) {
        btnCI.innerHTML = '<i class="fas fa-times-circle"></i> ĐÃ HẾT GIỜ CHECK-IN';
    } else {
        btnCI.innerHTML = '<i class="fas fa-sign-in-alt"></i> CHECK-IN';
    }

    // ── Nút Check-out ────────────────────────────────────────────────────────
    const canCheckout = checkedIn && !checkedOut && eventStarted;
    btnCO.className   = `btn-checkin check-out${canCheckout ? "" : " disabled"}`;
    btnCO.disabled    = !canCheckout;

    if (checkedOut) {
        btnCO.innerHTML = '<i class="fas fa-check"></i> ĐÃ CHECK-OUT';
    } else if (!checkedIn) {
        btnCO.innerHTML = '<i class="fas fa-lock"></i> CHECK-OUT (cần check-in trước)';
    } else {
        btnCO.innerHTML = '<i class="fas fa-sign-out-alt"></i> CHECK-OUT';
    }

    // ── Hiện thông tin cửa sổ thời gian ─────────────────────────────────────
    const infoEl = document.getElementById("checkinTimeInfo");
    if (infoEl && batDau) {
        if (checkInOpen && now < checkInOpen) {
            infoEl.style.display = "block";
            infoEl.style.background = "#fffbeb";
            infoEl.style.color = "#92400e";
            infoEl.innerHTML = `<i class="fas fa-clock"></i> Check-in mở lúc <strong>${formatTimeHM(checkInOpen)}</strong> ngày <strong>${batDau.toLocaleDateString("vi-VN")}</strong>`;
        } else if (inCheckInWindow) {
            infoEl.style.display = "block";
            infoEl.style.background = "#f0fff4";
            infoEl.style.color = "#276749";
            infoEl.innerHTML = `<i class="fas fa-door-open"></i> Check-in đang mở — Sự kiện bắt đầu lúc <strong>${formatTimeHM(batDau)}</strong>`;
        } else if (checkInClose && now > checkInClose) {
            infoEl.style.display = "block";
            infoEl.style.background = "#fff5f5";
            infoEl.style.color = "#c53030";
            infoEl.innerHTML = `<i class="fas fa-door-closed"></i> Sự kiện đã kết thúc lúc <strong>${formatTimeHM(checkInClose)}</strong>`;
        } else {
            infoEl.style.display = "none";
        }
    }
}

/** Hiện / ẩn nút Hủy đăng ký */
function renderCancelButton(ticket) {
    const btn = document.getElementById("btnCancelTicket");
    if (!btn) return;
    btn.style.display = TicketBiz.canCancel(ticket) ? "flex" : "none";
}

// ─── THỰC HIỆN CHECK-IN ──────────────────────────────────────────────────────
/**
 * PUT /api/DangKySuKien/{idDangKy}/checkin
 * Body: (empty hoặc có thể gửi { idDangKy })
 * Response mong đợi: { success: true, thoiGianCheckin: "...", message: "..." }
 *
 * Sau khi thành công:
 * - Cập nhật selectedTicket.thoiGianCheckin = now
 * - Cập nhật selectedTicket.trangThai = 'Đã tham gia'
 * - Refresh toàn bộ UI: status bar, timeline, nút, badge list
 * - Ẩn QR (đã check-in xong)
 */
async function doCheckin() {
    if (!selectedTicket) return;
    if (selectedTicket.thoiGianCheckin) {
        showToast("Bạn đã check-in rồi.", "info");
        return;
    }

    const token = localStorage.getItem("token");
    const btn   = document.getElementById("btnCheckin");

    // UI: loading state
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang check-in...';
    }

    try {
        // POST /api/DangKy/check-in  body: { IdSuKien, IdNguoiDung }
        const res = await fetch(`${API_BASE}/DangKy/check-in`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    selectedTicket.idSuKien,
                IdNguoiDung: selectedTicket.idNguoiDung
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok   = data.Success ?? data.success;
        const msg  = data.Message || data.message || "";

        if (res.ok && ok !== false) {
            // ── Thành công ───────────────────────────────────────────────────
            const now = data.ThoiGianCheckin || data.thoiGianCheckin || new Date().toISOString();
            selectedTicket.thoiGianCheckin = now;
            selectedTicket.trangThai       = "Đã tham gia";

            // Cập nhật trong mảng allTickets
            syncTicketInArray(selectedTicket);

            // Cập nhật toàn bộ UI
            updateStatusBar("Đã tham gia");
            renderCheckinTimeline(selectedTicket);
            renderCheckinButtons(selectedTicket);
            renderCancelButton(selectedTicket);

            // Cập nhật badge trong danh sách
            updateListBadge(selectedTicket.idDangKy, "Đã tham gia");

            // Ẩn QR sau khi đã check-in (nếu muốn; tùy UX)
            // Giữ QR để check-out nếu cần
            // renderQRSection(selectedTicket);

            showToast("✅ Check-in thành công! Chào mừng bạn đến sự kiện.", "success");

        } else {
            // ── Lỗi server ───────────────────────────────────────────────────
            const msg = data.Message || data.message || "Check-in thất bại. Vui lòng thử lại.";
            showToast(msg, "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> CHECK-IN';
            }
        }

    } catch (e) {
        console.error("Lỗi check-in:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> CHECK-IN';
        }
    }
}

// ─── THỰC HIỆN CHECK-OUT ─────────────────────────────────────────────────────
/**
 * PUT /api/DangKySuKien/{idDangKy}/checkout
 * Chỉ gọi khi đã check-in và chưa check-out.
 * Sau khi thành công: ẩn QR (đã hoàn tất), cập nhật timeline.
 */
async function doCheckout() {
    if (!selectedTicket) return;

    // Guard: phải check-in trước
    if (!selectedTicket.thoiGianCheckin) {
        showToast("Bạn chưa check-in. Vui lòng check-in trước.", "error");
        return;
    }
    if (selectedTicket.thoiGianCheckout) {
        showToast("Bạn đã check-out rồi.", "info");
        return;
    }

    const token = localStorage.getItem("token");
    const btn   = document.getElementById("btnCheckout");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang check-out...';
    }

    try {
        // POST /api/DangKy/check-out  body: { IdSuKien, IdNguoiDung }
        const res = await fetch(`${API_BASE}/DangKy/check-out`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    selectedTicket.idSuKien,
                IdNguoiDung: selectedTicket.idNguoiDung
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok   = data.Success ?? data.success;

        if (res.ok && ok !== false) {
            // ── Thành công ───────────────────────────────────────────────────
            const now = data.ThoiGianCheckout || data.thoiGianCheckout || new Date().toISOString();
            selectedTicket.thoiGianCheckout = now;

            syncTicketInArray(selectedTicket);

            renderCheckinTimeline(selectedTicket);
            renderCheckinButtons(selectedTicket);

            // Ẩn QR sau khi hoàn tất check-out
            const qrSection = document.getElementById("qrSection");
            if (qrSection) qrSection.style.display = "none";

            // Dừng đếm ngược QR
            if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }

            showToast("👋 Check-out thành công! Cảm ơn bạn đã tham gia.", "success");

        } else {
            const msg = data.Message || data.message || "Check-out thất bại. Vui lòng thử lại.";
            showToast(msg, "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> CHECK-OUT';
            }
        }

    } catch (e) {
        console.error("Lỗi check-out:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> CHECK-OUT';
        }
    }
}

// ─── HỦY ĐĂNG KÝ ─────────────────────────────────────────────────────────────
/** Mở modal xác nhận hủy */
function openCancelModal() {
    const modal = document.getElementById("cancelModal");
    if (modal) modal.classList.add("active");
}

function closeCancelModal() {
    const modal = document.getElementById("cancelModal");
    if (modal) modal.classList.remove("active");
}

/**
 * Xác nhận hủy:
 * PUT /api/DangKySuKien/{idDangKy}/huy
 * Sau khi thành công:
 * - Cập nhật trangThai = 'Đã hủy'
 * - Ẩn QR, ẩn nút check-in/out, ẩn nút hủy
 * - Cập nhật badge trong danh sách
 */
async function confirmCancel() {
    if (!selectedTicket) return;
    closeCancelModal();

    const token = localStorage.getItem("token");
    const btn   = document.getElementById("btnCancelTicket");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';
    }

    try {
        // POST /api/DangKy/huy-dang-ky  body: { IdSuKien, IdNguoiDung }
        const res = await fetch(`${API_BASE}/DangKy/huy-dang-ky`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    selectedTicket.idSuKien,
                IdNguoiDung: selectedTicket.idNguoiDung
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok   = data.Success ?? data.success;

        if (res.ok && ok !== false) {
            // ── Thành công ───────────────────────────────────────────────────
            selectedTicket.trangThai   = "Đã hủy";
            selectedTicket.thoiGianHuy = new Date().toISOString();

            syncTicketInArray(selectedTicket);

            // Cập nhật UI
            updateStatusBar("Đã hủy");
            renderCheckinButtons(selectedTicket);
            renderCancelButton(selectedTicket);

            // Ẩn QR
            const qrSection = document.getElementById("qrSection");
            if (qrSection) qrSection.style.display = "none";

            // Dừng đếm ngược
            if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }

            // Cập nhật badge
            updateListBadge(selectedTicket.idDangKy, "Đã hủy");

            // Cập nhật timeline
            renderCheckinTimeline(selectedTicket);

            showToast("Đã hủy đăng ký thành công.", "success");

        } else {
            const msg = data.message || "Hủy đăng ký thất bại.";
            showToast(msg, "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
            }
        }

    } catch (e) {
        console.error("Lỗi hủy:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
        }
    }
}

// ─── HELPERS: State display ───────────────────────────────────────────────────

/** Điều khiển hiển thị: loading | empty | content */
function showState(state) {
    const loading = document.getElementById("loadingState");
    const empty   = document.getElementById("emptyState");
    const content = document.getElementById("ticketsLayout");

    if (loading) loading.style.display = state === "loading" ? "block" : "none";
    if (empty)   empty.style.display   = state === "empty"   ? "block" : "none";
    if (content) content.style.display = state === "content" ? "grid"  : "none";
}

/** Cập nhật badge trong danh sách vé trái */
function updateListBadge(idDangKy, trangThai) {
    const item  = document.querySelector(`.ticket-list-item[data-id="${idDangKy}"]`);
    const badge = item?.querySelector(".ticket-item-badge");
    if (!badge) return;
    badge.className  = `ticket-item-badge ${getBadgeClass(trangThai)}`;
    badge.textContent = escapeHtml(trangThai);
}

/** Đồng bộ selectedTicket về mảng allTickets */
function syncTicketInArray(ticket) {
    const idx = allTickets.findIndex(t => t.idDangKy === ticket.idDangKy);
    if (idx !== -1) allTickets[idx] = { ...ticket };
}

// ─── HELPERS: Format & style ──────────────────────────────────────────────────

function getBadgeClass(trangThai) {
    const map = {
        "Đã xác nhận":  "badge-confirmed",
        "Chờ xác nhận": "badge-pending",
        "Đã tham gia":  "badge-attended",
        "Vắng mặt":     "badge-absent",
        "Đã hủy":       "badge-cancelled"
    };
    return map[trangThai] || "badge-pending";
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatTimeHM(date) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDDMM(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}

function showToast(msg, type = "success") {
    const colors = { success: "#059669", error: "#dc2626", info: "#0D5A9C" };
    const icons  = { success: "check-circle", error: "times-circle", info: "info-circle" };

    const toast = document.createElement("div");
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:99999;
        padding:14px 20px; border-radius:10px; font-size:14px; font-weight:500;
        background:${colors[type]}; color:white;
        box-shadow:0 4px 16px rgba(0,0,0,.25); max-width:380px;
        display:flex; align-items:center; gap:10px;
    `;
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity .3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}