/**
 * my-tickets.js
 * Chức năng: Quản lý vé điện tử, QR Check-in/Check-out, Hủy đăng ký
 *
 * API endpoints:
 * GET  /api/DangKy/nguoi-dung/{idNguoiDung} — Lấy danh sách đăng ký của user
 * POST /api/DangKy/check-in                 — Check-in sự kiện
 * POST /api/DangKy/check-out                — Check-out sự kiện
 * POST /api/DangKy/huy-dang-ky              — Hủy đăng ký
 * POST /api/DangKy/xac-nhan-cho-nguoi       — Xác nhận Waitlist
 */

"use strict";

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

// ─── State toàn cục ───────────────────────────────────────────────────────────
let allTickets      = [];
let selectedTicket  = null;
let currentFilter   = "ongoing";  // ongoing | registered | cancelled
let qrTimer         = null;
let qrSeconds       = 45;
let checkinTimer    = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    await loadMyTickets();
    setupPageListeners();

    const params   = new URLSearchParams(window.location.search);
    const dangKyId = params.get("dangKyId") || params.get("id");

    if (allTickets.length > 0) {
        initTicketListUI();
        const target = dangKyId
            ? allTickets.find(t => String(t.idDangKy) === String(dangKyId))
            : null;
            
        if (target) {
            const tab = getTicketCategory(target);
            switchFilter(tab);
            selectTicket(target);
        } else {
            hideDetailPanel();
        }
    }
});

function setupPageListeners() {
    document.getElementById("btnCancelTicket")?.addEventListener("click", openCancelModal);
    document.getElementById("btnConfirmWaitlist")?.addEventListener("click", doConfirmWaitlist);
    document.getElementById("btnReRegister")?.addEventListener("click", doReRegister);
    document.getElementById("btnShareTicket")?.addEventListener("click", shareTicket);
    document.getElementById("btnAppleWallet")?.addEventListener("click", () => {
        showToast("Tính năng Apple Wallet đang phát triển.", "info");
    });
    document.getElementById("btnGoogleWallet")?.addEventListener("click", () => {
        showToast("Tính năng Google Pay đang phát triển.", "info");
    });
    document.querySelectorAll(".mt-tab").forEach(tab => {
        tab.addEventListener("click", () => switchFilter(tab.dataset.filter));
    });
}

// ─── PHÂN LOẠI VÉ ────────────────────────────────────────────────────────────
function isEventOngoing(ticket) {
    const now = new Date();
    const batDau = ticket.thoiGianBatDau ? new Date(ticket.thoiGianBatDau) : null;
    const ketThuc = ticket.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;
    if (!batDau) return false;
    if (ketThuc) return now >= batDau && now <= ketThuc;
    return now >= batDau;
}

function getTicketCategory(ticket) {
    if (ticket.trangThai === "Đã hủy") return "cancelled";
    if (isEventOngoing(ticket)) return "ongoing";
    if (["Chờ chỗ", "Chờ người dùng xác nhận", "Chờ xác nhận", "Đã xác nhận", "Đã tham gia", "Hoàn thành", "Vắng mặt"].includes(ticket.trangThai)) {
        return "registered";
    }
    return "registered";
}

function getTicketsByFilter(filter) {
    if (filter === "cancelled") {
        return allTickets.filter(t => t.trangThai === "Đã hủy");
    }
    if (filter === "ongoing") {
        return allTickets.filter(t => t.trangThai !== "Đã hủy" && isEventOngoing(t));
    }
    // Đã đăng ký: còn hiệu lực, chưa hủy, sự kiện chưa kết thúc hoặc sắp diễn ra
    const now = new Date();
    return allTickets.filter(t => {
        if (t.trangThai === "Đã hủy") return false;
        if (isEventOngoing(t)) return false; // hiển thị ở tab Đang diễn ra
        const ketThuc = t.thoiGianKetThuc ? new Date(t.thoiGianKetThuc) : null;
        const chuaKetThuc = !ketThuc || ketThuc >= now;
        return ["Chờ chỗ", "Chờ người dùng xác nhận", "Chờ xác nhận", "Đã xác nhận"].includes(t.trangThai) && chuaKetThuc;
    });
}

function updateFilterCounts() {
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    set("countOngoing", getTicketsByFilter("ongoing").length);
    set("countRegistered", getTicketsByFilter("registered").length);
    set("countCancelled", getTicketsByFilter("cancelled").length);
}

function switchFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll(".mt-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.filter === filter);
    });
    renderTicketFilterList();
    const list = getTicketsByFilter(filter);
    const stillInList = selectedTicket && list.some(t => t.idDangKy === selectedTicket.idDangKy);
    if (!stillInList) hideDetailPanel();
}

