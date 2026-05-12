// CTSV Approval History JavaScript

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFilterTabs();
    initializeFilters();
});

// Filter Tabs
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const historyItems = document.querySelectorAll('.history-item');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-filter');

            historyItems.forEach(item => {
                if (filterType === 'all') {
                    item.style.display = 'block';
                } else {
                    const itemStatus = item.getAttribute('data-status');
                    item.style.display = itemStatus === filterType ? 'block' : 'none';
                }
            });
        });
    });
}

// Initialize Filters
function initializeFilters() {
    const monthFilter = document.getElementById('monthFilter');
    const eventTypeFilter = document.getElementById('eventTypeFilter');

    if (monthFilter) {
        monthFilter.addEventListener('change', applyFilters);
    }

    if (eventTypeFilter) {
        eventTypeFilter.addEventListener('change', applyFilters);
    }
}

// Apply Filters
function applyFilters() {
    const month = document.getElementById('monthFilter').value;
    const eventType = document.getElementById('eventTypeFilter').value;

    console.log('Applying filters:', { month, eventType });

    // In real implementation, this would filter the history items
    // For now, just log the filter values
    alert(`Đang lọc theo:\nThời gian: ${month}\nLoại sự kiện: ${eventType}`);
}

// Export History
function exportHistory() {
    console.log('Exporting approval history');
    alert('Đang xuất báo cáo lịch sử phê duyệt...');
    
    // In real implementation, call API to generate Excel/PDF file
}

// View History Detail
function viewHistoryDetail(historyId) {
    console.log('Viewing history detail:', historyId);
    
    // Get history info (mock data)
    const historyInfo = getHistoryInfo(historyId);
    
    // In real implementation, open a detail modal or navigate to detail page
    alert(`Xem chi tiết hồ sơ:\n\nID: ${historyInfo.id}\nTên: ${historyInfo.name}\nTrạng thái: ${historyInfo.status}`);
}

// Get History Info (Mock Data)
function getHistoryInfo(historyId) {
    const mockData = {
        1: {
            id: '#HS2024-015',
            name: 'Hội thảo Khởi nghiệp và Đổi mới Sáng tạo 2025',
            status: 'Đã duyệt'
        },
        2: {
            id: '#HS2024-014',
            name: 'Cuộc thi Hackathon Sinh viên 2025',
            status: 'Từ chối'
        },
        3: {
            id: '#HS2024-013',
            name: 'Ngày hội Việc làm và Cơ hội Nghề nghiệp',
            status: 'Đã duyệt'
        },
        4: {
            id: '#HS2024-012',
            name: 'Chương trình Giao lưu Văn hóa Quốc tế',
            status: 'Đã duyệt'
        },
        5: {
            id: '#HS2024-011',
            name: 'Festival Âm nhạc Mùa Xuân',
            status: 'Từ chối'
        }
    };
    
    return mockData[historyId] || { id: 'Unknown', name: 'Unknown', status: 'Unknown' };
}

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const historyItems = document.querySelectorAll('.history-item');
        
        historyItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const id = item.querySelector('.history-id').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || id.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Pagination functionality
const pageButtons = document.querySelectorAll('.page-btn');
pageButtons.forEach(button => {
    button.addEventListener('click', function() {
        if (this.disabled) return;
        
        pageButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // In real implementation, load data for the selected page
        console.log('Loading page:', this.textContent);
    });
});
