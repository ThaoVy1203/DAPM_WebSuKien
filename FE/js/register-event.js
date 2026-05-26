/**
 * register-event.js
 * Chức năng: Đăng ký tham gia sự kiện (trang riêng đầy đủ)
 * Flow: events.html → event-detail.html → register-event.html?id=X → my-tickets.html
 *
 * API endpoints sử dụng:
 *   GET  /api/SuKien/{id}               — Lấy thông tin sự kiện
 *   GET  /api/DangKySuKien/my           — Kiểm tra đã đăng ký chưa
 *   POST /api/DangKySuKien              — Đăng ký mới
 *   PUT  /api/DangKySuKien/{id}/huy     — Hủy đăng ký
 *
 * DB schema DangKySuKien:
 *   idDangKy, idSuKien, idNguoiDung, trangThai ('Chờ xác nhận'|'Đã xác nhận'|'Đã tham gia'|'Vắng mặt'|'Đã hủy'),
 *   thoiGianDangKy, thoiGianHuy, thoiGianCheckin, thoiGianCheckout
 */

"use strict";

const API_BASE = "https://localhost:7160/api";

// ─── State ────────────────────────────────────────────────────────────────────
let currentEventId   = null;   // id sự kiện từ query string
let currentEvent     = null;   // object sự kiện từ API
let existingRegId    = null;   // idDangKy nếu người dùng đã đăng ký
let isSubmitting     = false;  // tránh double-submit

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {

    // 1. Xác thực đăng nhập
    const token = localStorage.getItem("token");
    if (!token) {
        sessionStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.href = "login.html";
        return;
    }

    // 2. Lấy event id từ URL
    currentEventId = new URLSearchParams(window.location.search).get("id");
    if (!currentEventId) {
        showPageError("Không tìm thấy sự kiện. Vui lòng quay lại danh sách sự kiện.");
        return;
    }

    // 3. Cập nhật breadcrumb link trả về event-detail
    const bcEl = document.getElementById("breadcrumbEvent");
    if (bcEl) bcEl.href = `event-detail.html?id=${currentEventId}`;

    // 4. Load song song: thông tin sự kiện + kiểm tra đăng ký cũ
    showSkeleton(true);
    await Promise.all([
        loadEventInfo(currentEventId),
        checkAlreadyRegistered(currentEventId)
    ]);
    showSkeleton(false);

    // 5. Điền thông tin người dùng vào form (readonly)
    prefillUserInfo();

    // 6. Gắn sự kiện submit cho form
    initForm();
});

// ─── SKELETON LOADING ─────────────────────────────────────────────────────────
function showSkeleton(show) {
    const card = document.getElementById("eventInfoCard");
    if (!card) return;
    if (show) {
        card.innerHTML = `
            <div class="event-icon" style="background:#e2e8f0;"></div>
            <div style="flex:1;">
                <div style="height:20px;background:#e2e8f0;border-radius:6px;width:60%;margin-bottom:12px;"></div>
                <div style="height:14px;background:#e2e8f0;border-radius:4px;width:80%;margin-bottom:8px;"></div>
                <div style="height:14px;background:#e2e8f0;border-radius:4px;width:50%;"></div>
            </div>`;
    }
}

// ─── LOAD THÔNG TIN SỰ KIỆN ───────────────────────────────────────────────────
async function loadEventInfo(eventId) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/SuKien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        currentEvent = await res.json();
        renderEventInfo(currentEvent);

    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
        const card = document.getElementById("eventInfoCard");
        if (card) card.innerHTML = `
            <div style="color:#e53e3e;padding:12px;display:flex;align-items:center;gap:10px;">
                <i class="fas fa-exclamation-circle" style="font-size:20px;"></i>
                Không thể tải thông tin sự kiện. Vui lòng thử lại sau.
            </div>`;
    }
}