function initTicketListUI() {
    updateFilterCounts();
    renderTicketFilterList();
}

function renderTicketFilterList() {
    const el = document.getElementById("ticketsFilterList");
    if (!el) return;

    const list = getTicketsByFilter(currentFilter);
    const emptyMsgs = {
        ongoing: "Không có sự kiện đang diễn ra",
        registered: "Chưa có vé đăng ký sắp tới",
        cancelled: "Chưa có vé đã hủy"
    };

    if (!list.length) {
        el.innerHTML = `<div class="mt-list-empty"><i class="fas fa-inbox"></i>${emptyMsgs[currentFilter] || "Không có vé"}</div>`;
        return;
    }

    const sorted = [...list].sort((a, b) => {
        const da = a.thoiGianBatDau ? new Date(a.thoiGianBatDau) : 0;
        const db = b.thoiGianBatDau ? new Date(b.thoiGianBatDau) : 0;
        return currentFilter === "cancelled" ? db - da : da - db;
    });

    el.innerHTML = "";
    sorted.forEach((ticket, idx) => {
        const ngay = ticket.thoiGianBatDau ? new Date(ticket.thoiGianBatDau) : null;
        const meta = ngay
            ? ngay.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "—";
        const img = EVENT_IMAGES[(ticket.idSuKien || idx) % EVENT_IMAGES.length];
        const badge = getFilterBadge(ticket);

        const item = document.createElement("div");
        item.className = "mt-filter-item";
        item.dataset.id = ticket.idDangKy;
        if (selectedTicket && String(selectedTicket.idDangKy) === String(ticket.idDangKy)) {
            item.classList.add("active");
        }
        item.innerHTML = `
            <img class="mt-filter-thumb" src="${img}" alt=""
                 onerror="this.src='https://via.placeholder.com/48/0D5A9C/fff?text=SK'">
            <div class="mt-filter-info">
                <div class="mt-filter-title">${escapeHtml(ticket.tenSuKien || "Sự kiện")}</div>
                <div class="mt-filter-meta">${escapeHtml(meta)} · ${escapeHtml(ticket.tenDiaDiem || "")}</div>
            </div>
            <span class="mt-filter-badge ${badge.cls}">${escapeHtml(badge.text)}</span>
            <a href="ticket-detail.html?id=${ticket.idDangKy}" class="mt-filter-detail-link"
               onclick="event.stopPropagation()"
               title="Xem chi tiết vé">
               <i class="fas fa-external-link-alt"></i>
            </a>`;
        item.addEventListener("click", () => selectTicket(ticket));
        el.appendChild(item);
    });
}

function getFilterBadge(ticket) {
    if (isEventOngoing(ticket) && ticket.trangThai !== "Đã hủy") {
        return { cls: "ongoing", text: "LIVE" };
    }
    const map = {
        "Chờ chỗ": { cls: "pending", text: "Chờ chỗ" },
        "Chờ người dùng xác nhận": { cls: "pending", text: "Mời xác nhận (24h)" },
        "Đã xác nhận": { cls: "confirmed", text: "Đã xác nhận" },
        "Chờ xác nhận": { cls: "pending", text: "Chờ duyệt" },
        "Đã tham gia": { cls: "attended", text: "Đã tham gia" },
        "Hoàn thành": { cls: "attended", text: "Hoàn thành" },
        "Đã hủy": { cls: "cancelled", text: "Đã hủy" },
        "Vắng mặt": { cls: "cancelled", text: "Vắng mặt" }
    };
    return map[ticket.trangThai] || { cls: "pending", text: ticket.trangThai };
}

function showDetailPanel() {
    const ph = document.getElementById("ticketDetailPlaceholder");
    const ct = document.getElementById("ticketDetailContent");
    if (ph) ph.style.display = "none";
    if (ct) ct.style.display = "block";
}

function hideDetailPanel() {
    selectedTicket = null;
    if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }
    if (checkinTimer) { clearInterval(checkinTimer); checkinTimer = null; }
    const ph = document.getElementById("ticketDetailPlaceholder");
    const ct = document.getElementById("ticketDetailContent");
    if (ph) ph.style.display = "block";
    if (ct) ct.style.display = "none";
    document.querySelectorAll(".mt-filter-item").forEach(el => el.classList.remove("active"));
}

