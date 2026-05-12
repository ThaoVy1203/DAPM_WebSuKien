// BGH Reports Page JavaScript

// Export report
function exportReport() {
    console.log('Exporting report...');
    alert('Đang xuất báo cáo...');
    // TODO: Implement export functionality
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    initApprovalTrendChart();
    initEventTypeChart();
    initBudgetChart();
    initProcessingTimeChart();
});

// Approval Trend Chart
function initApprovalTrendChart() {
    const ctx = document.getElementById('approvalTrendChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T7/2024', 'T8/2024', 'T9/2024', 'T10/2024', 'T11/2024', 'T12/2024'],
            datasets: [
                {
                    label: 'Đã duyệt',
                    data: [28, 32, 30, 35, 33, 35],
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Từ chối',
                    data: [5, 4, 6, 3, 4, 3],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

// Event Type Distribution Chart
function initEventTypeChart() {
    const ctx = document.getElementById('eventTypeChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hội thảo', 'Workshop', 'Thi đấu', 'Văn nghệ', 'Khác'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#f59e0b',
                    '#ec4899',
                    '#6b7280'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Budget Distribution Chart
function initBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 50tr', '50-100tr', '100-150tr', '150-200tr', '> 200tr'],
            datasets: [{
                label: 'Số lượng sự kiện',
                data: [8, 12, 10, 5, 3],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
}

// Processing Time Chart
function initProcessingTimeChart() {
    const ctx = document.getElementById('processingTimeChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['< 1h', '1-2h', '2-3h', '3-4h', '> 4h'],
            datasets: [{
                label: 'Số lượng hồ sơ',
                data: [5, 18, 10, 4, 1],
                backgroundColor: '#059669',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Period filter change
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('reportPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            console.log('Period changed to:', this.value);
            // TODO: Reload data based on selected period
        });
    }
});
