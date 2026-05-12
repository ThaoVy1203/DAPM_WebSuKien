// BGH Approval Page JavaScript

// Filter functionality
function applyFilters() {
    const eventType = document.getElementById('eventTypeFilter').value;
    const budget = document.getElementById('budgetFilter').value;
    
    console.log('Applying filters:', { eventType, budget });
    // TODO: Implement filter logic with API
}

// Tab filtering
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const approvalItems = document.querySelectorAll('.approval-item');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs
            tabBtns.forEach(tab => tab.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filter items
            approvalItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else {
                    const priority = item.getAttribute('data-priority');
                    if (priority === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });
});

// View approval detail
function viewApprovalDetail(id) {
    console.log('Viewing approval detail:', id);
    // Open modal instead of navigating
    const modal = document.getElementById('viewDetailModal');
    if (modal) {
        modal.style.display = 'flex';
        // TODO: Load actual data based on id
    }
}

// Close view detail modal
function closeViewDetailModal() {
    const modal = document.getElementById('viewDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Open approve modal from detail view
function openApproveModalFromDetail() {
    closeViewDetailModal();
    // Get current item id from detail modal
    openApproveModal(1); // TODO: Get actual id
}

// Open reject modal from detail view
function openRejectModalFromDetail() {
    closeViewDetailModal();
    // Get current item id from detail modal
    openRejectModal(1); // TODO: Get actual id
}

// Open approve modal
function openApproveModal(id) {
    console.log('Opening approve modal for:', id);
    // TODO: Implement approve modal
    if (confirm('Bạn có chắc chắn muốn phê duyệt hồ sơ này?')) {
        confirmApprove(id);
    }
}

// Confirm approve
function confirmApprove(id) {
    console.log('Confirming approval for:', id);
    // TODO: Implement API call to approve
    alert('Đã phê duyệt hồ sơ thành công!');
    // Reload page or update UI
    location.reload();
}

// Open reject modal
function openRejectModal(id) {
    console.log('Opening reject modal for:', id);
    // TODO: Implement reject modal
    const reason = prompt('Nhập lý do từ chối:');
    if (reason) {
        confirmReject(id, reason);
    }
}

// Confirm reject
function confirmReject(id, reason) {
    console.log('Confirming rejection for:', id, 'Reason:', reason);
    // TODO: Implement API call to reject
    alert('Đã từ chối hồ sơ!');
    // Reload page or update UI
    location.reload();
}

// Export pending list
function exportPendingList() {
    console.log('Exporting pending list');
    // TODO: Implement export functionality
    alert('Đang xuất danh sách...');
}

// Open bulk approval modal
function openBulkApprovalModal() {
    console.log('Opening bulk approval modal');
    // TODO: Implement bulk approval
    alert('Chức năng duyệt hàng loạt đang được phát triển');
}

// Pagination
document.addEventListener('DOMContentLoaded', function() {
    const pageButtons = document.querySelectorAll('.page-btn:not([disabled])');
    
    pageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.querySelector('i')) { // Not arrow button
                // Remove active from all
                pageButtons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                
                const page = this.textContent;
                console.log('Loading page:', page);
                // TODO: Load page data
            }
        });
    });
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const approvalItems = document.querySelectorAll('.approval-item');
            
            approvalItems.forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                const id = item.querySelector('.approval-id').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || id.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});

// Notification button
document.addEventListener('DOMContentLoaded', function() {
    const notificationBtn = document.querySelector('.btn-notification');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            console.log('Opening notifications');
            // TODO: Open notifications panel
            window.location.href = 'notifications.html';
        });
    }
});


// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('viewDetailModal');
    if (event.target === modal) {
        closeViewDetailModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeViewDetailModal();
    }
});