function getDefaultTicket() {
    return (
        allTickets.find(t => t.trangThai === "Đã xác nhận") ||
        allTickets.find(t => t.trangThai === "Chờ xác nhận") ||
        allTickets.find(t => t.trangThai !== "Đã hủy") ||
        allTickets[0]
    );
}

// ─── LOAD TẤT CẢ VÉ ──────────────────────────────────────────────────────────
async function loadMyTickets() {
    const token = localStorage.getItem("token");
    showState("loading");

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
        const res = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idNguoiDung}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) { window.location.href = "login.html"; return; }
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const raw  = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

        // Sử dụng logic chuẩn hóa fallback nếu chưa load được TicketBiz toàn cục
        allTickets = raw.map(t => typeof TicketBiz !== 'undefined' ? TicketBiz.normalizeTicket(t) : {
            idDangKy: t.IdDangKy ?? t.idDangKy,
            idSuKien: t.IdSuKien ?? t.idSuKien,
            tenSuKien: t.TenSuKien ?? t.tenSuKien,
            trangThai: t.TrangThai ?? t.trangThai,
            thoiGianBatDau: t.ThoiGianBatDau ?? t.thoiGianBatDau,
            thoiGianKetThuc: t.ThoiGianKetThuc ?? t.thoiGianKetThuc,
            tenDiaDiem: t.TenDiaDiem ?? t.tenDiaDiem,
            thoiGianDangKy: t.ThoiGianDangKy ?? t.thoiGianDangKy,
            thoiGianCheckin: t.ThoiGianCheckin ?? t.thoiGianCheckin,
            thoiGianCheckout: t.ThoiGianCheckout ?? t.thoiGianCheckout,
            yeuCauKhaoSatCheckout: t.YeuCauKhaoSatCheckout ?? t.yeuCauKhaoSatCheckout,
            hoTenNguoiDung: t.HoTenNguoiDung ?? t.hoTenNguoiDung,
            idNguoiDung: t.IdNguoiDung ?? t.idNguoiDung
        });

        if (allTickets.length === 0) {
            showState("empty");
            return;
        }

        showState("content");

    } catch (e) {
        console.error("Lỗi load vé:", e);
        showState("empty");
        showToast("Không thể tải danh sách vé. Vui lòng thử lại.", "error");
    }
}

// ─── SIDEBAR: LỊCH SỬ ────────────────────────────────────────────────────────
function renderSidebars() {
    renderHistorySidebar();
}

function renderHistorySidebar() {
    const el = document.getElementById("historyList");
    const countEl = document.getElementById("historyViewAll");
    if (!el) return;

    const past = allTickets
        .filter(t => {
            const end = t.thoiGianKetThuc ? new Date(t.thoiGianKetThuc) : null;
            return t.trangThai === "Đã tham gia" || t.trangThai === "Hoàn thành" || t.trangThai === "Vắng mặt"
                || (end && end < new Date());
        })
        .sort((a, b) => {
            const da = a.thoiGianBatDau ? new Date(a.thoiGianBatDau) : 0;
            const db = b.thoiGianBatDau ? new Date(b.thoiGianBatDau) : 0;
            return db - da;
        })
        .slice(0, 4);

    if (countEl) {
        countEl.textContent = `Xem tất cả lịch sử (${allTickets.length})`;
    }

    if (!past.length) {
        el.innerHTML = '<p class="mt-side-empty">Chưa có lịch sử tham gia</p>';
        return;
    }

    el.innerHTML = "";
    past.forEach(ticket => {
        const ngay = ticket.thoiGianBatDau ? new Date(ticket.thoiGianBatDau) : null;
        const dateStr = ngay
            ? ngay.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()
            : "—";
        let badgeClass = "other";
        let badgeText = ticket.trangThai;
        
        if (ticket.trangThai === "Đã tham gia" || ticket.trangThai === "Hoàn thành") {
            badgeClass = "attended";
            badgeText = ticket.trangThai === "Hoàn thành" ? "HOÀN THÀNH" : "ĐÃ THAM GIA";
        } else if (ticket.thoiGianKetThuc && new Date(ticket.thoiGianKetThuc) < new Date()) {
            badgeClass = "ended";
            badgeText = "ĐÃ KẾT THÚC";
        }

        const row = document.createElement("div");
        row.className = "mt-history-item";
        row.innerHTML = `
            <div class="mt-history-icon"><i class="fas fa-clock"></i></div>
            <div>
                <div class="mt-history-date">${escapeHtml(dateStr)}</div>
                <div class="mt-history-title">${escapeHtml(ticket.tenSuKien || "Sự kiện")}</div>
                <span class="mt-history-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
            </div>`;
        row.style.cursor = "pointer";
        row.addEventListener("click", () => selectTicket(ticket));
        el.appendChild(row);
    });
}

