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
        // Load sự kiện của BTC hiện tại (không phải tất cả sự kiện)
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userId = userData.idNguoiDung;
        const vaiTros = userData.vaiTros || [];
        const isTruong = vaiTros.includes("TruongBanToChuc");

        let url = `${window.API_BASE}/SuKien`;
        if (userId) {
            url = isTruong 
                ? `${window.API_BASE}/SuKien/nguoi-tao/${userId}`
                : `${window.API_BASE}/SuKien/assigned/${userId}`;
        }

        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const events = await res.json();
        attendancePageData.events = Array.isArray(events) ? events : [];

        selector.innerHTML = '<option value="">-- Chọn sự kiện --</option>';
        attendancePageData.events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Khôi phục sự kiện đã chọn trước đó
        let savedId = localStorage.getItem("btc_attendance_selected_event_id") ||
                      localStorage.getItem("btcCurrentSuKien");
        if (savedId && attendancePageData.events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            attendancePageData.selectedEventId = savedId;
        } else if (attendancePageData.events.length > 0) {
            selector.value = attendancePageData.events[0].idSuKien;
            attendancePageData.selectedEventId = String(attendancePageData.events[0].idSuKien);
            localStorage.setItem("btc_attendance_selected_event_id", attendancePageData.selectedEventId);
            localStorage.setItem("btcCurrentSuKien", attendancePageData.selectedEventId);
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
        const selector = document.getElementById("eventSelector");
        if (selector) selector.innerHTML = '<option value="">Không tải được sự kiện</option>';
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

            // Đồng bộ hình ảnh sự kiện
            const imgEl = document.getElementById("attendanceEventImage");
            if (imgEl) {
                const hinhAnh = currentEventInfo.hinhAnh;
                if (hinhAnh) {
                    imgEl.src = hinhAnh;
                    imgEl.style.display = "block";
                } else {
                    imgEl.style.display = "none";
                }
            }

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
        // Hiện loading
        const tbody = document.getElementById("participantsTableBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:#9CA3AF;">
            <i class="fas fa-spinner fa-spin" style="font-size:20px;display:block;margin-bottom:8px;"></i>Đang tải danh sách...
        </td></tr>`;

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
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#EF4444;">
            <i class="fas fa-exclamation-triangle" style="font-size:28px;display:block;margin-bottom:8px;"></i>
            Không tải được dữ liệu: ${escapeHtml(error.message)}<br>
            <button onclick="loadEventDetailsAndAttendance()" style="margin-top:10px;padding:6px 16px;background:#0D5A9C;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
                <i class="fas fa-redo"></i> Thử lại
            </button>
        </td></tr>`;
    }
}

function normalizeParticipant(p) {
    return {
        idDangKy:        p.idDangKy        ?? p.IdDangKy,
        idSuKien:        p.idSuKien        ?? p.IdSuKien,
        idNguoiDung:     p.idNguoiDung     ?? p.IdNguoiDung     ?? "",
        hoTen:           p.hoTenNguoiDung  ?? p.HoTenNguoiDung  ?? p.hoTen ?? "—",
        trangThai:       p.trangThai       ?? p.TrangThai       ?? "",
        thoiGianDangKy:  p.thoiGianDangKy  ?? p.ThoiGianDangKy,
        thoiGianCheckin: p.thoiGianCheckin ?? p.ThoiGianCheckin,
        thoiGianCheckout:p.thoiGianCheckout?? p.ThoiGianCheckout,
        tenSuKien:       p.tenSuKien       ?? p.TenSuKien       ?? ""
    };
}

