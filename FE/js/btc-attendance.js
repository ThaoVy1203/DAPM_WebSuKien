/**
 * btc-attendance.js — BTC: danh sách đăng ký, duyệt, quét QR check-in
 */
"use strict";

const API_BASE = "https://localhost:7160/api";

let attendancePageData = {
    events: [],
    selectedEventId: null,
    participants: []
};

function authHeaders() {
    const token = localStorage.getItem("token");
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

// ================= LOAD EVENTS SELECTOR =================
async function loadEventsSelector() {
    const selector = document.getElementById("eventSelector");
    if (!selector) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải sự kiện");

        const events = await res.json();
        attendancePageData.events = events;

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Get saved selected event
        let savedId = localStorage.getItem("btc_attendance_selected_event_id") || localStorage.getItem("btcCurrentSuKien");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            attendancePageData.selectedEventId = savedId;
        } else if (events.length > 0) {
            selector.value = events[0].idSuKien;
            attendancePageData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_attendance_selected_event_id", events[0].idSuKien);
            localStorage.setItem("btcCurrentSuKien", events[0].idSuKien);
        }

        // Change listener
        selector.addEventListener("change", function () {
            attendancePageData.selectedEventId = this.value;
            localStorage.setItem("btc_attendance_selected_event_id", this.value);
            localStorage.setItem("btcCurrentSuKien", this.value);
            loadEventDetailsAndAttendance();
        });

    } catch (error) {
        console.error("Lỗi tải selector:", error);
    }
}

// ================= LOAD EVENT DETAILS & ATTENDANCE DATA =================
async function loadEventDetailsAndAttendance() {
    const eventId = attendancePageData.selectedEventId;
    if (!eventId) return;

    // Load event details
    try {
        const res = await fetch(`${API_BASE}/SuKien/${eventId}`, { headers: authHeaders() });
        if (res.ok) {
            const ev = await res.json();
            const title = ev.tenSuKien || "Sự kiện";
            const diaDiem = ev.tenDiaDiem || "Hội trường";
            const batDau = ev.thoiGianBatDau;
            const ketThuc = ev.thoiGianKetThuc;

            const titleEl = document.getElementById("attendanceEventTitle");
            if (titleEl) titleEl.textContent = title;

            const locEl = document.getElementById("attendanceEventLocation");
            if (locEl) locEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${diaDiem}`;

            const timeEl = document.getElementById("attendanceEventTime");
            if (timeEl && batDau) {
                const s = new Date(batDau);
                const e = ketThuc ? new Date(ketThuc) : null;
                const timeStr = e
                    ? `${s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                    : s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                timeEl.innerHTML = `<i class="fas fa-clock"></i> Trực tiếp • ${timeStr}`;
            }
        }
    } catch (error) {
        console.error("Lỗi load event details:", error);
    }

    // Load participants (registrations)
    try {
        const res = await fetch(`${API_BASE}/DangKy/su-kien/${eventId}`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.items || []);
        attendancePageData.participants = raw.map(normalizeParticipant);

        renderParticipantsTable(attendancePageData.participants);
        updateStats();
    } catch (error) {
        console.error("Lỗi load đăng ký:", error);
        const tbody = document.getElementById("participantsTableBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#ef4444;">Không tải được dữ liệu tham gia.</td></tr>`;
    }
}

function normalizeParticipant(p) {
    return {
        idDangKy: p.idDangKy ?? p.IdDangKy,
        idSuKien: p.idSuKien ?? p.IdSuKien,
        idNguoiDung: p.idNguoiDung ?? p.IdNguoiDung,
        hoTen: p.hoTenNguoiDung ?? p.HoTenNguoiDung ?? "—",
        trangThai: p.trangThai ?? p.TrangThai ?? "",
        thoiGianDangKy: p.thoiGianDangKy ?? p.ThoiGianDangKy,
        thoiGianCheckin: p.thoiGianCheckin ?? p.ThoiGianCheckin,
        thoiGianCheckout: p.thoiGianCheckout ?? p.ThoiGianCheckout
    };
}

// ================= RENDER TABLE =================
function renderParticipantsTable(list) {
    const tbody = document.getElementById("participantsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#888;">Chưa có người đăng ký</td></tr>`;
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
        if (p.trangThai === "Chờ xác nhận" || p.trangThai === "pending") {
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
    if (!trangThai) return "";
    const lower = trangThai.toLowerCase();
    if (lower.includes("đã tham") || lower.includes("có mặt")) return "present";
    if (lower.includes("xác nhận") || lower === "confirmed") return "confirmed";
    if (lower.includes("chờ") || lower === "pending") return "pending";
    if (lower.includes("vắng") || lower === "absent") return "absent";
    if (lower.includes("hủy") || lower === "cancelled") return "cancelled";
    return "";
}

// ================= QR CHECK-IN =================
async function checkInByQrToken(qrToken) {
    const token = (qrToken || "").trim();
    if (!token) {
        showBtcMessage("Vui lòng dán hoặc quét mã QR.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/DangKy/check-in`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ 
                IdSuKien: parseInt(attendancePageData.selectedEventId),
                IdNguoiDung: token // giả sử token QR là IdNguoiDung
            })
        });
        const data = await res.json().catch(() => ({}));
        const ok = data.success ?? data.Success;
        const msg = data.message || data.Message || "";

        if (res.ok && ok !== false) {
            showBtcMessage(msg || "Check-in QR thành công!", "success");
            pushActivity("QR check-in: " + token, "THÀNH CÔNG");
            const input = document.getElementById("qrTokenInput");
            if (input) input.value = "";
            await loadEventDetailsAndAttendance();
        } else {
            showBtcMessage(msg || "Mã check-in không hợp lệ.", "error");
            pushActivity(msg || "QR thất bại: " + token, "LỖI");
        }
    } catch (e) {
        console.error(e);
        showBtcMessage("Không kết nối được máy chủ.", "error");
    }
}

