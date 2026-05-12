// Admin Dashboard JavaScript

// Export report
function exportReport() {
    console.log('Exporting report...');
    alert('Đang xuất báo cáo...');
    // TODO: Implement export functionality
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    initUserGrowthChart();
    initEventStatusChart();
    
    // Time period filter
    const periodSelect = document.getElementById('timePeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            console.log('Period changed to:', this.value);
            // TODO: Reload data based on selected period
        });
    }
});

// User Growth Chart
function initUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T7/2024', 'T8/2024', 'T9/2024', 'T10/2024', 'T11/2024', 'T12/2024'],
            datasets: [
                {
                    label: 'Người dùng mới',
                    data: [35, 42, 38, 45, 48, 45],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
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

// Event Status Chart
function initEventStatusChart() {
    const ctx = document.getElementById('eventStatusChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đã duyệt', 'Chờ duyệt', 'Từ chối', 'Đang diễn ra'],
            datasets: [{
                data: [85, 12, 8, 15],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#3b82f6'
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