// ================= RENDER TABLE =================
const AVATAR_COLORS = ["#0D5A9C","#1976D2","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function renderParticipantsTable(list) {
    const tbody = document.getElementById("participantsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#888;">
            <i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.3;"></i>
            Chưa có người đăng ký
        </td></tr>`;
        return;
    }

    // Pagination: hiển thị tối đa 20 bản ghi
    const PAGE_SIZE = 20;
    const displayed = list.slice(0, PAGE_SIZE);

    displayed.forEach(p => {
        const row = document.createElement("tr");

        // Initials: 2 chữ cái đầu họ tên
        const nameParts = (p.hoTen || "NA").trim().split(/\s+/);
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (p.hoTen || "NA").substring(0, 2).toUpperCase();
        const bgColor = getAvatarColor(p.hoTen);

        const statusClass = mapStatusClass(p.trangThai);
        const statusLabel = mapStatusLabel(p.trangThai);

        // Thời gian có mặt: ưu tiên checkin, fallback đăng ký
        let timeStr = "—";
        const checkTime = p.thoiGianCheckin || p.thoiGianDangKy;
        if (checkTime) {
            const d = new Date(checkTime);
            timeStr = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} ${d.getDate().toString().padStart(2,"0")}-${(d.getMonth()+1).toString().padStart(2,"0")}`;
        }

        // Nút thao tác
        let actions = "";
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const vaiTros = userData.vaiTros || [];
        const isTruongBan = vaiTros.includes("TruongBanToChuc");

        if (isTruongBan) {
            const lower = (p.trangThai || "").toLowerCase();
            if (lower.includes("chờ xác nhận") || lower === "chờ chỗ" || lower === "pending") {
                actions = `
                    <button class="btn-btc-approve" title="Xác nhận" onclick="approveRegistration('${escapeHtml(p.idNguoiDung)}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-btc-reject" title="Từ chối" onclick="rejectRegistration('${escapeHtml(p.idNguoiDung)}')">
                        <i class="fas fa-times"></i>
                    </button>`;
            }
        }

        row.innerHTML = `
            <td>
                <div class="participant-info">
                    <div class="participant-avatar" style="background:${bgColor};color:white;font-size:13px;font-weight:700;">${initials}</div>
                    <div class="participant-details">
                        <div class="participant-name">${escapeHtml(p.hoTen)}</div>
                        <div class="participant-department" style="color:#9CA3AF;font-size:12px;">Vé #${p.idDangKy}</div>
                    </div>
                </div>
            </td>
            <td style="color:#374151;font-weight:500;">${escapeHtml(p.idNguoiDung || "—")}</td>
            <td style="color:#374151;">${timeStr}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>`;
        tbody.appendChild(row);
    });

    // Cập nhật pagination info
    const infoEl = document.querySelector(".pagination-info");
    if (infoEl) {
        const start = list.length > 0 ? 1 : 0;
        const end = Math.min(PAGE_SIZE, list.length);
        infoEl.textContent = `Đang hiển thị ${start}-${end} trên số ${list.length} người tham gia`;
    }
}

function mapStatusLabel(trangThai) {
    if (!trangThai) return "—";
    const lower = trangThai.toLowerCase();
    if (lower.includes("đã tham") || lower.includes("có mặt")) return "Đã tham gia";
    if (lower.includes("xác nhận") && !lower.includes("chờ")) return "Đã xác nhận";
    if (lower.includes("chờ xác nhận")) return "Chờ xác nhận";
    if (lower.includes("chờ chỗ") || lower === "chờ người dùng xác nhận") return "Chờ chỗ";
    if (lower.includes("vắng")) return "Vắng mặt";
    if (lower.includes("hủy")) return "Đã hủy";
    return trangThai;
}

function mapStatusClass(trangThai) {
    if (!trangThai) return "";
    const lower = trangThai.toLowerCase();
    if (lower.includes("đã tham") || lower.includes("có mặt")) return "present";
    if (lower.includes("xác nhận") && !lower.includes("chờ")) return "confirmed";
    if (lower.includes("chờ xác nhận") || lower.includes("chờ chỗ") || lower === "pending") return "pending";
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
    const colors = { success: "#059669", error: "#EF4444", info: "#0D5A9C" };
    const icons  = { success: "check-circle", error: "times-circle", info: "info-circle" };
    const bg = colors[type] || colors.info;
    const icon = icons[type] || icons.info;

    // Xóa toast cũ
    document.querySelectorAll(".btc-toast").forEach(t => t.remove());

    const toast = document.createElement("div");
    toast.className = "btc-toast";
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
        background:${bg};color:white;padding:12px 18px;border-radius:10px;
        font-size:14px;font-weight:600;max-width:320px;display:flex;align-items:center;gap:10px;
        box-shadow:0 4px 16px rgba(0,0,0,.25);animation:slideIn .3s ease;`;
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
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
    
    // Hide UI components for Member BTC
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const vaiTros = userData.vaiTros || [];
    const isTruongBan = vaiTros.includes("TruongBanToChuc");
    if (!isTruongBan) {
        // Hide Excel/CSV buttons (header-actions)
        const actionsDiv = document.querySelector(".header-actions");
        if (actionsDiv) actionsDiv.style.display = "none";

        // Hide QR check-in input card (the parent element containing qrTokenInput)
        const qrInput = document.getElementById("qrTokenInput");
        if (qrInput) {
            const qrCard = qrInput.closest(".card");
            if (qrCard) qrCard.style.display = "none";
        }
    }

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