/**
 * btc-attendance.js — BTC: danh sách đăng ký, duyệt, quét QR check-in
 */
"use strict";

if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
}

let attendancePageData = {
    events: [],
    selectedEventId: null,
    participants: []
};

// ─── OFFLINE FALLBACK (QR check-in sync) ──────────────────────────────────
let offlineQueue = []; // [{ qrToken, scanTimeMs }]
let confirmedCache = null; // { ids: number[], fetchedAt: number, eventWindow: {start,end} }

function getOfflineQueueKey() {
    return `btcOfflineQueue_${attendancePageData.selectedEventId || "unknown"}`;
}

function getConfirmedCacheKey() {
    return `btcConfirmedCache_${attendancePageData.selectedEventId || "unknown"}`;
}

function updateOfflineQueueCountUI() {
    const el = document.getElementById("offlineQueueCount");
    if (!el) return;
    el.textContent = offlineQueue.length ? `Offline queue: ${offlineQueue.length}` : "";
}

function loadOfflineQueueFromStorage() {
    try {
        const raw = localStorage.getItem(getOfflineQueueKey());
        offlineQueue = raw ? JSON.parse(raw) : [];
    } catch {
        offlineQueue = [];
    }
    updateOfflineQueueCountUI();
}

function saveOfflineQueueToStorage() {
    try {
        localStorage.setItem(getOfflineQueueKey(), JSON.stringify(offlineQueue));
    } catch { /* ignore */ }
}

function isIdDangKyInConfirmedCache(idDangKy) {
    if (!confirmedCache || !Array.isArray(confirmedCache.ids)) return false;
    return confirmedCache.ids.some(x => Number(x) === Number(idDangKy));
}

function authHeaders() {
    const token = localStorage.getItem("token");
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

async function syncOfflineQueue() {
    if (!attendancePageData.selectedEventId) return;
    loadOfflineQueueFromStorage();
    if (!offlineQueue.length) return;

    // Nếu đang offline thì đừng gọi server
    if (!navigator.onLine) return;

    // Đồng bộ tuần tự để tránh spam
    const newQueue = [];
    for (const item of offlineQueue) {
        try {
            const res = await fetch(`${window.API_BASE}/DangKy/check-in-qr`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    QrToken: item.qrToken,
                    ScanTimeMs: item.scanTimeMs
                })
            });
            const data = await res.json().catch(() => ({}));
            const ok = data.Success ?? data.success;

            if (res.ok && ok !== false) {
                // success: drop khỏi queue
                pushActivity("Offline check-in", "THÀNH CÔNG");
            } else {
                // Lỗi nghiệp vụ: thường không recoverable -> bỏ (tránh kẹt queue)
                const msg = data.Message || data.message || "Check-in thất bại";
                pushActivity("Offline check-in", "LỖI");
                console.warn("Sync queue dropped:", msg);
            }
        } catch (e) {
            // Network error: giữ lại phần chưa gửi
            newQueue.push(item);
            break;
        }
    }

    offlineQueue = newQueue;
    saveOfflineQueueToStorage();
    updateOfflineQueueCountUI();
}

