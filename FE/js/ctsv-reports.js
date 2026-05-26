// CTSV Reports JavaScript

const API_BASE = "https://localhost:7160/api";

let charts = {};

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
    await loadDashboardData();

    const periodSelect = document.getElementById("periodSelect");
    if (periodSelect) {
        periodSelect.addEventListener("change", changePeriod);
    }

    initializeSearch();
    initializeStatObserver();
});

// ====================== API ======================

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}

async function loadDashboardData(period = "year") {
    const data = await fetchAPI(`/reports/dashboard?period=${period}`);

    if (!data) {
        console.warn("Không load được dữ liệu");
        return;
    }

    updateStats(data.stats);
    initializeCharts(data.charts);
}

// ====================== STATS ======================

function updateStats(stats) {
    document.querySelector("#totalEvents")?.textContent = formatNumber(stats.totalEvents || 0);
    document.querySelector("#approvedEvents")?.textContent = formatNumber(stats.approved || 0);
    document.querySelector("#rejectedEvents")?.textContent = formatNumber(stats.rejected || 0);
    document.querySelector("#totalBudget")?.textContent = formatCurrency(stats.budget || 0);
}

// ====================== CHARTS ======================

function initializeCharts(chartData) {
    destroyCharts();

    createEventTrendChart(chartData.eventTrend);
    createEventTypeChart(chartData.eventType);
    createBudgetChart(chartData.budget);
    createApprovalTimeChart(chartData.approvalTime);
}

function destroyCharts() {
    Object.values(charts).forEach(chart => chart?.destroy());
}

function createEventTrendChart(data) {
    const ctx = document.getElementById("eventTrendChart");
    if (!ctx) return;

    charts.eventTrend = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "Đã duyệt",
                    data: data.approved,
                    borderColor: "#10B981",
                    backgroundColor: "rgba(16,185,129,0.1)",
                    tension: 0.4,
                    fill: true
                },
                {
                    label: "Từ chối",
                    data: data.rejected,
                    borderColor: "#EF4444",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createEventTypeChart(data) {
    const ctx = document.getElementById("eventTypeChart");
    if (!ctx) return;

    charts.eventType = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    "#3B82F6",
                    "#8B5CF6",
                    "#F59E0B",
                    "#EC4899"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createBudgetChart(data) {
    const ctx = document.getElementById("budgetChart");
    if (!ctx) return;

    charts.budget = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Ngân sách",
                data: data.values,
                backgroundColor: "rgba(59,130,246,0.8)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createApprovalTimeChart(data) {
    const ctx = document.getElementById("approvalTimeChart");
    if (!ctx) return;

    charts.approvalTime = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Giờ",
                data: data.values,
                backgroundColor: "rgba(5,150,105,0.8)"
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ====================== ACTIONS ======================

async function changePeriod() {
    const period = document.getElementById("periodSelect").value;
    await loadDashboardData(period);
}

async function exportReport() {
    window.open(`${API_BASE}/reports/export`, "_blank");
}

function printReport() {
    window.print();
}

// ====================== SEARCH ======================

function initializeSearch() {
    const searchInput = document.querySelector(".search-bar input");

    if (!searchInput) return;

    searchInput.addEventListener("input", async function (e) {
        const keyword = e.target.value.trim();

        if (!keyword) {
            await loadDashboardData();
            return;
        }

        const data = await fetchAPI(`/reports/search?q=${encodeURIComponent(keyword)}`);

        if (data) {
            initializeCharts(data.charts);
            updateStats(data.stats);
        }
    });
}

// ====================== FORMAT ======================

function formatNumber(num) {
    return num.toLocaleString("vi-VN");
}

function formatCurrency(num) {
    return num.toLocaleString("vi-VN") + " đ";
}

// ====================== ANIMATION ======================

function animateValue(element, start, end, duration) {
    let startTimestamp = null;

    const step = timestamp => {
        if (!startTimestamp) startTimestamp = timestamp;

        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);

        element.textContent = formatNumber(value);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}

function initializeStatObserver() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector(".stat-number");

                if (statNumber && !statNumber.classList.contains("animated")) {
                    statNumber.classList.add("animated");

                    const number = parseInt(statNumber.textContent.replace(/\D/g, ""));
                    statNumber.textContent = "0";

                    animateValue(statNumber, 0, number, 1000);
                }
            }
        });
    }, {
        threshold: 0.5
    });

    document.querySelectorAll(".stat-card").forEach(card => observer.observe(card));
}