function renderEventInfo(event) {
    if (!event) return;

    const tenSuKien  = event.tenSuKien  || "Sự kiện";
    const trangThai  = event.trangThai  || "";
    const diaDiem    = event.tenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";
    const soToiDa    = event.soLuongToiDa ?? null;
    const soDaDK     = event.soDaDangKy ?? event.soLuongDaDangKy ?? 0;
    const conLai     = soToiDa !== null ? soToiDa - soDaDK : null;

    // Cập nhật title trang và breadcrumb
    document.title = `Đăng ký: ${tenSuKien} - UTE Events`;
    const bc = document.getElementById("breadcrumbEvent");
    if (bc) bc.textContent = tenSuKien;

    // Cập nhật tên sự kiện
    const nameEl = document.getElementById("eventName");
    if (nameEl) nameEl.textContent = tenSuKien;

    // Tạo chuỗi ngày giờ
    let dateStr = "Chưa có", timeStr = "";
    if (event.thoiGianBatDau) {
        const start = new Date(event.thoiGianBatDau);
        const end   = event.thoiGianKetThuc ? new Date(event.thoiGianKetThuc) : null;
        dateStr = start.toLocaleDateString("vi-VN", {
            weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
        });
        timeStr = start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        if (end) timeStr += ` - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Màu badge trạng thái
    const badgeClass = trangThai === "Đã duyệt" ? "badge-approved" : "badge-pending";

    // Render meta info card
    const metaEl = document.getElementById("eventMeta");
    if (metaEl) {
        metaEl.innerHTML = `
            <span><i class="fas fa-calendar"></i> ${dateStr}</span>
            ${timeStr   ? `<span><i class="fas fa-clock"></i> ${timeStr}</span>` : ""}
            <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
            ${soToiDa   ? `<span><i class="fas fa-users"></i> ${soDaDK}/${soToiDa} người đã đăng ký</span>` : ""}
            ${conLai !== null ? `<span><i class="fas fa-ticket-alt"></i>
                <strong style="color:${conLai > 0 ? '#059669' : '#e53e3e'}">
                    ${conLai > 0 ? `Còn ${conLai} chỗ trống` : "Đã hết chỗ"}
                </strong></span>` : ""}
            <br>
            <span class="event-status-badge ${badgeClass}">${escapeHtml(trangThai || "Đang cập nhật")}</span>
        `;
    }

    // ── Kiểm tra điều kiện cho phép đăng ký ──────────────────────────────────
    // a. Sự kiện chưa được duyệt
    const notApproved = trangThai && !["Đã duyệt", "Đang diễn ra"].includes(trangThai);
    if (notApproved) {
        showFormError(`Sự kiện đang ở trạng thái "<strong>${escapeHtml(trangThai)}</strong>". Chưa mở đăng ký.`);
        disableForm();
        return;
    }

    // b. Hết chỗ
    if (conLai !== null && conLai <= 0) {
        showFormError("Sự kiện đã <strong>hết chỗ đăng ký</strong>. Bạn không thể đăng ký lúc này.");
        disableForm();
        return;
    }

    // c. Sự kiện đã kết thúc
    if (event.thoiGianKetThuc && new Date(event.thoiGianKetThuc) < new Date()) {
        showFormError("Sự kiện này đã <strong>kết thúc</strong>. Không thể đăng ký.");
        disableForm();
        return;
    }
}

// ─── KIỂM TRA ĐÃ ĐĂNG KÝ CHƯA ────────────────────────────────────────────────
/**
 * Gọi GET /api/DangKySuKien/my để lấy danh sách đăng ký của user hiện tại.
 * Nếu tìm thấy đăng ký (chưa hủy) cho sự kiện này → thay form bằng panel "đã đăng ký".
 */
async function checkAlreadyRegistered(eventId) {
    const token = localStorage.getItem("token");
    try {
        // Lấy idNguoiDung từ userData (BE trả PascalCase)
        const raw = localStorage.getItem("userData");
        if (!raw) return;
        const user = JSON.parse(raw);
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;
        if (!idNguoiDung) return;

        // GET /api/DangKy/nguoi-dung/{idNguoiDung}
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data  = await res.json();
        const items = Array.isArray(data) ? data : (data.Data || data.data || []);

        // Response PascalCase: IdSuKien, TrangThai, IdDangKy
        const myReg = items.find(item => {
            const id = item.IdSuKien ?? item.idSuKien;
            const ts = item.TrangThai ?? item.trangThai ?? "";
            return String(id) === String(eventId) && ts !== "Đã hủy";
        });

        if (myReg) {
            // Chuẩn hóa về camelCase
            existingRegId = myReg.IdDangKy ?? myReg.idDangKy;
            const normalized = {
                idDangKy:       myReg.IdDangKy       ?? myReg.idDangKy,
                idSuKien:       myReg.IdSuKien        ?? myReg.idSuKien,
                idNguoiDung:    myReg.IdNguoiDung     ?? myReg.idNguoiDung,
                trangThai:      myReg.TrangThai       ?? myReg.trangThai       ?? "Đã xác nhận",
                thoiGianDangKy: myReg.ThoiGianDangKy  ?? myReg.thoiGianDangKy
            };
            showAlreadyRegisteredPanel(normalized);
        }

    } catch (e) {
        console.warn("Không kiểm tra được trạng thái đăng ký:", e.message);
    }
}

/**
 * Thay nội dung formCard bằng panel thông tin "đã đăng ký".
 * Cung cấp nút: Xem vé & QR, Hủy đăng ký, Xem sự kiện khác.
 */
function showAlreadyRegisteredPanel(reg) {
    const formCard = document.getElementById("formCard");
    if (!formCard) return;

    const trangThai  = reg.trangThai || "Đã xác nhận";
    const idDangKy   = reg.idDangKy;
    const maDangKy   = `#${String(idDangKy).padStart(6, "0")}`;

    // Cấu hình theo trạng thái
    const stateMap = {
        "Đã xác nhận":  { emoji: "✅", color: "#276749", bg: "#f0fff4", border: "#9ae6b4",
                          title: "Bạn đã đăng ký thành công!", sub: "Sử dụng QR trong \"Vé của tôi\" để check-in tại cổng sự kiện." },
        "Chờ xác nhận": { emoji: "⏳", color: "#92400e", bg: "#fffbeb", border: "#fcd34d",
                          title: "Đăng ký đang chờ xác nhận", sub: "Ban tổ chức sẽ xác nhận trong thời gian sớm nhất." },
        "Đã tham gia":  { emoji: "🎉", color: "#1e40af", bg: "#eff6ff", border: "#93c5fd",
                          title: "Bạn đã tham gia sự kiện này!", sub: "Cảm ơn bạn đã đóng góp cho hoạt động cộng đồng." },
        "Vắng mặt":     { emoji: "😔", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd",
                          title: "Bạn đã vắng mặt tại sự kiện", sub: "Nếu có lý do chính đáng, vui lòng liên hệ ban tổ chức." }
    };
    const cfg = stateMap[trangThai] || stateMap["Đã xác nhận"];

    // Ẩn nút hủy nếu đã tham gia / vắng mặt
    const showCancel = ["Đã xác nhận", "Chờ xác nhận"].includes(trangThai);

    formCard.innerHTML = `
        <div style="text-align:center; padding:48px 24px;">

            <!-- Icon & tiêu đề -->
            <div style="font-size:60px; margin-bottom:16px; line-height:1;">${cfg.emoji}</div>
            <h3 style="font-size:22px; font-weight:800; margin-bottom:8px; color:${cfg.color};">
                ${cfg.title}
            </h3>
            <p style="color:#666; margin-bottom:6px; font-size:14px;">${cfg.sub}</p>

            <!-- Thông tin đăng ký -->
            <div style="
                display:inline-flex; align-items:center; gap:16px;
                background:${cfg.bg}; border:1px solid ${cfg.border};
                border-radius:12px; padding:16px 28px; margin:20px 0 28px;
                flex-wrap:wrap; justify-content:center;
            ">
                <div style="text-align:left;">
                    <div style="font-size:11px; font-weight:700; color:#888; margin-bottom:2px;">MÃ ĐĂNG KÝ</div>
                    <code style="font-size:16px; font-weight:800; color:${cfg.color}; letter-spacing:2px;">${maDangKy}</code>
                </div>
                <div style="width:1px; height:36px; background:${cfg.border};"></div>
                <div style="text-align:left;">
                    <div style="font-size:11px; font-weight:700; color:#888; margin-bottom:2px;">TRẠNG THÁI</div>
                    <div style="font-size:14px; font-weight:700; color:${cfg.color};">${escapeHtml(trangThai)}</div>
                </div>
                ${reg.thoiGianDangKy ? `
                <div style="width:1px; height:36px; background:${cfg.border};"></div>
                <div style="text-align:left;">
                    <div style="font-size:11px; font-weight:700; color:#888; margin-bottom:2px;">NGÀY ĐĂNG KÝ</div>
                    <div style="font-size:14px; font-weight:600; color:#333;">
                        ${new Date(reg.thoiGianDangKy).toLocaleDateString("vi-VN")}
                    </div>
                </div>` : ""}
            </div>

            <!-- Nút hành động -->
            <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">

                <!-- Xem vé & QR (quan trọng nhất) -->
                <a href="my-tickets.html?dangKyId=${idDangKy}"
                   style="
                       padding:12px 24px; background:linear-gradient(135deg,#0D5A9C,#1976D2);
                       color:white; border-radius:10px; text-decoration:none;
                       font-weight:700; font-size:14px;
                       display:inline-flex; align-items:center; gap:8px;
                       box-shadow:0 4px 12px rgba(13,90,156,0.3);
                   ">
                    <i class="fas fa-qrcode"></i> Xem vé & QR Check-in
                </a>

                <!-- Hủy đăng ký (chỉ hiện khi còn có thể hủy) -->
                ${showCancel ? `
                <button onclick="cancelExistingRegistration(${idDangKy}, ${reg.idSuKien})"
                    style="
                        padding:12px 24px; border:1.5px solid #ef4444;
                        background:white; color:#ef4444; border-radius:10px;
                        cursor:pointer; font-weight:700; font-size:14px;
                        display:inline-flex; align-items:center; gap:8px;
                    ">
                    <i class="fas fa-times-circle"></i> Hủy đăng ký
                </button>` : ""}

                <!-- Xem sự kiện khác -->
                <a href="events.html"
                   style="
                       padding:12px 24px; border:1.5px solid #e2e8f0;
                       background:white; color:#555; border-radius:10px;
                       text-decoration:none; font-weight:600; font-size:14px;
                       display:inline-flex; align-items:center; gap:8px;
                   ">
                    <i class="fas fa-calendar-alt"></i> Xem sự kiện khác
                </a>
            </div>
        </div>
    `;
}

// ─── ĐIỀN THÔNG TIN NGƯỜI DÙNG VÀO FORM ──────────────────────────────────────
/**
 * Lấy thông tin từ localStorage (userData được lưu lúc login).
 * Trường MSSV là readonly vì lấy từ tài khoản SSO.
 */
function prefillUserInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        // BE trả PascalCase: HoTen, MaSoSSO, Email, SDT
        setVal("regName",  user.HoTen   || user.hoTen   || "");
        setVal("regMSSV",  user.MaSoSSO || user.maSoSSO || "");
        setVal("regEmail", user.Email   || user.email   || "");
        setVal("regPhone", user.SDT     || user.sdt     || "");
    } catch (e) {
        console.warn("Lỗi prefill userData:", e);
    }
}

