// js/event-detail.js
const API_BASE = "https://localhost:7160/api";

// ── Lấy id sự kiện từ URL ──────────────────────────────────────────
function getEventId() {
    return new URLSearchParams(window.location.search).get("id");
}

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
    const eventId = getEventId();
    if (!eventId) {
        showError("Không tìm thấy sự kiện. Vui lòng quay lại danh sách sự kiện.");
        return;
    }

    await loadEventDetail(eventId);
    prefillUserInfo();
    initRegisterBtn(eventId);
    initSubmitQuestion(eventId);
    initSmoothScroll();
});

// ── LOAD CHI TIẾT SỰ KIỆN ─────────────────────────────────────────
async function loadEventDetail(eventId) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/SuKien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const event = await res.json();
        renderEventDetail(event);

    } catch (e) {
        console.error("Lỗi load chi tiết sự kiện:", e);
        // Không xóa nội dung tĩnh — chỉ log lỗi
    }
}

function renderEventDetail(event) {
    if (!event) return;

    // Tiêu đề trang (tab trình duyệt)
    const title = event.tenSuKien || "Chi tiết sự kiện";
    document.title = `${title} - UTE Events`;
    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl) pageTitleEl.textContent = `${title} - UTE Events`;

    // Hero title
    setText("eventTitle", title);

    // Mô tả
    setText("eventDescription", event.moTa || "");

    // Ngày giờ
    if (event.thoiGianBatDau) {
        const start = new Date(event.thoiGianBatDau);
        const end = event.thoiGianKetThuc ? new Date(event.thoiGianKetThuc) : null;

        setText("eventDate", start.toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        }));

        const timeStr = end
            ? `${formatTime(start)} - ${formatTime(end)}`
            : formatTime(start);
        setText("eventTime", timeStr);
    }

    // Địa điểm
    const diaDiem = event.tenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";
    setText("eventLocation", diaDiem);

    // Trạng thái badge
    const trangThai = event.trangThai || "";
    setText("eventStatus", trangThai || "SẮP DIỄN RA");

    // Số đã đăng ký / sức chứa
    const soDaDangKy = event.soDaDangKy ?? event.soLuongDaDangKy ?? "-";
    const soLuongToiDa = event.soLuongToiDa ?? "-";

    setText("registeredCount", `Đã có ${soDaDangKy} đăng ký`);
    setText("statRegistered", soDaDangKy);
    setText("statCapacity", soLuongToiDa !== "-" ? `${soDaDangKy}/${soLuongToiDa}` : "-");
    setText("statStatus", trangThai || "-");

    // Slot còn trống
    if (soLuongToiDa !== "-" && soDaDangKy !== "-") {
        const con = soLuongToiDa - soDaDangKy;
        setText("eventSlot", con > 0 ? `CÒN ${con} CHỖ` : "HẾT CHỖ");
    }
}

// ── ĐIỀN THÔNG TIN NGƯỜI DÙNG VÀO FORM ───────────────────────────
function prefillUserInfo() {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
        const user = JSON.parse(raw);
        setVal("regName", user.hoTen || "");
        setVal("regMSSV", user.maSoSSO || "");
        setVal("regEmail", user.email || "");
    } catch (e) { /* bỏ qua */ }
}

// ── ĐĂNG KÝ SỰ KIỆN ──────────────────────────────────────────────
function initRegisterBtn(eventId) {
    const btn = document.getElementById("btnRegister");
    if (!btn) return;

    btn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        // Lấy idNguoiDung từ userData
        const raw = localStorage.getItem("userData");
        if (!raw) {
            showRegisterResult("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.", false);
            return;
        }
        const user = JSON.parse(raw);
        const idNguoiDung = user.idNguoiDung || user.id;

        if (!idNguoiDung) {
            showRegisterResult("Không xác định được tài khoản. Vui lòng đăng nhập lại.", false);
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang xử lý...";

        try {
            const res = await fetch(`${API_BASE}/DangKySuKien`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    idSuKien: parseInt(eventId),
                    idNguoiDung: idNguoiDung
                })
            });

            const data = await res.json();

            if (res.ok && (data.success !== false)) {
                showRegisterResult("Đăng ký thành công! Vui lòng check-in đúng giờ.", true);
                btn.textContent = "ĐÃ ĐĂNG KÝ";
                // Cập nhật lại số đăng ký
                await loadEventDetail(eventId);
            } else {
                showRegisterResult(data.message || "Đăng ký thất bại. Vui lòng thử lại.", false);
                btn.disabled = false;
                btn.textContent = "ĐĂNG KÝ NGAY";
            }

        } catch (e) {
            console.error("Lỗi đăng ký:", e);
            showRegisterResult("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.", false);
            btn.disabled = false;
            btn.textContent = "ĐĂNG KÝ NGAY";
        }
    });
}

function showRegisterResult(msg, success) {
    const el = document.getElementById("registerResult");
    if (!el) return;
    el.style.display = "block";
    el.style.background = success ? "#f0fff4" : "#fff5f5";
    el.style.color = success ? "#276749" : "#c53030";
    el.style.border = `1px solid ${success ? "#9ae6b4" : "#feb2b2"}`;
    el.textContent = msg;
}

// ── GỬI CÂU HỎI ──────────────────────────────────────────────────
function initSubmitQuestion(eventId) {
    const btn = document.getElementById("btnSubmitQuestion");
    if (!btn) return;

    btn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        const textarea = document.getElementById("qaTextarea");
        const question = textarea ? textarea.value.trim() : "";

        if (!question) {
            showQAResult("Vui lòng nhập câu hỏi trước khi gửi.", false);
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang gửi...";

        try {
            const res = await fetch(`${API_BASE}/SuKien/${eventId}/CauHoi`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ noiDung: question })
            });

            if (res.ok) {
                showQAResult("Câu hỏi đã được gửi thành công!", true);
                if (textarea) textarea.value = "";
            } else {
                const data = await res.json().catch(() => ({}));
                showQAResult(data.message || "Gửi câu hỏi thất bại. Vui lòng thử lại.", false);
            }

        } catch (e) {
            console.error("Lỗi gửi câu hỏi:", e);
            showQAResult("Không thể kết nối đến máy chủ.", false);
        } finally {
            btn.disabled = false;
            btn.textContent = "Gửi câu hỏi";
        }
    });
}

function showQAResult(msg, success) {
    const el = document.getElementById("qaResult");
    if (!el) return;
    el.style.display = "block";
    el.style.background = success ? "#f0fff4" : "#fff5f5";
    el.style.color = success ? "#276749" : "#c53030";
    el.style.border = `1px solid ${success ? "#9ae6b4" : "#feb2b2"}`;
    el.textContent = msg;
    setTimeout(() => { el.style.display = "none"; }, 4000);
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────────
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", function (e) {
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

// ── HELPERS ───────────────────────────────────────────────────────
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function formatTime(date) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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