// ================= DUYỆT ĐĂNG KÝ =================
async function approveRegistration(idNguoiDung) {
    const eventId = attendancePageData.selectedEventId;
    if (!eventId) return;
    try {
        const res = await fetch(`${API_BASE}/DangKy/check-in`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ IdSuKien: parseInt(eventId, 10), IdNguoiDung: idNguoiDung })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.success ?? data.Success) !== false) {
            showBtcMessage("Đã xác nhận điểm danh thành công.", "success");
            await loadEventDetailsAndAttendance();
        } else {
            showBtcMessage(data.message || data.Message || "Xác nhận thất bại.", "error");
        }
    } catch (e) {
        showBtcMessage("Lỗi kết nối.", "error");
    }
}

async function rejectRegistration(idNguoiDung) {
    const eventId = attendancePageData.selectedEventId;
    if (!eventId || !confirm("Từ chối đăng ký này?")) return;
    try {
        const res = await fetch(`${API_BASE}/DangKy/huy-dang-ky`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ IdSuKien: parseInt(eventId, 10), IdNguoiDung: idNguoiDung })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.success ?? data.Success) !== false) {
            showBtcMessage("Đã hủy đăng ký.", "success");
            await loadEventDetailsAndAttendance();
        } else {
            showBtcMessage(data.message || data.Message || "Hủy thất bại.", "error");
        }
    } catch (e) {
        showBtcMessage("Lỗi kết nối.", "error");
    }
}

// ================= STATS & PROGRESS =================
function updateStats() {
    const total = attendancePageData.participants.length;
    const present = attendancePageData.participants.filter(p =>
        p.trangThai.toLowerCase().includes("tham gia") || p.trangThai.toLowerCase().includes("có mặt") || p.thoiGianCheckin
    ).length;
    const pending = attendancePageData.participants.filter(p => p.trangThai === "Chờ xác nhận" || p.trangThai === "pending").length;
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

// ================= SEARCH & EXPORT =================
function setupSearch() {
    const searchInput = document.querySelector(".search-box input");
    if (!searchInput) return;

    searchInput.addEventListener("input", function (e) {
        const term = e.target.value.toLowerCase();
        const filtered = attendancePageData.participants.filter(p =>
            (p.hoTen || "").toLowerCase().includes(term) ||
            String(p.idNguoiDung || "").toLowerCase().includes(term) ||
            String(p.idDangKy || "").includes(term)
        );
        renderParticipantsTable(filtered);
    });
}

function exportParticipants() {
    if (!attendancePageData.participants.length) {
        alert("Không có dữ liệu để xuất.");
        return;
    }
    const headers = ["IdDangKy", "HoTen", "IdNguoiDung", "TrangThai", "ThoiGianCheckin"];
    const rows = attendancePageData.participants.map(p => [
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
    a.download = `diem-danh-sk${attendancePageData.selectedEventId}.csv`;
    a.click();
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

// ================= DOM CONTENT LOADED =================
document.addEventListener("DOMContentLoaded", async function () {
    setupSearch();
    
    // Bind verify check-in button
    document.getElementById("btnScanQr")?.addEventListener("click", () => {
        checkInByQrToken(document.getElementById("qrTokenInput")?.value);
    });
    document.getElementById("qrTokenInput")?.addEventListener("keydown", e => {
        if (e.key === "Enter") checkInByQrToken(e.target.value);
    });

    await loadEventsSelector();
    await loadEventDetailsAndAttendance();
    
    // Refresh participant list every 30s
    setInterval(loadEventDetailsAndAttendance, 30000);
});

// Bind globally for inline onclick
window.approveRegistration = approveRegistration;
window.rejectRegistration = rejectRegistration;
window.exportParticipants = exportParticipants;
