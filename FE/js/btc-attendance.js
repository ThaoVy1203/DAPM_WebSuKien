/**
 * btc-attendance.js — BTC: danh sách đăng ký, duyệt, quét QR check-in
 * URL: btc-attendance.html?idSuKien={id}
 */
"use strict";

const API_BASE = "https://localhost:7160/api";

let participantsData = [];
let currentIdSuKien = null;
let currentEventInfo = null;

function getIdSuKienFromUrl() {
    const p = new URLSearchParams(window.location.search);
    return p.get("idSuKien") || p.get("id") || localStorage.getItem("btcCurrentSuKien") || null;
}

function authHeaders() {
    const token = localStorage.getItem("token");
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

// ─── LOAD EVENT + PARTICIPANTS ───────────────────────────────────────────────
async function loadEventInfo(idSuKien) {
    try {
        const res = await fetch(`${API_BASE}/SuKien/${idSuKien}`, { headers: authHeaders() });
        if (!res.ok) return;
        const ev = await res.json();
        currentEventInfo = ev;
        const title = ev.TenSuKien ?? ev.tenSuKien ?? "Sự kiện";
        const diaDiem = ev.TenDiaDiem ?? ev.tenDiaDiem ?? "";
        const batDau = ev.ThoiGianBatDau ?? ev.thoiGianBatDau;
        const ketThuc = ev.ThoiGianKetThuc ?? ev.thoiGianKetThuc;
        const h1 = document.querySelector(".event-info h1");
        if (h1) h1.textContent = title;
        const meta = document.querySelector(".event-meta");
        if (meta && batDau) {
            const s = new Date(batDau);
            const e = ketThuc ? new Date(ketThuc) : null;
            const timeStr = e
                ? `${s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                : s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            meta.innerHTML = `
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem || "—")}</span>
                <span><i class="fas fa-clock"></i> ${timeStr}</span>`;
        }
    } catch (e) {
        console.warn("Không tải thông tin SK:", e);
    }
}

async function loadAttendanceData() {
    if (!currentIdSuKien) {
        showBtcMessage("Thiếu id sự kiện. Mở trang dạng: btc-attendance.html?idSuKien=1", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/DangKy/su-kien/${currentIdSuKien}`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.items || []);
        participantsData = raw.map(normalizeParticipant);

        renderParticipantsTable(participantsData);
        updateStats();
    } catch (error) {
        console.error("Lỗi load đăng ký:", error);
        showBtcMessage("Không tải được danh sách đăng ký. Kiểm tra Backend và idSuKien.", "error");
    }
}

function normalizeParticipant(p) {
    return {
        idDangKy: p.IdDangKy ?? p.idDangKy,
        idSuKien: p.IdSuKien ?? p.idSuKien,
        idNguoiDung: p.IdNguoiDung ?? p.idNguoiDung,
        hoTen: p.HoTenNguoiDung ?? p.hoTenNguoiDung ?? "—",
        trangThai: p.TrangThai ?? p.trangThai ?? "",
        thoiGianDangKy: p.ThoiGianDangKy ?? p.thoiGianDangKy,
        thoiGianCheckin: p.ThoiGianCheckin ?? p.thoiGianCheckin,
        thoiGianCheckout: p.ThoiGianCheckout ?? p.thoiGianCheckout
    };
}

