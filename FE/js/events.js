// Events Page JavaScript

const API_BASE = "https://localhost:7160/api";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function () {
    initializeFilters();
    initializeStatusButtons();
    initializeEventCards();   // bind click cho card HTML tĩnh
    initializePagination();
});

// ================= FILTER =================
function initializeFilters() {
    const applyFilterBtn = document.querySelector(".btn-apply-filter");
    if (!applyFilterBtn) return;

    applyFilterBtn.addEventListener("click", async function () {
        const status = document.querySelector(".status-btn.active")?.dataset.status || "";
        await loadEvents({ status });
    });

    // Tìm kiếm realtime
    const searchInput = document.querySelector(".search-box input");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            filterCardsLocally(this.value.trim().toLowerCase());
        });
    }
}

function filterCardsLocally(keyword) {
    document.querySelectorAll(".event-card").forEach(card => {
        const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const desc = card.querySelector(".event-description")?.textContent.toLowerCase() || "";
        card.style.display = (title.includes(keyword) || desc.includes(keyword)) ? "" : "none";
    });
}

// ================= LOAD EVENTS TỪ API =================
async function loadEvents(filters = {}) {
    const token = localStorage.getItem("token");
    try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/SuKien?${query}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const events = Array.isArray(data) ? data : (data.data || data.items || []);
        renderEvents(events);
    } catch (e) {
        console.error("Lỗi load sự kiện:", e);
    }
}

// ================= STATUS BUTTONS =================
function initializeStatusButtons() {
    document.querySelectorAll(".status-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
        });
    });
}

// ================= BIND CLICK CHO CARD HTML TĨNH =================
function initializeEventCards() {
    // Nút "Đăng ký ngay" trong card tĩnh — lấy id từ data-id hoặc từ tiêu đề
    document.querySelectorAll(".btn-primary").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            const card = this.closest(".event-card");
            const eventId = card?.dataset.id;
            if (eventId) {
                window.location.href = `event-detail.html?id=${eventId}`;
            } else {
                // Card tĩnh chưa có data-id → vào trang events để xem
                window.location.href = "events.html";
            }
        });
    });

    // Click vào card → xem chi tiết
    document.querySelectorAll(".event-card").forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", function (e) {
            if (e.target.closest("button")) return;
            const eventId = this.dataset.id;
            if (eventId) {
                window.location.href = `event-detail.html?id=${eventId}`;
            }
        });
    });

    // Nút "Nhận thông báo khi được duyệt"
    document.querySelectorAll(".btn-notify").forEach(btn => {
        btn.addEventListener("click", async function (e) {
            e.stopPropagation();
            const card = this.closest(".event-card");
            const eventId = card?.dataset.id;
            if (!eventId) return;
            const token = localStorage.getItem("token");
            try {
                await fetch(`${API_BASE}/SuKien/${eventId}/notify`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                this.innerHTML = '<i class="fas fa-check"></i> Đã đăng ký nhận thông báo';
                this.disabled = true;
            } catch (err) {
                console.error("Lỗi đăng ký thông báo:", err);
            }
        });
    });
}

// ================= PAGINATION =================
function initializePagination() {
    document.querySelectorAll(".page-btn").forEach(btn => {
        btn.addEventListener("click", async function () {
            if (this.classList.contains("active")) return;
            const page = this.dataset.page;
            document.querySelectorAll(".page-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            await loadEvents({ page });
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
}

// ================= RENDER EVENTS TỪ API =================
function renderEvents(events) {
    const container = document.querySelector(".events-section");
    if (!container) return;

    // Xóa các card cũ (giữ lại section-header và pagination)
    container.querySelectorAll(".event-card").forEach(c => c.remove());

    const pagination = container.querySelector(".pagination");

    if (!events || events.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "text-align:center;padding:40px;color:#666;";
        empty.textContent = "Không có sự kiện nào phù hợp.";
        container.insertBefore(empty, pagination);
        return;
    }

    // Cập nhật số kết quả
    const countEl = container.querySelector(".results-count");
    if (countEl) countEl.textContent = `Kết quả: ${events.length} sự kiện`;

    events.forEach(event => {
        const startDate = event.thoiGianBatDau
            ? new Date(event.thoiGianBatDau).toLocaleDateString("vi-VN")
            : "Chưa có";
        const diaDiem = event.tenDiaDiem || event.diaDiem?.tenDiaDiem || "Đang cập nhật";
        const trangThai = event.trangThai || "Sự kiện";
        const soLuong = event.soLuongToiDa ? `Tối đa: ${event.soLuongToiDa} SV` : "";

        const card = document.createElement("div");
        card.className = "event-card";
        card.dataset.id = event.idSuKien;
        card.style.cursor = "pointer";

        const canRegister = trangThai === "Đã duyệt";
        const actionBtn = canRegister
            ? `<button class="btn-primary" data-id="${event.idSuKien}" onclick="window.location.href='register-event.html?id=${event.idSuKien}'">Đăng ký ngay</button>`
            : `<button class="btn-notify" data-id="${event.idSuKien}"><i class="fas fa-bell"></i> Nhận thông báo khi được duyệt</button>`;

        card.innerHTML = `
            <div class="event-image">
                <img src="../images/event1.png" alt="${escapeHtml(event.tenSuKien)}" onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=Event'">
                <span class="event-badge">${escapeHtml(trangThai)}</span>
            </div>
            <div class="event-content">
                <div class="event-header">
                    <h3>${escapeHtml(event.tenSuKien || "Chưa có tên")}</h3>
                    <span class="event-date-badge">${startDate}</span>
                </div>
                <p class="event-description">${escapeHtml(event.moTa || "")}</p>
                <div class="event-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(diaDiem)}</span>
                    ${soLuong ? `<span><i class="fas fa-users"></i> ${soLuong}</span>` : ""}
                    <span><i class="fas fa-building"></i> ${escapeHtml(trangThai)}</span>
                </div>
                <div class="event-actions">
                    <button class="btn-secondary" onclick="window.location.href='event-detail.html?id=${event.idSuKien}'">Xem chi tiết</button>
                    ${actionBtn}
                </div>
            </div>`;

        if (pagination) {
            container.insertBefore(card, pagination);
        } else {
            container.appendChild(card);
        }
    });

    // Re-bind sau khi render
    initializeEventCards();
}

// ================= HELPERS =================
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}