// CTSV Reports JavaScript

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});

// Initialize all charts
function initializeCharts() {
    createEventTrendChart();
    createEventTypeChart();
    createBudgetChart();
    createApprovalTimeChart();
}

// Event Trend Chart (Line Chart)
function createEventTrendChart() {
    const ctx = document.getElementById('eventTrendChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            datasets: [
                {
                    label: 'Đã duyệt',
                    data: [8, 12, 10, 15, 11, 14, 13, 16, 12, 18, 15, 17],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Từ chối',
                    data: [2, 1, 3, 2, 2, 1, 2, 1, 3, 2, 1, 2],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' sự kiện';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Event Type Chart (Doughnut Chart)
function createEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hội thảo', 'Workshop', 'Thi đấu', 'Văn nghệ'],
            datasets: [{
                data: [42, 35, 28, 22],
                backgroundColor: [
                    '#3B82F6',
                    '#8B5CF6',
                    '#F59E0B',
                    '#EC4899'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 13
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Budget Chart (Bar Chart)
function createBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo', 'Workshop', 'Thi đấu', 'Văn nghệ'],
            datasets: [{
                label: 'Ngân sách (tỷ đồng)',
                data: [4.2, 2.1, 3.36, 2.84],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderColor: [
                    '#3B82F6',
                    '#8B5CF6',
                    '#F59E0B',
                    '#EC4899'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Ngân sách: ' + context.parsed.y + ' tỷ đồng';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' tỷ';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Approval Time Chart (Horizontal Bar Chart)
function createApprovalTimeChart() {
    const ctx = document.getElementById('approvalTimeChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hội thảo', 'Workshop', 'Thi đấu', 'Văn nghệ'],
            datasets: [{
                label: 'Thời gian (giờ)',
                data: [2.8, 2.2, 2.5, 2.6],
                backgroundColor: 'rgba(5, 150, 105, 0.8)',
                borderColor: '#059669',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Thời gian: ' + context.parsed.x + ' giờ';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Change Period
function changePeriod() {
    const period = document.getElementById('periodSelect').value;
    console.log('Changing period to:', period);
    
    // In real implementation, reload data based on selected period
    alert('Đang tải dữ liệu cho kỳ: ' + period);
    
    // Reload charts with new data
    // initializeCharts();
}

// Export Report
function exportReport() {
    console.log('Exporting report to Excel');
    alert('Đang xuất báo cáo ra file Excel...');
    
    // In real implementation, call API to generate Excel file
}

// Print Report
function printReport() {
    console.log('Printing report');
    window.print();
}

// Format number with thousand separator
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format currency
function formatCurrency(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + ' tỷ';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + ' triệu';
    } else {
        return formatNumber(num);
    }
}

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
        
        // In real implementation, filter data based on search term
    });
}

// Animate numbers on scroll
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = formatNumber(value);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Observe stat cards and animate when visible
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                const text = statNumber.textContent;
                const number = parseInt(text.replace(/[^0-9]/g, ''));
                if (!isNaN(number)) {
                    statNumber.textContent = '0';
                    animateValue(statNumber, 0, number, 1000);
                }
            }
        }
    });
}, observerOptions);

// Observe all stat cards
document.querySelectorAll('.stat-card').forEach(card => {
    observer.observe(card);
});