// ─── KHỞI TẠO FORM SUBMIT ─────────────────────────────────────────────────────
function initForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (isSubmitting) return;  // Ngăn double-submit
        await submitRegistration();
    });

    // Real-time validate email
    const emailInput = document.getElementById("regEmail");
    if (emailInput) {
        emailInput.addEventListener("blur", function () {
            if (this.value && !isValidEmail(this.value)) {
                markFieldError(this, "Email không hợp lệ");
            } else {
                clearFieldError(this);
            }
        });
    }

    // Real-time validate name
    const nameInput = document.getElementById("regName");
    if (nameInput) {
        nameInput.addEventListener("blur", function () {
            if (!this.value.trim()) {
                markFieldError(this, "Vui lòng nhập họ và tên");
            } else {
                clearFieldError(this);
            }
        });
    }
}

// ─── GỬI ĐĂNG KÝ ─────────────────────────────────────────────────────────────
/**
 * Validate → gọi POST /api/DangKySuKien → hiện success state hoặc lỗi.
 *
 * Request body: { idSuKien: int, idNguoiDung: string, ghiChu: string }
 * Response: { success: bool, idDangKy: int, message: string }
 */
async function submitRegistration() {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    // ── 1. Validate client-side ───────────────────────────────────────────────
    const name  = document.getElementById("regName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const agree = document.getElementById("agreeTerms")?.checked;

    let hasError = false;
    if (!name) {
        markFieldError(document.getElementById("regName"), "Vui lòng nhập họ và tên");
        hasError = true;
    }
    if (!email || !isValidEmail(email)) {
        markFieldError(document.getElementById("regEmail"), "Vui lòng nhập email hợp lệ");
        hasError = true;
    }
    if (!agree) {
        showFormError('<i class="fas fa-exclamation-circle"></i> Vui lòng đồng ý với điều khoản tham gia.');
        hasError = true;
    }
    if (hasError) return;

    // ── 2. Lấy idNguoiDung ───────────────────────────────────────────────────
    const userData = localStorage.getItem("userData");
    if (!userData) {
        showFormError("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.");
        return;
    }
    const user = JSON.parse(userData);
    // BE trả PascalCase: IdNguoiDung
    const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;
    if (!idNguoiDung) {
        showFormError("Không xác định được tài khoản. Vui lòng đăng nhập lại.");
        return;
    }

    // ── 3. Gọi API ───────────────────────────────────────────────────────────
    isSubmitting = true;
    const btn = document.getElementById("btnSubmit");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }
    hideFormError();

    try {
        // POST /api/DangKy/dang-ky  body: { IdSuKien, IdNguoiDung }
        const res = await fetch(`${API_BASE}/DangKy/dang-ky`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    parseInt(currentEventId),
                IdNguoiDung: idNguoiDung
            })
        });

        const data = await res.json();
        // BE trả: { Success, Message } (PascalCase)
        const ok  = data.Success ?? data.success;
        const msg = data.Message || data.message || "";

        if (res.ok && ok !== false) {
            // ── Thành công ───────────────────────────────────────────────────
            const idDangKy = data.IdDangKy || data.idDangKy || data.Data?.IdDangKy;
            existingRegId  = idDangKy;
            showSuccessState(idDangKy);
        } else {
            // ── Lỗi từ server ────────────────────────────────────────────────
            if (msg.includes("hết") || msg.includes("full")) {
                showFormError('<i class="fas fa-users"></i> Sự kiện đã hết chỗ đăng ký.');
            } else if (msg.includes("đã đăng ký") || msg.includes("rồi")) {
                showFormError('<i class="fas fa-info-circle"></i> Bạn đã đăng ký sự kiện này rồi. Vui lòng làm mới trang.');
            } else if (msg.includes("chưa được phê duyệt") || msg.includes("không tồn tại")) {
                showFormError('<i class="fas fa-ban"></i> Sự kiện chưa được phê duyệt. Không thể đăng ký.');
            } else {
                showFormError(`<i class="fas fa-exclamation-circle"></i> ${escapeHtml(msg || "Đăng ký thất bại. Vui lòng thử lại.")}`);
            }

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Xác nhận đăng ký';
            }
        }

    } catch (e) {
        console.error("Lỗi kết nối:", e);
        showFormError(
            '<i class="fas fa-wifi"></i> Không thể kết nối đến máy chủ. ' +
            'Vui lòng kiểm tra kết nối mạng và thử lại.'
        );
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Xác nhận đăng ký';
        }
    } finally {
        isSubmitting = false;
    }
}

