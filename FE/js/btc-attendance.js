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
let localFailedActivities = []; // Store temporary failed check-ins during the current session

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
        // Load đầy đủ tất cả sự kiện từ SQL để đồng nhất dữ liệu
        let url = `${window.API_BASE}/SuKien`;

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
            localFailedActivities = []; // Reset local activity logs for new event
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
        const raw = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);
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
        renderActivityList();
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

    // Check if the user is TruongBanToChuc
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const vaiTros = userData.vaiTros || [];
    const isTruongBan = vaiTros.includes("TruongBanToChuc");

    // Dynamically adjust table headers
    const thead = document.querySelector(".participants-table thead tr");
    if (thead) {
        if (isTruongBan) {
            thead.innerHTML = `
                <th style="width: 40px; text-align: center; vertical-align: middle;">
                    <input type="checkbox" id="selectAllParticipants" onchange="toggleSelectAllParticipants(this)" style="width:16px;height:16px;cursor:pointer;">
                </th>
                <th>NGƯỜI THAM GIA</th>
                <th>MÃ SỐ ID</th>
                <th>THỜI GIAN CÓ MẶT</th>
                <th>TRẠNG THÁI</th>
                <th style="text-align: center;">THAO TÁC</th>
            `;
        } else {
            thead.innerHTML = `
                <th>NGƯỜI THAM GIA</th>
                <th>MÃ SỐ ID</th>
                <th>THỜI GIAN CÓ MẶT</th>
                <th>TRẠNG THÁI</th>
            `;
        }
    }

    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="${isTruongBan ? 6 : 4}" style="text-align:center;padding:32px;color:#888;">
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
        const lower = (p.trangThai || "").toLowerCase();
        const canApprove = lower.includes("chờ xác nhận") || lower === "chờ chỗ" || lower === "pending";

        if (isTruongBan) {
            if (canApprove) {
                actions = `
                    <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                        <button class="btn-btc-approve" title="Xác nhận" onclick="approveRegistration('${escapeHtml(p.idNguoiDung)}')" style="padding:6px 10px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; justify-content:center;">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-btc-reject" title="Từ chối" onclick="rejectRegistration('${escapeHtml(p.idNguoiDung)}')" style="padding:6px 10px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; justify-content:center;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>`;
            } else {
                actions = `<span style="color:#9ca3af; font-size:12px;">N/A</span>`;
            }
        }

        // Checkbox column
        const checkboxCol = isTruongBan
            ? `<td style="text-align: center; vertical-align: middle;">
                <input type="checkbox" class="participant-select" value="${escapeHtml(p.idNguoiDung)}" onchange="updateParticipantBulkUI()" style="width:16px;height:16px;cursor:pointer;" ${canApprove ? '' : 'disabled'}>
               </td>`
            : "";

        const actionsCol = isTruongBan
            ? `<td style="text-align: center; vertical-align: middle;">${actions}</td>`
            : "";

        row.innerHTML = `
            ${checkboxCol}
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
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            ${actionsCol}
        `;
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

    // Nếu người vận hành nhập dạng mã vé UTE-000006 thì tự chuyển sang QR tĩnh
    const ticketMatch = token.match(/^UTE-(\d+)$/i);
    if (ticketMatch && typeof TicketBiz !== "undefined") {
        token = TicketBiz.buildStaticQrPayload(parseInt(ticketMatch[1], 10));
    }

    try {
        const scanTimeMs = Date.now();
        const checkinPayload = { QrToken: token, ScanTimeMs: scanTimeMs };
        if (attendancePageData.selectedEventId) {
            checkinPayload.IdSuKien = parseInt(attendancePageData.selectedEventId, 10);
        }
        const res = await fetch(`${window.API_BASE}/DangKy/check-in-qr`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(checkinPayload)
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

function renderActivityList() {
    const listContainer = document.querySelector(".activity-list");
    if (!listContainer) return;

    // 1. Thu thập tất cả check-in / check-out từ dữ liệu thực tế trong SQL
    let sqlActivities = [];
    attendancePageData.participants.forEach(p => {
        if (p.thoiGianCheckin) {
            sqlActivities.push({
                hoTen: p.hoTen,
                idNguoiDung: p.idNguoiDung,
                time: new Date(p.thoiGianCheckin),
                type: "Check-in",
                status: "THÀNH CÔNG",
                isError: false
            });
        }
        if (p.thoiGianCheckout) {
            sqlActivities.push({
                hoTen: p.hoTen,
                idNguoiDung: p.idNguoiDung,
                time: new Date(p.thoiGianCheckout),
                type: "Check-out",
                status: "THÀNH CÔNG",
                isError: false
            });
        }
    });

    // 2. Gom chung với các lỗi quét thất bại gần đây trong session
    let allActivities = [...localFailedActivities, ...sqlActivities];

    // 3. Sắp xếp theo thời gian giảm dần
    allActivities.sort((a, b) => b.time - a.time);

    // 4. Lấy tối đa 8 hoạt động mới nhất
    const displayed = allActivities.slice(0, 8);

    // 5. Render ra HTML
    listContainer.innerHTML = "";
    if (displayed.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;padding:24px;color:#9CA3AF;font-size:13px;">Chưa có hoạt động check-in nào</div>`;
        return;
    }

    displayed.forEach(act => {
        // Chữ cái viết tắt
        const nameParts = (act.hoTen || "QR").trim().split(/\s+/);
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (act.hoTen || "QR").substring(0, 2).toUpperCase();

        const timeStr = act.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const dateStr = `${act.time.getDate().toString().padStart(2,"0")}/${(act.time.getMonth()+1).toString().padStart(2,"0")}`;

        const item = document.createElement("div");
        item.className = "activity-item";
        
        item.innerHTML = `
            <div class="activity-avatar" style="${act.isError ? 'background:#EF4444;color:white;' : 'background:#0D5A9C;color:white;font-weight:700;'}">${initials}</div>
            <div class="activity-info">
                <div class="activity-name" style="font-weight:600;color:#1e293b;">${escapeHtml(act.hoTen)}</div>
                <div class="activity-id" style="font-size:12px;color:#64748b;">
                    ${act.isError ? 'Quét thất bại' : `${act.type} • ID: ${escapeHtml(act.idNguoiDung)}`}
                </div>
            </div>
            <div class="activity-status-badge ${act.isError ? 'error' : 'success'}">
                <span>${timeStr} ${dateStr}</span>
                <span class="status-text">${act.status}</span>
            </div>`;
        listContainer.appendChild(item);
    });
}

function pushActivity(text, statusText) {
    if (statusText === "LỖI") {
        localFailedActivities.push({
            hoTen: text,
            idNguoiDung: "",
            time: new Date(),
            type: "Quét lỗi",
            status: "LỖI",
            isError: true
        });
    }
    renderActivityList();
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
    
    // Hide UI components for non-Leader BTC users (only Trưởng Ban Tổ chức has these permissions)
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
        if (e.key === "Enter") {
            checkInByQrToken(e.target.value);
        }
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

// ================= DUYỆT HÀNG LOẠT NGƯỜI THAM GIA =================

function toggleSelectAllParticipants(master) {
    document.querySelectorAll(".participant-select:not(:disabled)").forEach(cb => {
        cb.checked = master.checked;
    });
    updateParticipantBulkUI();
}

function updateParticipantBulkUI() {
    const checkedBoxes = document.querySelectorAll(".participant-select:checked");
    const container = document.querySelector(".event-actions");
    if (!container) return;

    // Check if bulk buttons already exist
    let bulkApproveBtn = document.getElementById("btnBulkApproveParticipants");
    let bulkRejectBtn = document.getElementById("btnBulkRejectParticipants");

    if (checkedBoxes.length > 0) {
        if (!bulkApproveBtn) {
            bulkApproveBtn = document.createElement("button");
            bulkApproveBtn.type = "button";
            bulkApproveBtn.id = "btnBulkApproveParticipants";
            bulkApproveBtn.className = "btn-btc-bulk-approve";
            bulkApproveBtn.style.cssText = "padding:8px 16px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:6px; margin-right:8px;";
            bulkApproveBtn.innerHTML = `<i class="fas fa-check-double"></i> Duyệt chọn (${checkedBoxes.length})`;
            bulkApproveBtn.onclick = confirmBulkApproveParticipants;
            container.insertBefore(bulkApproveBtn, container.firstChild);
        } else {
            bulkApproveBtn.innerHTML = `<i class="fas fa-check-double"></i> Duyệt chọn (${checkedBoxes.length})`;
        }

        if (!bulkRejectBtn) {
            bulkRejectBtn = document.createElement("button");
            bulkRejectBtn.type = "button";
            bulkRejectBtn.id = "btnBulkRejectParticipants";
            bulkRejectBtn.className = "btn-btc-bulk-reject";
            bulkRejectBtn.style.cssText = "padding:8px 16px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:6px; margin-right:8px;";
            bulkRejectBtn.innerHTML = `<i class="fas fa-times-circle"></i> Từ chối chọn (${checkedBoxes.length})`;
            bulkRejectBtn.onclick = confirmBulkRejectParticipants;
            container.insertBefore(bulkRejectBtn, bulkApproveBtn.nextSibling);
        } else {
            bulkRejectBtn.innerHTML = `<i class="fas fa-times-circle"></i> Từ chối chọn (${checkedBoxes.length})`;
        }
    } else {
        if (bulkApproveBtn) bulkApproveBtn.remove();
        if (bulkRejectBtn) bulkRejectBtn.remove();
    }
}

async function confirmBulkApproveParticipants() {
    const checkedBoxes = document.querySelectorAll(".participant-select:checked");
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    if (ids.length === 0) return;

    if (!confirm(`Bạn có chắc muốn duyệt/xác nhận điểm danh cho ${ids.length} người tham gia đã chọn?`)) return;

    const eventId = attendancePageData.selectedEventId;
    if (!eventId) return;

    let successCount = 0;
    let failCount = 0;

    for (const idNguoiDung of ids) {
        try {
            const res = await fetch(`${window.API_BASE}/DangKy/check-in`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ IdSuKien: parseInt(eventId, 10), IdNguoiDung: idNguoiDung })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success ?? data.Success) !== false) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (e) {
            failCount++;
        }
    }

    if (successCount > 0 && failCount === 0) {
        showBtcMessage(`✅ Đã phê duyệt điểm danh cho ${successCount} người tham gia!`, "success");
    } else if (successCount > 0) {
        showBtcMessage(`Đã duyệt ${successCount} người thành công, ${failCount} thất bại.`, "warning");
    } else {
        showBtcMessage("Duyệt hàng loạt thất bại.", "error");
    }

    // Reset select all checkbox
    const sa = document.getElementById("selectAllParticipants");
    if (sa) sa.checked = false;

    await loadEventDetailsAndAttendance();
}

async function confirmBulkRejectParticipants() {
    const checkedBoxes = document.querySelectorAll(".participant-select:checked");
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    if (ids.length === 0) return;

    if (!confirm(`Bạn có chắc muốn từ chối/hủy đăng ký cho ${ids.length} người tham gia đã chọn?`)) return;

    const eventId = attendancePageData.selectedEventId;
    if (!eventId) return;

    let successCount = 0;
    let failCount = 0;

    for (const idNguoiDung of ids) {
        try {
            const res = await fetch(`${window.API_BASE}/DangKy/huy-dang-ky`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ IdSuKien: parseInt(eventId, 10), IdNguoiDung: idNguoiDung })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success ?? data.Success) !== false) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (e) {
            failCount++;
        }
    }

    if (successCount > 0 && failCount === 0) {
        showBtcMessage(`✅ Đã hủy đăng ký cho ${successCount} người tham gia!`, "success");
    } else if (successCount > 0) {
        showBtcMessage(`Đã hủy ${successCount} người thành công, ${failCount} thất bại.`, "warning");
    } else {
        showBtcMessage("Hủy hàng loạt thất bại.", "error");
    }

    // Reset select all checkbox
    const sa = document.getElementById("selectAllParticipants");
    if (sa) sa.checked = false;

    await loadEventDetailsAndAttendance();
}

window.toggleSelectAllParticipants = toggleSelectAllParticipants;
window.updateParticipantBulkUI = updateParticipantBulkUI;
window.confirmBulkApproveParticipants = confirmBulkApproveParticipants;
window.confirmBulkRejectParticipants = confirmBulkRejectParticipants;