function getEventTimingBadge(ticket) {
    const now = new Date();
    const batDau = ticket.thoiGianBatDau ? new Date(ticket.thoiGianBatDau) : null;
    const ketThuc = ticket.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;
    if (ketThuc && now > ketThuc) return { text: "ĐÃ KẾT THÚC", cls: "ended" };
    if (batDau && now >= batDau && (!ketThuc || now <= ketThuc)) return { text: "ĐANG DIỄN RA", cls: "ongoing" };
    return { text: "SẮP DIỄN RA", cls: "" };
}

function getStatusIconClass(trangThai) {
    if (trangThai === "Đã xác nhận") return "confirmed";
    if (trangThai === "Chờ xác nhận") return "pending";
    if (trangThai === "Chờ chỗ") return "pending";
    if (trangThai === "Chờ người dùng xác nhận") return "pending";
    if (trangThai === "Đã tham gia") return "attended";
    return "cancelled";
}

// ─── CHỌN VÉ ĐỂ XEM CHI TIẾT ────────────────────────────────────────────────
function selectTicket(ticket) {
    if (!ticket) return;
    selectedTicket = ticket;
    showDetailPanel();

    document.querySelectorAll(".mt-filter-item").forEach(el => {
        el.classList.toggle("active", String(el.dataset.id) === String(ticket.idDangKy));
    });

    const tenSuKien = ticket.tenSuKien || "Sự kiện";
    const ngayBD    = ticket.thoiGianBatDau;
    const ngayKT    = ticket.thoiGianKetThuc;
    const diaDiem   = ticket.tenDiaDiem || "Đang cập nhật";
    const trangThai = ticket.trangThai || "Chờ xác nhận";

    const imgEl = document.getElementById("ticketEventImage");
    if (imgEl) {
        imgEl.src = EVENT_IMAGES[(ticket.idSuKien || 0) % EVENT_IMAGES.length];
        imgEl.onerror = () => { imgEl.src = "https://via.placeholder.com/220/0D5A9C/fff?text=Event"; };
    }

    const badge = getEventTimingBadge(ticket);
    const badgeEl = document.getElementById("ticketEventBadge");
    if (badgeEl) {
        badgeEl.textContent = badge.text;
        badgeEl.className = "mt-event-badge" + (badge.cls ? " " + badge.cls : "");
    }

    setText("ticketEventName", tenSuKien);

    if (ngayBD) {
        const startDate = new Date(ngayBD);
        setText("ticketDate", startDate.toLocaleDateString("vi-VN", {
            day: "numeric", month: "long", year: "numeric"
        }));
        const endDate = ngayKT ? new Date(ngayKT) : null;
        setText("ticketTime",
            endDate
                ? `${formatTimeHM(startDate)} - ${formatTimeHM(endDate)}`
                : formatTimeHM(startDate)
        );
    } else {
        setText("ticketDate", "Chưa có thông tin");
        setText("ticketTime", "—");
    }
    setText("ticketLocation", diaDiem);

    try {
        const user = JSON.parse(localStorage.getItem("userData") || "{}");
        const hoTen   = user.HoTen   || user.hoTen   || ticket.hoTenNguoiDung || "Người dùng";
        const maSoSSO = user.MaSoSSO || user.maSoSSO || ticket.idNguoiDung || "";
        const initials = hoTen.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase();
        setText("ticketAttendeeName", hoTen);
        setText("ticketAttendeeMssv", `MSSV: ${maSoSSO}`);
        const av = document.getElementById("ticketUserAvatar");
        if (av) av.textContent = initials || "NV";
    } catch (e) { /* bỏ qua */ }

    const iconEl = document.getElementById("ticketStatusIcon");
    if (iconEl) {
        iconEl.className = `mt-status-icon ${getStatusIconClass(trangThai)}`;
        const icons = {
            "Đã xác nhận": "fa-check-circle",
            "Chờ xác nhận": "fa-clock",
            "Chờ chỗ": "fa-hourglass-half",
            "Chờ người dùng xác nhận": "fa-bell",
            "Đã tham gia": "fa-star",
            "Hoàn thành": "fa-check-double",
            "Vắng mặt": "fa-user-times",
            "Đã hủy": "fa-ban"
        };
        iconEl.innerHTML = `<i class="fas ${icons[trangThai] || "fa-info-circle"}"></i>`;
    }

    const linkDetail = document.getElementById("linkTicketDetail");
    if (linkDetail) linkDetail.href = typeof TicketBiz !== 'undefined' ? TicketBiz.ticketDetailUrl(ticket.idDangKy) : `ticket-detail.html?id=${ticket.idDangKy}`;

    renderQRSection(ticket);
    renderCheckinTimeline(ticket);
    renderCheckinButtons(ticket);
    renderCancelButton(ticket);
    renderWaitlistConfirmButton(ticket);
    renderReRegisterButton(ticket);
    renderSidebars();
    updateFilterCounts();
    renderTicketFilterList();

    if (shouldShowQR(trangThai)) {
        startQRCountdown(ticket);
    } else if (qrTimer) {
        clearInterval(qrTimer);
        qrTimer = null;
    }

    if (checkinTimer) clearInterval(checkinTimer);
    if (trangThai === "Đã xác nhận" && !ticket.thoiGianCheckin) {
        checkinTimer = setInterval(() => {
            if (selectedTicket) renderCheckinButtons(selectedTicket);
        }, 30000);
    }

    if (window.innerWidth <= 1100) {
        document.getElementById("ticketDetailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function shareTicket() {
    if (!selectedTicket) return;
    const url = typeof TicketBiz !== 'undefined' ? TicketBiz.ticketDetailUrl(selectedTicket.idDangKy) : `ticket-detail.html?id=${selectedTicket.idDangKy}`;
    const full = new URL(url, window.location.href).href;
    if (navigator.share) {
        navigator.share({ title: selectedTicket.tenSuKien || "Vé UTE Events", url: full });
    } else {
        navigator.clipboard.writeText(full).then(() => showToast("Đã sao chép link vé.", "info"));
    }
}

// ─── QR CODE ─────────────────────────────────────────────────────────────────
function shouldShowQR(trangThai) {
    return typeof TicketBiz !== 'undefined' ? TicketBiz.canShowQr(trangThai) : ["Đã xác nhận"].includes(trangThai);
}

function renderQRSection(ticket) {
    const section = document.getElementById("qrSection");
    const activePanel = document.getElementById("qrActivePanel");
    const statusPanel = document.getElementById("qrStatusPanel");
    if (!section) return;

    const trangThai = ticket.trangThai || "";
    section.style.display = "block";

    if (shouldShowQR(trangThai)) {
        if (activePanel) activePanel.style.display = "block";
        if (statusPanel) statusPanel.style.display = "none";

        const qrData = buildQRData(ticket);
        const qrUrl = typeof TicketBiz !== 'undefined' ? TicketBiz.qrImageUrl(qrData) : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        const qrImg = document.getElementById("qrImage");
        if (qrImg) {
            qrImg.style.opacity = "0.5";
            qrImg.src = qrUrl;
            qrImg.onload = () => { qrImg.style.opacity = "1"; };
            qrImg.onerror = () => {
                qrImg.style.opacity = "1";
                qrImg.src = "https://via.placeholder.com/200/e2e8f0/555?text=QR";
            };
        }
        return;
    }

    if (activePanel) activePanel.style.display = "none";
    if (statusPanel) {
        statusPanel.style.display = "block";
        if (trangThai === "Chờ xác nhận") {
            statusPanel.className = "mt-qr-status pending";
            statusPanel.innerHTML = '<i class="fas fa-clock"></i> Đăng ký đang chờ BTC xác nhận. QR sẽ hiện sau khi được duyệt.';
        } else if (trangThai === "Chờ chỗ") {
            statusPanel.className = "mt-qr-status pending";
            statusPanel.innerHTML = '<i class="fas fa-hourglass-half"></i> Sự kiện đã hết chỗ. Bạn đang chờ. Khi có chỗ, hệ thống sẽ mời bạn xác nhận trong 24h.';
        } else if (trangThai === "Chờ người dùng xác nhận") {
            statusPanel.className = "mt-qr-status pending";
            statusPanel.innerHTML = '<i class="fas fa-bell"></i> Bạn vừa được mời xác nhận chỗ. Vui lòng xác nhận trong 24h để nhận QR check-in.';
        } else if (trangThai === "Đã tham gia" || trangThai === "Hoàn thành") {
            statusPanel.className = "mt-qr-status attended";
            const t = ticket.thoiGianCheckin ? formatDDMM(ticket.thoiGianCheckin) : "";
            const co = ticket.thoiGianCheckout ? formatDDMM(ticket.thoiGianCheckout) : "";
            statusPanel.innerHTML = trangThai === "Hoàn thành"
                ? `<i class="fas fa-check-circle"></i> Bạn đã hoàn thành sự kiện${co ? " lúc " + co : ""}.`
                : `<i class="fas fa-check-circle"></i> Đã check-in${t ? " lúc " + t : ""}. Cảm ơn bạn đã tham gia!`;
        } else {
            statusPanel.className = "mt-qr-status cancelled";
            statusPanel.innerHTML = `<i class="fas fa-ban"></i> Vé không còn hiệu lực (${escapeHtml(trangThai)}).`;
        }
    }
}

function buildQRData(ticket) {
    return typeof TicketBiz !== 'undefined' ? TicketBiz.buildQrPayload(ticket.idDangKy) : `UTE-CHECKIN-${ticket.idDangKy}-${Date.now()}`;
}

// ─── QR COUNTDOWN ─────────────────────────────────────────────────────────────
function startQRCountdown(ticket) {
    if (qrTimer) clearInterval(qrTimer);
    qrSeconds = typeof TicketBiz !== 'undefined' ? TicketBiz.QR_REFRESH_SEC : 45;
    setText("qrCountdown", qrSeconds);

    qrTimer = setInterval(() => {
        qrSeconds--;
        setText("qrCountdown", qrSeconds);

        if (qrSeconds <= 0) {
            renderQRSection(ticket);
            qrSeconds = typeof TicketBiz !== 'undefined' ? TicketBiz.QR_REFRESH_SEC : 45;
        }
    }, 1000);
}

function refreshQR() {
    if (!selectedTicket) return;
    renderQRSection(selectedTicket);
    qrSeconds = typeof TicketBiz !== 'undefined' ? TicketBiz.QR_REFRESH_SEC : 45;
    setText("qrCountdown", qrSeconds);
    showToast("Đã làm mới mã QR.", "info");
}

// ─── TIMELINE CHECK-IN / CHECK-OUT ───────────────────────────────────────────
function renderCheckinTimeline(ticket) {
    const stepReg  = document.getElementById("stepRegister");
    const stepCI   = document.getElementById("stepCheckin");
    const stepCO   = document.getElementById("stepCheckout");

    const stepRegTime = document.getElementById("stepRegisterTime");
    const stepCITime  = document.getElementById("stepCheckinTime");
    const stepCOTime  = document.getElementById("stepCheckoutTime");

    [stepReg, stepCI, stepCO].forEach(el => { if (el) el.className = "checkin-step"; });

    if (stepReg) stepReg.className = "checkin-step done";
    if (stepRegTime && ticket.thoiGianDangKy) {
        stepRegTime.textContent = formatDDMM(ticket.thoiGianDangKy);
    }

    if (ticket.thoiGianCheckin) {
        if (stepCI) stepCI.className = "checkin-step done";
        if (stepCITime) stepCITime.textContent = formatDDMM(ticket.thoiGianCheckin);
    } else if (ticket.trangThai === "Đã xác nhận") {
        if (stepCI) stepCI.className = "checkin-step active";
    }

    if (ticket.thoiGianCheckout) {
        if (stepCO) stepCO.className = "checkin-step done";
        if (stepCOTime) stepCOTime.textContent = formatDDMM(ticket.thoiGianCheckout);
    } else if (ticket.thoiGianCheckin && !ticket.thoiGianCheckout) {
        if (stepCO) stepCO.className = "checkin-step active";
    }
}

// ─── NÚT CHECK-IN / CHECK-OUT ────────────────────────────────────────────────
function renderCheckinButtons(ticket) {
    const btnCI = document.getElementById("btnCheckin");
    const btnCO = document.getElementById("btnCheckout");
    if (!btnCI || !btnCO) return;

    const trangThai  = ticket.trangThai || "";
    const checkedIn  = !!ticket.thoiGianCheckin;
    const checkedOut = !!ticket.thoiGianCheckout;
    const now        = new Date();

    const batDau  = ticket.thoiGianBatDau  ? new Date(ticket.thoiGianBatDau)  : null;
    const ketThuc = ticket.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;

    const checkInOpen  = batDau  ? new Date(batDau.getTime() - 30 * 60 * 1000) : null;
    const checkInClose = ketThuc ? ketThuc : null;

    const inCheckInWindow = checkInOpen && checkInClose
        ? (now >= checkInOpen && now <= checkInClose)
        : checkInOpen
            ? now >= checkInOpen
            : true;

    const eventStarted = batDau ? now >= batDau : true;

    const canCheckin = trangThai === "Đã xác nhận" && !checkedIn && inCheckInWindow;
    btnCI.className  = `btn-checkin check-in${canCheckin ? "" : " disabled"}`;
    btnCI.disabled   = !canCheckin;

    if (checkedIn) {
        btnCI.innerHTML = '<i class="fas fa-check"></i> ĐÃ CHECK-IN';
    } else if (trangThai === "Chờ xác nhận") {
        btnCI.innerHTML = '<i class="fas fa-clock"></i> CHỜ BTC XÁC NHẬN';
    } else if (trangThai === "Chờ chỗ") {
        btnCI.innerHTML = '<i class="fas fa-hourglass-half"></i> CHỜ CHỖ';
    } else if (trangThai === "Chờ người dùng xác nhận") {
        btnCI.innerHTML = '<i class="fas fa-bell"></i> CHỜ XÁC NHẬN (24H)';
    } else if (trangThai === "Đã hủy" || trangThai === "Vắng mặt") {
        btnCI.innerHTML = '<i class="fas fa-ban"></i> KHÔNG THỂ CHECK-IN';
    } else if (checkInOpen && now < checkInOpen) {
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

function renderCancelButton(ticket) {
    const btn = document.getElementById("btnCancelTicket");
    if (!btn) return;
    btn.style.display = (typeof TicketBiz !== 'undefined' ? TicketBiz.canCancel(ticket) : ["Chờ xác nhận", "Đã xác nhận"].includes(ticket.trangThai)) ? "flex" : "none";
}
function renderWaitlistConfirmButton(ticket) {
    const btn = document.getElementById("btnConfirmWaitlist");
    if (!btn) return;
    btn.style.display = (ticket && ticket.trangThai === "Chờ người dùng xác nhận") ? "flex" : "none";
}

function renderReRegisterButton(ticket) {
    const btn = document.getElementById("btnReRegister");
    if (!btn) return;
    const isEnded = ticket.thoiGianKetThuc && new Date() > new Date(ticket.thoiGianKetThuc);
    btn.style.display = (ticket.trangThai === "Đã hủy" && !isEnded) ? "flex" : "none";
}

async function doConfirmWaitlist() {
    if (!selectedTicket || selectedTicket.trangThai !== "Chờ người dùng xác nhận") {
        showToast("Trạng thái yêu cầu xác nhận không hợp lệ.", "error");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    const btn = document.getElementById("btnConfirmWaitlist");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }

    try {
        const res = await fetch(`${API_BASE}/DangKy/xac-nhan-cho-nguoi`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien: selectedTicket.idSuKien,
                IdNguoiDung: selectedTicket.idNguoiDung
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok = data.Success ?? data.success;
        const msg = data.Message || data.message || "Xác nhận không thành công.";

        if (res.ok && ok !== false) {
            selectedTicket.trangThai = "Đã xác nhận";
            selectedTicket.thoiGianDangKy = new Date().toISOString();
            selectedTicket.thoiGianHuy = null;
            selectedTicket.thoiGianCheckin = null;
            selectedTicket.thoiGianCheckout = null;

            syncTicketInArray(selectedTicket);
            selectTicket(selectedTicket);
            showToast("✅ Đã xác nhận chỗ. QR đã sẵn sàng.", "success");
        } else {
            showToast(msg, "error");
        }
    } catch (e) {
        console.error("Lỗi xác nhận chỗ:", e);
        showToast("Không thể kết nối đến máy chủ.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Xác nhận chỗ (24h)';
        }
    }
}

// ─── THỰC HIỆN CHECK-IN ──────────────────────────────────────────────────────
async function doCheckin() {
    if (!selectedTicket) return;
    if (selectedTicket.thoiGianCheckin) {
        showToast("Bạn đã check-in rồi.", "info");
        return;
    }

    const token = localStorage.getItem("token");
    const btn   = document.getElementById("btnCheckin");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang check-in...';
    }

    try {
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
        
        if (res.ok && ok !== false) {
            const now = data.ThoiGianCheckin || data.thoiGianCheckin || new Date().toISOString();
            selectedTicket.thoiGianCheckin = now;
            selectedTicket.trangThai       = "Đã tham gia";

            syncTicketInArray(selectedTicket);
            refreshTicketUI();
            showToast("✅ Check-in thành công! Chào mừng bạn đến sự kiện.", "success");
        } else {
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
async function doCheckout() {
    if (!selectedTicket) return;

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
        let diem = null;
        let nhanXet = "";
        if (selectedTicket.yeuCauKhaoSatCheckout !== false) {
            const rawScore = window.prompt("Đánh giá nhanh sự kiện (1-5 sao):", "5");
            if (rawScore === null) {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> CHECK-OUT';
                }
                return;
            }
            diem = parseInt(rawScore, 10);
            if (Number.isNaN(diem) || diem < 1 || diem > 5) {
                showToast("Vui lòng nhập điểm từ 1 đến 5 để check-out.", "error");
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> CHECK-OUT';
                }
                return;
            }
            nhanXet = (window.prompt("Nhận xét ngắn (không bắt buộc):", "") || "").trim();
        }

        const res = await fetch(`${API_BASE}/DangKy/check-out`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                IdSuKien:    selectedTicket.idSuKien,
                IdNguoiDung: selectedTicket.idNguoiDung,
                Diem: diem,
                NhanXet: nhanXet
            })
        });

        const data = await res.json().catch(() => ({}));
        const ok   = data.Success ?? data.success;

        if (res.ok && ok !== false) {
            const now = data.ThoiGianCheckout || data.thoiGianCheckout || new Date().toISOString();
            selectedTicket.thoiGianCheckout = now;
            selectedTicket.trangThai = "Hoàn thành";

            syncTicketInArray(selectedTicket);
            refreshTicketUI();
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
function openCancelModal() {
    const modal = document.getElementById("cancelModal");
    if (modal) modal.classList.add("active");
}

function closeCancelModal() {
    const modal = document.getElementById("cancelModal");
    if (modal) modal.classList.remove("active");
}

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
            selectedTicket.trangThai   = "Đã hủy";
            selectedTicket.thoiGianHuy = new Date().toISOString();

            syncTicketInArray(selectedTicket);
            switchFilter("cancelled");
            refreshTicketUI();
            showToast("Đã hủy đăng ký thành công.", "success");
        } else {
            const msg = data.Message || data.message || "Hủy đăng ký thất bại.";
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
function showState(state) {
    const loading = document.getElementById("loadingState");
    const empty   = document.getElementById("emptyState");
    const content = document.getElementById("ticketsLayout");

    if (loading) loading.style.display = state === "loading" ? "block" : "none";
    if (empty)   empty.style.display   = state === "empty"   ? "block" : "none";
    if (content) content.style.display = state === "content" ? "grid" : "none";
}

function refreshTicketUI() {
    updateFilterCounts();
    renderTicketFilterList();
    if (!selectedTicket) return;
    const t = allTickets.find(x => x.idDangKy === selectedTicket.idDangKy) || selectedTicket;
    selectedTicket = t;
    const iconEl = document.getElementById("ticketStatusIcon");
    if (iconEl) {
        iconEl.className = `mt-status-icon ${getStatusIconClass(t.trangThai)}`;
    }
    renderQRSection(t);
    renderCheckinTimeline(t);
    renderCheckinButtons(t);
    renderCancelButton(t);
    renderWaitlistConfirmButton(t);
    renderReRegisterButton(t);
    renderSidebars();
    document.querySelectorAll(".mt-filter-item").forEach(el => {
        el.classList.toggle("active", String(el.dataset.id) === String(t.idDangKy));
    });
}

function syncTicketInArray(ticket) {
    const idx = allTickets.findIndex(t => t.idDangKy === ticket.idDangKy);
    if (idx !== -1) allTickets[idx] = { ...ticket };
}

// ─── HELPERS: Format & style ──────────────────────────────────────────────────
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

// ─── ĐĂNG KÝ LẠI ──────────────────────────────────────────────────────────────
async function doReRegister() {
    if (!selectedTicket) return;
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    const btn = document.getElementById("btnReRegister");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...'; }

    try {
        const u = JSON.parse(localStorage.getItem("userData") || "{}");
        const idNguoiDung = u.IdNguoiDung || u.idNguoiDung || u.id;

        const res = await fetch(`${API_BASE}/DangKy/dang-ky`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ IdSuKien: selectedTicket.idSuKien, IdNguoiDung: idNguoiDung })
        });
        const d = await res.json().catch(() => ({}));

        if (res.ok && (d.Success ?? d.success) !== false) {
            showToast("✅ Đăng ký lại thành công!", "success");
            // Reload toàn bộ vé và cập nhật lại UI
            await loadMyTickets();
            initTicketListUI();
            // Chọn lại vé vừa đăng ký
            const updated = allTickets.find(t => t.idSuKien === selectedTicket.idSuKien);
            if (updated) selectTicket(updated);
        } else {
            showToast(d.Message || d.message || "Đăng ký thất bại.", "error");
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-redo"></i> Đăng ký lại'; }
        }
    } catch (e) {
        showToast("Không thể kết nối máy chủ.", "error");
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-redo"></i> Đăng ký lại'; }
    }
}