// ─── HIỂN THỊ TRẠNG THÁI THÀNH CÔNG ──────────────────────────────────────────
/**
 * Ẩn form, hiện success state với:
 *   - Mã đăng ký
 *   - Tên sự kiện
 *   - Hướng dẫn bước tiếp theo
 *   - Nút: Xem vé & QR | Xem sự kiện khác | Lịch sử tham gia
 */
function showSuccessState(idDangKy) {
    const form    = document.getElementById("registerForm");
    const success = document.getElementById("successState");

    if (form) form.style.display = "none";
    if (!success) return;

    success.style.display = "block";

    const tenSuKien = currentEvent?.tenSuKien || "sự kiện";
    const maDangKy  = `#${String(idDangKy || "------").padStart(6, "0")}`;

    // Cập nhật nội dung success msg
    const msgEl = document.getElementById("successMsg");
    if (msgEl) {
        msgEl.innerHTML = `
            Bạn đã đăng ký tham gia <strong>${escapeHtml(tenSuKien)}</strong> thành công!<br>
            <span style="font-size:13px;color:#666;">
                Mã đăng ký: <code style="background:#f0f4f8;padding:2px 8px;border-radius:4px;font-weight:700;">${maDangKy}</code>
            </span><br><br>
            <span style="font-size:13px;color:#555;">
                <i class="fas fa-info-circle" style="color:#0D5A9C;"></i>
                Vui lòng mở <strong>Vé của tôi</strong> → quét QR tại cổng sự kiện để <strong>Check-in</strong>.
            </span>
        `;
    }

    // Cập nhật nút action
    const actionsEl = success.querySelector(".success-actions");
    if (actionsEl) {
        actionsEl.innerHTML = `
            <a href="my-tickets.html${idDangKy ? `?dangKyId=${idDangKy}` : ''}" class="btn-primary-sm">
                <i class="fas fa-qrcode"></i> Xem vé & QR Check-in
            </a>
            <a href="events.html" class="btn-outline">
                <i class="fas fa-calendar-alt"></i> Xem sự kiện khác
            </a>
            <a href="history.html" class="btn-outline">
                <i class="fas fa-history"></i> Lịch sử tham gia
            </a>
        `;
    }

    // Scroll lên đầu để nhìn thấy success panel
    success.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── HỦY ĐĂNG KÝ (từ panel "đã đăng ký") ────────────────────────────────────
/**
 * Gọi PUT /api/DangKySuKien/{idDangKy}/huy
 * Khi thành công: reload trang để hiện lại form đăng ký.
 */
async function cancelExistingRegistration(idDangKy, idSuKien) {
    if (!confirm("Bạn có chắc chắn muốn hủy đăng ký sự kiện này không?\nHành động này không thể hoàn tác.")) return;

    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    // Tìm nút hủy để disabled trong lúc xử lý
    const cancelBtn = document.querySelector(`button[onclick*="cancelExistingRegistration"]`);
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';
    }

    try {
        // POST /api/DangKy/huy-dang-ky  body: { IdSuKien, IdNguoiDung }
        const raw = localStorage.getItem("userData");
        const user = raw ? JSON.parse(raw) : {};
        const idNguoiDung = user.IdNguoiDung || user.idNguoiDung || user.id;

        const res = await fetch(`${API_BASE}/DangKy/huy-dang-ky`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    idSuKien,
                IdNguoiDung: idNguoiDung
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok   = data.Success ?? data.success;
        const msg  = data.Message || data.message || "";

        if (res.ok && ok !== false) {
            showToast("Đã hủy đăng ký thành công.", "success");
            existingRegId = null;
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showToast(msg || "Hủy đăng ký thất bại. Vui lòng thử lại.", "error");
            if (cancelBtn) {
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
            }
        }

    } catch (e) {
        console.error("Lỗi hủy đăng ký:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Hủy đăng ký';
        }
    }
}

// ─── HELPER: UI STATE ─────────────────────────────────────────────────────────

/** Disable toàn bộ form khi sự kiện không cho đăng ký */
function disableForm() {
    const btn = document.getElementById("btnSubmit");
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor  = "not-allowed";
    }
    document.querySelectorAll("#registerForm input, #registerForm textarea, #registerForm select")
        .forEach(el => { el.disabled = true; });
    const agree = document.getElementById("agreeTerms");
    if (agree) agree.disabled = true;
}

