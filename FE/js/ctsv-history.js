// CTSV Approval History JavaScript

const API_BASE = "https://localhost:7160/api";

let currentPage = 1;
let currentStatus = "all";

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    initializeFilterTabs();
    initializeFilters();
    initializeSearch();
    initializePagination();

    await loadHistory();
});

// ==================== LOAD DATA ====================

async function loadHistory(page = 1) {
    try {
        const month = document.getElementById('monthFilter')?.value || "";
        const eventType = document.getElementById('eventTypeFilter')?.value || "";
        const search = document.querySelector('.search-bar input')?.value || "";

        const response = await fetch(
            `${API_BASE}/approval-history?page=${page}&status=${currentStatus}&month=${month}&eventType=${eventType}&search=${search}`
        );

        const data = await response.json();

        renderHistory(data.items);
        renderPagination(data.totalPages);

        currentPage = page;

    } catch (error) {
        console.error("Error loading approval history:", error);
    }
}

function renderHistory(items) {
    const container = document.getElementById('historyList');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="history-item" data-id="${item.id}" data-status="${item.status}">
            <div class="history-header">
                <h3>${item.name}</h3>
                <span class="history-id">${item.code}</span>
            </div>

            <div class="history-body">
                <p>Loại: ${item.eventType}</p>
                <p>Ngày xử lý: ${item.processedDate}</p>
                <p>Trạng thái: 
                    <span class="status ${item.status}">
                        ${item.statusText}
                    </span>
                </p>
            </div>

            <button onclick="viewHistoryDetail(${item.id})">
                Xem chi tiết
            </button>
        </div>
    `).join('');
}

// ==================== FILTER TABS ====================

function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', async function () {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            currentStatus = this.getAttribute('data-filter');

            await loadHistory(1);
        });
    });
}

// ==================== FILTERS ====================

function initializeFilters() {
    document.getElementById('monthFilter')
        ?.addEventListener('change', () => loadHistory(1));

    document.getElementById('eventTypeFilter')
        ?.addEventListener('change', () => loadHistory(1));
}

// ==================== SEARCH ====================

function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadHistory(1);
        }, 500));
    }
}

// ==================== DETAIL ====================

async function viewHistoryDetail(historyId) {
    try {
        const response = await fetch(`${API_BASE}/approval-history/${historyId}`);
        const detail = await response.json();

        alert(`
ID: ${detail.code}
Tên: ${detail.name}
Trạng thái: ${detail.statusText}
Người xử lý: ${detail.processedBy}
Ngày xử lý: ${detail.processedDate}
Ghi chú: ${detail.note || "Không có"}
        `);

    } catch (error) {
        console.error("Error loading detail:", error);
    }
}

// ==================== EXPORT ====================

async function exportHistory() {
    window.open(`${API_BASE}/approval-history/export`, "_blank");
}

// ==================== PAGINATION ====================

function initializePagination() {
    document.addEventListener('click', async function (e) {
        if (e.target.classList.contains('page-btn')) {
            const page = parseInt(e.target.dataset.page);

            if (!isNaN(page)) {
                await loadHistory(page);
            }
        }
    });
}

function renderPagination(totalPages) {
    const container = document.querySelector('.pagination');
    if (!container) return;

    let html = '';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    container.innerHTML = html;
}

// ==================== HELPERS ====================

function debounce(func, delay) {
    let timeout;

    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}