// ─── RENDER TABLE ─────────────────────────────────────────────────────────────
function renderParticipantsTable(list) {
    const tbody = document.getElementById("participantsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#888;">Chưa có đăng ký</td></tr>`;
        return;
    }

    list.forEach(p => {
        const row = document.createElement("tr");
        const initials = (p.hoTen || "NA").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        const statusClass = mapStatusClass(p.trangThai);
        const checkInStr = p.thoiGianCheckin
            ? new Date(p.thoiGianCheckin).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
            })
            : "—";

        let actions = "";
        if (p.trangThai === "Chờ xác nhận") {
            actions = `
                <button class="btn-btc-approve" title="Xác nhận" onclick="approveRegistration('${p.idNguoiDung}')"><i class="fas fa-check"></i></button>
                <button class="btn-btc-reject" title="Từ chối" onclick="rejectRegistration('${p.idNguoiDung}')"><i class="fas fa-times"></i></button>`;
        }

        row.innerHTML = `
            <td>
                <div class="participant-info">
                    <div class="participant-avatar blue">${initials}</div>
                    <div class="participant-details">
                        <div class="participant-name">${escapeHtml(p.hoTen)}</div>
                        <div class="participant-department">Vé #${p.idDangKy}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(p.idNguoiDung)}</td>
            <td>${checkInStr}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(p.trangThai)}</span></td>
            <td class="td-actions">${actions}</td>`;
        tbody.appendChild(row);
    });
}

function mapStatusClass(trangThai) {
    switch (trangThai) {
        case "Đã tham gia": return "present";
        case "Đã xác nhận": return "confirmed";
        case "Chờ xác nhận": return "pending";
        case "Vắng mặt": return "absent";
        case "Đã hủy": return "cancelled";
        default: return "";
    }
}

// ─── QR CHECK-IN (BTC) ───────────────────────────────────────────────────────
async function checkInByQrToken(qrToken) {
    const token = (qrToken || "").trim();
    if (!token) {
        showBtcMessage("Vui lòng dán hoặc quét mã QR.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/DangKy/check-in-qr`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ QrToken: token })
        });
        const data = await res.json().catch(() => ({}));
        const ok = data.Success ?? data.success;
        const msg = data.Message || data.message || "";

        if (res.ok && ok !== false) {
            showBtcMessage(msg || "Check-in QR thành công!", "success");
            pushActivity("QR check-in", "THÀNH CÔNG");
            const input = document.getElementById("qrTokenInput");
            if (input) input.value = "";
            await loadAttendanceData();
        } else {
            showBtcMessage(msg || "Mã QR không hợp lệ hoặc đã hết hạn.", "error");
            pushActivity(msg || "QR thất bại", "LỖI");
        }
    } catch (e) {
        console.error(e);
        showBtcMessage("Không kết nối được máy chủ.", "error");
    }
}

// ─── DUYỆT / TỪ CHỐI ĐĂNG KÝ ─────────────────────────────────────────────────
async function approveRegistration(idNguoiDung) {
    if (!currentIdSuKien) return;
    try {
        const res = await fetch(`${API_BASE}/DangKy/xac-nhan`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ IdSuKien: parseInt(currentIdSuKien, 10), IdNguoiDung: idNguoiDung })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.Success ?? data.success) !== false) {
            showBtcMessage("Đã xác nhận đăng ký.", "success");
            await loadAttendanceData();
        } else {
            showBtcMessage(data.Message || data.message || "Xác nhận thất bại.", "error");
        }
    } catch (e) {
        showBtcMessage("Lỗi kết nối.", "error");
    }
}

async function rejectRegistration(idNguoiDung) {
    if (!currentIdSuKien || !confirm("Từ chối đăng ký này?")) return;
    try {
        const res = await fetch(`${API_BASE}/DangKy/tu-choi`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ IdSuKien: parseInt(currentIdSuKien, 10), IdNguoiDung: idNguoiDung })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.Success ?? data.success) !== false) {
            showBtcMessage("Đã từ chối đăng ký.", "success");
            await loadAttendanceData();
        } else {
            showBtcMessage(data.Message || data.message || "Từ chối thất bại.", "error");
        }
    } catch (e) {
        showBtcMessage("Lỗi kết nối.", "error");
    }
}

// ─── MANUAL: dán mã QR hoặc nhập id vé ───────────────────────────────────────
async function manualCheckIn() {
    const qr = prompt(
        "Dán mã QR (UTE-CHECKIN-...) hoặc chỉ nhập IdDangKy:",
        document.getElementById("qrTokenInput")?.value || ""
    );
    if (!qr) return;

    const trimmed = qr.trim();
    if (/^\d+$/.test(trimmed) && typeof TicketBiz !== "undefined") {
        await checkInByQrToken(TicketBiz.buildQrPayload(parseInt(trimmed, 10)));
    } else if (/^UTE-CHECKIN-/i.test(trimmed)) {
        await checkInByQrToken(trimmed);
    } else {
        await checkInByQrToken(trimmed);
    }
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
    const total = participantsData.length;
    const present = participantsData.filter(p =>
        p.trangThai === "Đã tham gia" || p.thoiGianCheckin
    ).length;
    const pending = participantsData.filter(p => p.trangThai === "Chờ xác nhận").length;
    const absent = total - present;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    const circumference = 2 * Math.PI * 90;
    const progress = total > 0 ? (present / total) * circumference : 0;

    const circleProgress = document.querySelector(".circle-progress");
    if (circleProgress) circleProgress.style.strokeDasharray = `${progress}, ${circumference}`;

    const circleNumber = document.querySelector(".circle-number");
    if (circleNumber) circleNumber.textContent = present;

    const circleLabel = document.querySelector(".circle-label");
    if (circleLabel) circleLabel.textContent = `TRÊN ${total}`;

    const statValues = document.querySelectorAll(".stat-value");
    if (statValues.length >= 2) {
        statValues[0].textContent = percentage + "%";
        statValues[1].textContent = absent;
    }

    const pendingEl = document.getElementById("statPendingCount");
    if (pendingEl) pendingEl.textContent = pending > 0 ? `${pending} đăng ký chờ duyệt` : "";
}

