// Events Management JavaScript
const API_BASE = "https://localhost:7160/api";

let currentEventId = null;
let eventsData = [];
let locationsData = [];

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    await loadEvents();
    await loadLocations();

    initializeFilterTabs();
    initializeBudgetCalculation();
    renderEvents();
});

// ==========================
// LOAD API
// ==========================
async function loadEvents() {
    try {
        const res = await fetch(`${API_BASE}/SuKien`);
        eventsData = await res.json();
    } catch (error) {
        console.error("Lỗi load sự kiện:", error);
        alert("Không kết nối được backend");
    }
}

async function loadLocations() {
    try {
        const res = await fetch(`${API_BASE}/DiaDiem`);
        locationsData = await res.json();
        renderLocationOptions();
    } catch (error) {
        console.error("Lỗi load địa điểm:", error);
    }
}

// ==========================
// RENDER
// ==========================
function renderEvents(filtered = eventsData) {
    const container = document.querySelector(".events-container");
    if (!container) return;

    container.innerHTML = "";

    filtered.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.setAttribute("data-status", event.trangThai);
        card.setAttribute("data-event-id", event.id);

        card.innerHTML = `
            <h3>${event.tenSuKien}</h3>
            <p>${event.moTa || ""}</p>
            <p><strong>Ngày:</strong> ${formatDate(event.ngayToChuc)}</p>
            <p><strong>Địa điểm:</strong> ${event.diaDiemTen || "-"}</p>

            <div class="event-actions">
                <button onclick="openViewEventModal(${event.id})">Xem</button>
                <button onclick="openEditEventModal(${event.id})">Sửa</button>
                <button onclick="confirmCancelEvent(${event.id})">Hủy</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderLocationOptions() {
    const select = document.getElementById("eventLocation");
    if (!select) return;

    select.innerHTML = "";

    locationsData.forEach(location => {
        const option = document.createElement("option");
        option.value = location.id;
        option.textContent = location.tenDiaDiem;
        select.appendChild(option);
    });
}

// ==========================
// FILTER
// ==========================
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabButtons.forEach(button => {
        button.addEventListener("click", function () {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const status = this.dataset.status;

            if (status === "all") {
                renderEvents();
            } else {
                renderEvents(eventsData.filter(e => e.trangThai === status));
            }
        });
    });
}

// ==========================
// CRUD
// ==========================
async function loadEventData(eventId) {
    try {
        const res = await fetch(`${API_BASE}/SuKien/${eventId}`);
        const event = await res.json();

        document.getElementById("eventName").value = event.tenSuKien;
        document.getElementById("eventCategory").value = event.loaiSuKien;
        document.getElementById("eventLocation").value = event.diaDiemId;
        document.getElementById("eventDate").value = event.ngayToChuc?.split("T")[0];
        document.getElementById("eventTime").value = event.gioToChuc;
        document.getElementById("eventDescription").value = event.moTa || "";

    } catch (error) {
        console.error("Lỗi load event detail:", error);
    }
}

async function saveEvent(formData) {
    const method = currentEventId ? "PUT" : "POST";
    const url = currentEventId
        ? `${API_BASE}/SuKien/${currentEventId}`
        : `${API_BASE}/SuKien`;

    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert(currentEventId
                ? "Cập nhật sự kiện thành công"
                : "Tạo sự kiện thành công");

            closeEventModal();
            await loadEvents();
            renderEvents();
        } else {
            alert("Lưu sự kiện thất bại");
        }

    } catch (error) {
        console.error(error);
        alert("Lỗi backend");
    }
}

async function cancelEvent() {
    const reason = document.getElementById("cancelReason").value;

    if (!reason.trim()) {
        alert("Nhập lý do hủy");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/SuKien/${currentEventId}/cancel`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        });

        if (res.ok) {
            alert("Đã hủy sự kiện");
            closeConfirmModal();
            await loadEvents();
            renderEvents();
        }

    } catch (error) {
        console.error(error);
    }
}

// ==========================
// FORM SUBMIT
// ==========================
document.getElementById("eventForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
        tenSuKien: document.getElementById("eventName").value,
        loaiSuKien: document.getElementById("eventCategory").value,
        diaDiemId: document.getElementById("eventLocation").value,
        ngayToChuc: document.getElementById("eventDate").value,
        gioToChuc: document.getElementById("eventTime").value,
        moTa: document.getElementById("eventDescription").value
    };

    await saveEvent(formData);
});

// ==========================
// HELPERS
// ==========================
function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
}