function showFormError(htmlMsg) {
    const el = document.getElementById("registerResult");
    if (!el) return;
    el.style.display = "block";
    el.className = "result-error";
    el.innerHTML = htmlMsg;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideFormError() {
    const el = document.getElementById("registerResult");
    if (el) el.style.display = "none";
}

function showPageError(msg) {
    const main = document.querySelector(".main-content");
    if (main) main.innerHTML = `
        <div style="text-align:center;padding:80px 24px;color:#666;">
            <i class="fas fa-exclamation-circle" style="font-size:56px;color:#e53e3e;display:block;margin-bottom:20px;"></i>
            <h3 style="font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:10px;">${msg}</h3>
            <a href="events.html" style="color:#0D5A9C;text-decoration:none;font-weight:600;font-size:14px;">
                <i class="fas fa-arrow-left"></i> Quay lại danh sách sự kiện
            </a>
        </div>`;
}

/** Highlight field lỗi với message */
function markFieldError(el, msg) {
    if (!el) return;
    el.style.borderColor = "#ef4444";
    el.style.background  = "#fff5f5";
    // Tìm hoặc tạo thẻ error bên dưới
    let errEl = el.parentElement.querySelector(".field-error");
    if (!errEl) {
        errEl = document.createElement("div");
        errEl.className = "field-error";
        errEl.style.cssText = "font-size:12px;color:#e53e3e;margin-top:4px;";
        el.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
}

function clearFieldError(el) {
    if (!el) return;
    el.style.borderColor = "";
    el.style.background  = "";
    const errEl = el.parentElement?.querySelector(".field-error");
    if (errEl) errEl.remove();
}

// ─── HELPERS CHUNG ────────────────────────────────────────────────────────────

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const toast  = document.createElement("div");
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:99999;
        padding:14px 20px; border-radius:10px; font-size:14px; font-weight:500;
        background:${colors[type]}; color:white;
        box-shadow:0 4px 16px rgba(0,0,0,.25); max-width:380px;
        display:flex; align-items:center; gap:10px;
        animation: slideUp .3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity .3s";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}