// ─── ACTIVITY FEED ───────────────────────────────────────────────────────────
function pushActivity(text, statusText) {
    const list = document.querySelector(".activity-list");
    if (!list) return;
    const item = document.createElement("div");
    item.className = "activity-item";
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `
        <div class="activity-avatar">QR</div>
        <div class="activity-info">
            <div class="activity-name">${escapeHtml(text)}</div>
            <div class="activity-id">${now}</div>
        </div>
        <div class="activity-status-badge ${statusText === "THÀNH CÔNG" ? "success" : "error"}">
            <span>VỪA XONG</span>
            <span class="status-text">${statusText}</span>
        </div>`;
    list.insertBefore(item, list.firstChild);
    while (list.children.length > 8) list.removeChild(list.lastChild);
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────
function setupSearch() {
    const searchInput = document.querySelector(".participants-card .search-box input")
        || document.querySelector(".search-box input");
    if (!searchInput) return;

    searchInput.addEventListener("input", function (e) {
        const term = e.target.value.toLowerCase();
        const filtered = participantsData.filter(p =>
            (p.hoTen || "").toLowerCase().includes(term) ||
            String(p.idNguoiDung || "").toLowerCase().includes(term) ||
            String(p.idDangKy || "").includes(term)
        );
        renderParticipantsTable(filtered);
    });
}

function exportToExcel() {
    if (!participantsData.length) {
        showBtcMessage("Không có dữ liệu để xuất.", "info");
        return;
    }
    const headers = ["IdDangKy", "HoTen", "IdNguoiDung", "TrangThai", "ThoiGianCheckin"];
    const rows = participantsData.map(p => [
        p.idDangKy,
        p.hoTen,
        p.idNguoiDung,
        p.trangThai,
        p.thoiGianCheckin || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `diem-danh-sk${currentIdSuKien}.csv`;
    a.click();
}

function setupEventListeners() {
    document.querySelector(".btn-export")?.addEventListener("click", exportToExcel);
    document.querySelector(".btn-manual-checkin")?.addEventListener("click", manualCheckIn);
    document.getElementById("btnScanQr")?.addEventListener("click", () => {
        checkInByQrToken(document.getElementById("qrTokenInput")?.value);
    });
    document.getElementById("qrTokenInput")?.addEventListener("keydown", e => {
        if (e.key === "Enter") checkInByQrToken(e.target.value);
    });
}

function showBtcMessage(msg, type) {
    if (type === "success") alert("✅ " + msg);
    else if (type === "error") alert("❌ " + msg);
    else alert(msg);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    currentIdSuKien = getIdSuKienFromUrl();
    if (currentIdSuKien) localStorage.setItem("btcCurrentSuKien", currentIdSuKien);

    setupEventListeners();
    setupSearch();

    if (currentIdSuKien) {
        await loadEventInfo(currentIdSuKien);
        await loadAttendanceData();
        setInterval(loadAttendanceData, 30000);
    } else {
        const id = prompt("Nhập IdSuKien cho trang điểm danh:");
        if (id) {
            window.location.search = `?idSuKien=${encodeURIComponent(id)}`;
        }
    }
});

window.attendanceModule = {
    loadAttendanceData,
    checkInByQrToken,
    approveRegistration,
    rejectRegistration,
    manualCheckIn
};