// ================= LOAD EVENTS SELECTOR =================
async function loadEventsSelector() {
    const selector = document.getElementById("eventSelector");
    if (!selector) return;

    try {
        const res = await fetch(`${window.API_BASE}/SuKien`, {
            headers: authHeaders()
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

    let currentEventInfo = null;

    // Load event details
    try {
        const res = await fetch(`${window.API_BASE}/SuKien/${eventId}`, { headers: authHeaders() });
        if (res.ok) {
            currentEventInfo = await res.json();
            const title = currentEventInfo.tenSuKien || "Sự kiện";
            const diaDiem = currentEventInfo.tenDiaDiem || "Hội trường";
            const batDau = currentEventInfo.thoiGianBatDau;
            const ketThuc = currentEventInfo.thoiGianKetThuc;

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
        const res = await fetch(`${window.API_BASE}/DangKy/su-kien/${eventId}`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.items || []);
        attendancePageData.participants = raw.map(normalizeParticipant);

        // Cache danh sách "Đã xác nhận" để fallback offline
        try {
            const confirmedIds = attendancePageData.participants
                .filter(p => p.trangThai === "Đã xác nhận" || p.trangThai === "confirmed")
                .map(p => p.idDangKy)
                .filter(id => id !== null && id !== undefined);

            const batDau = currentEventInfo?.thoiGianBatDau || currentEventInfo?.ThoiGianBatDau;
            const ketThuc = currentEventInfo?.thoiGianKetThuc || currentEventInfo?.ThoiGianKetThuc;

            confirmedCache = {
                ids: confirmedIds.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n)),
                fetchedAt: Date.now(),
                eventWindow: {
                    batDau: batDau ? new Date(batDau).toISOString() : null,
                    ketThuc: ketThuc ? new Date(ketThuc).toISOString() : null
                }
            };
            localStorage.setItem(getConfirmedCacheKey(), JSON.stringify(confirmedCache));
        } catch (e) { /* cache best-effort */ }

        renderParticipantsTable(attendancePageData.participants);
        updateStats();
        updateOfflineQueueCountUI();
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
        const lowerTrangThai = p.trangThai.toLowerCase();
        if (lowerTrangThai.includes("chờ xác nhận") || lowerTrangThai === "pending") {
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
    let token = (qrToken || "").trim();
    if (!token) {
        showBtcMessage("Vui lòng dán hoặc quét mã QR.", "error");
        return;
    }

    // Nếu người vận hành chỉ nhập IdDangKy (dạng số) thì tự chuyển sang QR tĩnh
    if (/^\d+$/.test(token) && typeof TicketBiz !== "undefined") {
        token = TicketBiz.buildStaticQrPayload(parseInt(token, 10));
    }

    try {
        const scanTimeMs = Date.now();
        const res = await fetch(`${window.API_BASE}/DangKy/check-in-qr`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ QrToken: token, ScanTimeMs: scanTimeMs })
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
        // Offline fallback: lưu vào queue để sync khi có mạng.
        try {
            if (!confirmedCache) {
                const rawCache = localStorage.getItem(getConfirmedCacheKey());
                confirmedCache = rawCache ? JSON.parse(rawCache) : null;
            }

            let idDangKy = null;
            if (/^\d+$/.test(token)) {
                idDangKy = parseInt(token, 10);
            } else if (typeof TicketBiz !== "undefined") {
                const parsed = TicketBiz.parseQrPayload(token);
                idDangKy = parsed ? parsed.idDangKy : null;
            }

            if (!confirmedCache || !Array.isArray(confirmedCache.ids) || !isIdDangKyInConfirmedCache(idDangKy)) {
                showBtcMessage("Không có dữ liệu cache xác nhận. Hãy thử lại khi có mạng hoặc kiểm tra lại cache.", "error");
                return;
            }

            offlineQueue.push({ qrToken: token, scanTimeMs: Date.now() });
            saveOfflineQueueToStorage();
            updateOfflineQueueCountUI();
            showBtcMessage("Đã ghi nhận offline. Sẽ tự đồng bộ khi có mạng.", "info");
            pushActivity("Offline QR check-in", "THÀNH CÔNG");
        } catch (qErr) {
            showBtcMessage("Không kết nối được máy chủ và cũng không lưu được offline queue.", "error");
        }
    }
}

async function manualCheckIn() {
    const qr = prompt(
        "Dán mã QR (UTE-CHECKIN-...) hoặc chỉ nhập IdDangKy:",
        document.getElementById("qrTokenInput")?.value || ""
    );
    if (!qr) return;

    const trimmed = qr.trim();
    if (/^\d+$/.test(trimmed) && typeof TicketBiz !== "undefined") {
        await checkInByQrToken(TicketBiz.buildStaticQrPayload(parseInt(trimmed, 10)));
    } else {
        await checkInByQrToken(trimmed);
    }
}

// ================= DUYỆT ĐĂNG KÝ =================
async function approveRegistration(idNguoiDung) {
    const eventId = attendancePageData.selectedEventId;
    if (!eventId) return;
    try {
        const res = await fetch(`${window.API_BASE}/DangKy/check-in`, {
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
        const res = await fetch(`${window.API_BASE}/DangKy/huy-dang-ky`, {
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
    const pending = attendancePageData.participants.filter(p =>
        p.trangThai === "Chờ xác nhận" || p.trangThai === "Chờ chỗ" || p.trangThai === "Chờ người dùng xác nhận" || p.trangThai === "pending"
    ).length;
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

    // 1. Tải danh sách selector để chọn sự kiện
    await loadEventsSelector();
    
    // 2. Load thông tin và danh sách người tham gia
    await loadEventDetailsAndAttendance();
    
    // 3. Khôi phục queue check-in offline của sự kiện hiện tại
    loadOfflineQueueFromStorage();
    
    // 4. Đồng bộ queue khi có mạng và theo chu kỳ
    window.addEventListener("online", syncOfflineQueue);
    setInterval(syncOfflineQueue, 15000);
    await syncOfflineQueue(); 
    
    // 5. Làm mới danh sách tham gia liên tục (30s)
    setInterval(loadEventDetailsAndAttendance, 30000);
});

// Bind globally for inline onclick
window.approveRegistration = approveRegistration;
window.rejectRegistration = rejectRegistration;
window.exportParticipants = exportParticipants;
window.manualCheckIn = manualCheckIn;