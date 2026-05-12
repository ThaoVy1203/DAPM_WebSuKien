// CTSV Approval Management JavaScript

let currentApprovalId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFilterTabs();
    initializeFilters();
});

// Filter Tabs
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const approvalItems = document.querySelectorAll('.approval-item');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-filter');

            approvalItems.forEach(item => {
                if (filterType === 'all') {
                    item.style.display = 'block';
                } else {
                    const itemPriority = item.getAttribute('data-priority');
                    item.style.display = itemPriority === filterType ? 'block' : 'none';
                }
            });
        });
    });
}

// Initialize Filters
function initializeFilters() {
    const eventTypeFilter = document.getElementById('eventTypeFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (eventTypeFilter) {
        eventTypeFilter.addEventListener('change', applyFilters);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
}

// Apply Filters
function applyFilters() {
    const eventType = document.getElementById('eventTypeFilter').value;
    const dateRange = document.getElementById('dateFilter').value;

    console.log('Applying filters:', { eventType, dateRange });

    // In real implementation, this would filter the approval items
    // For now, just log the filter values
    alert(`Đang lọc theo:\nLoại sự kiện: ${eventType}\nThời gian: ${dateRange}`);
}

// Export Pending List
function exportPendingList() {
    console.log('Exporting pending approval list');
    alert('Đang xuất danh sách hồ sơ chờ duyệt...');
    
    // In real implementation, call API to generate Excel/PDF file
}

// Open Bulk Approval Modal
function openBulkApprovalModal() {
    console.log('Opening bulk approval modal');
    alert('Chức năng duyệt hàng loạt sẽ được triển khai');
    
    // In real implementation, show modal to select multiple items and approve
}

// View Approval Detail
function viewApprovalDetail(approvalId) {
    console.log('Viewing approval detail:', approvalId);
    
    // Get approval info (mock data)
    const approvalInfo = getDetailApprovalInfo(approvalId);
    
    // Update modal content
    document.getElementById('detailEventName').textContent = approvalInfo.name;
    document.getElementById('detailPriority').textContent = approvalInfo.priority;
    document.getElementById('detailPriority').className = `approval-badge ${approvalInfo.priorityClass}`;
    document.getElementById('detailId').textContent = approvalInfo.id;
    document.getElementById('detailSender').textContent = approvalInfo.sender;
    document.getElementById('detailSubmitDate').textContent = approvalInfo.submitDate;
    document.getElementById('detailEventDate').textContent = approvalInfo.eventDate;
    document.getElementById('detailDeadline').textContent = approvalInfo.deadline;
    document.getElementById('detailScale').textContent = approvalInfo.scale;
    document.getElementById('detailBudget').textContent = approvalInfo.budget;
    document.getElementById('detailLocation').textContent = approvalInfo.location;
    document.getElementById('detailType').textContent = approvalInfo.type;
    document.getElementById('detailDescription').innerHTML = approvalInfo.description;
    document.getElementById('detailObjectives').innerHTML = approvalInfo.objectives;
    document.getElementById('detailSchedule').innerHTML = approvalInfo.schedule;
    
    // Store current approval ID
    currentApprovalId = approvalId;
    
    // Show modal
    const modal = document.getElementById('viewDetailModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Get Detail Approval Info (Mock Data)
function getDetailApprovalInfo(approvalId) {
    const mockData = {
        1: {
            name: 'Hội thảo Công nghệ AI và Ứng dụng 2024',
            priority: 'KHẨN CẤP',
            priorityClass: 'urgent',
            id: '#HS2024-001',
            sender: 'Nguyễn Văn A (Trưởng BTC)',
            submitDate: '30/12/2024 09:15',
            eventDate: '15/01/2025',
            deadline: 'Còn 8 giờ',
            scale: '500 người',
            budget: '150,000,000 đ',
            location: 'Hội trường A1',
            type: 'Hội thảo',
            description: '<p>Hội thảo về công nghệ AI với sự tham gia của các chuyên gia hàng đầu trong lĩnh vực. Bao gồm 3 phiên thảo luận chính và workshop thực hành về Machine Learning, Deep Learning và ứng dụng AI trong thực tế.</p>',
            objectives: '<ul><li>Cung cấp kiến thức cơ bản và nâng cao về AI cho sinh viên</li><li>Tạo cơ hội giao lưu với các chuyên gia trong ngành</li><li>Thúc đẩy nghiên cứu và ứng dụng AI tại trường</li></ul>',
            schedule: '<ul><li><strong>08:00 - 08:30:</strong> Đón tiếp và đăng ký</li><li><strong>08:30 - 09:00:</strong> Khai mạc và phát biểu</li><li><strong>09:00 - 11:00:</strong> Phiên 1 - Giới thiệu về AI</li><li><strong>11:00 - 12:00:</strong> Workshop thực hành</li><li><strong>12:00 - 13:00:</strong> Nghỉ trưa</li><li><strong>13:00 - 15:00:</strong> Phiên 2 - Ứng dụng AI</li><li><strong>15:00 - 16:00:</strong> Thảo luận và Q&A</li><li><strong>16:00 - 16:30:</strong> Bế mạc</li></ul>'
        },
        2: {
            name: 'Workshop Khởi nghiệp cho Sinh viên',
            priority: 'BÌNH THƯỜNG',
            priorityClass: 'normal',
            id: '#HS2024-002',
            sender: 'Trần Thị B (Phó BTC)',
            submitDate: '29/12/2024 14:30',
            eventDate: '20/01/2025',
            deadline: 'Còn 2 ngày',
            scale: '200 người',
            budget: '50,000,000 đ',
            location: 'Phòng hội thảo B2',
            type: 'Workshop',
            description: '<p>Workshop hướng dẫn sinh viên về khởi nghiệp, lập kế hoạch kinh doanh và tìm kiếm nguồn vốn. Có sự tham gia của các doanh nhân thành công.</p>',
            objectives: '<ul><li>Trang bị kiến thức khởi nghiệp cho sinh viên</li><li>Chia sẻ kinh nghiệm từ các doanh nhân</li><li>Hỗ trợ sinh viên lập kế hoạch kinh doanh</li></ul>',
            schedule: '<ul><li><strong>08:00 - 08:30:</strong> Đăng ký</li><li><strong>08:30 - 10:00:</strong> Phần 1 - Giới thiệu khởi nghiệp</li><li><strong>10:00 - 11:30:</strong> Phần 2 - Lập kế hoạch</li><li><strong>11:30 - 13:00:</strong> Nghỉ trưa</li><li><strong>13:00 - 15:00:</strong> Workshop thực hành</li><li><strong>15:00 - 16:00:</strong> Q&A và kết thúc</li></ul>'
        },
        3: {
            name: 'Giải Bóng đá Sinh viên Khoa CNTT',
            priority: 'KHẨN CẤP',
            priorityClass: 'urgent',
            id: '#HS2024-003',
            sender: 'Lê Văn C (Trưởng BTC)',
            submitDate: '30/12/2024 08:00',
            eventDate: '10/01/2025',
            deadline: 'Còn 12 giờ',
            scale: '16 đội',
            budget: '30,000,000 đ',
            location: 'Sân bóng trường',
            type: 'Thi đấu',
            description: '<p>Giải bóng đá giao lưu giữa các lớp trong khoa CNTT, nhằm tăng cường tinh thần đoàn kết và rèn luyện sức khỏe cho sinh viên.</p>',
            objectives: '<ul><li>Tăng cường sức khỏe cho sinh viên</li><li>Xây dựng tinh thần đoàn kết</li><li>Tạo sân chơi lành mạnh</li></ul>',
            schedule: '<ul><li><strong>07:00 - 08:00:</strong> Lễ khai mạc</li><li><strong>08:00 - 12:00:</strong> Vòng bảng</li><li><strong>12:00 - 13:00:</strong> Nghỉ trưa</li><li><strong>13:00 - 16:00:</strong> Vòng loại trực tiếp</li><li><strong>16:00 - 17:00:</strong> Chung kết và trao giải</li></ul>'
        },
        4: {
            name: 'Đêm Nhạc Acoustic "Thanh Xuân"',
            priority: 'BÌNH THƯỜNG',
            priorityClass: 'normal',
            id: '#HS2024-004',
            sender: 'Phạm Thị D (Trưởng BTC)',
            submitDate: '28/12/2024 16:45',
            eventDate: '25/01/2025',
            deadline: 'Còn 3 ngày',
            scale: '300 người',
            budget: '40,000,000 đ',
            location: 'Sân khấu ngoài trời',
            type: 'Văn nghệ',
            description: '<p>Đêm nhạc acoustic với sự tham gia của các ca sĩ trẻ và sinh viên có tài năng âm nhạc. Chương trình nhằm tạo sân chơi lành mạnh cho sinh viên.</p>',
            objectives: '<ul><li>Tạo sân chơi văn hóa cho sinh viên</li><li>Phát hiện tài năng âm nhạc</li><li>Tăng cường hoạt động văn nghệ</li></ul>',
            schedule: '<ul><li><strong>18:00 - 18:30:</strong> Đón khách</li><li><strong>18:30 - 19:00:</strong> Khai mạc</li><li><strong>19:00 - 20:30:</strong> Phần 1 - Ca sĩ khách mời</li><li><strong>20:30 - 21:00:</strong> Nghỉ giải lao</li><li><strong>21:00 - 22:00:</strong> Phần 2 - Sinh viên biểu diễn</li><li><strong>22:00 - 22:30:</strong> Bế mạc</li></ul>'
        }
    };
    
    return mockData[approvalId] || mockData[1];
}

// Close View Detail Modal
function closeViewDetailModal() {
    const modal = document.getElementById('viewDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Approve from Detail Modal
function approveFromDetail() {
    closeViewDetailModal();
    setTimeout(() => {
        openApproveModal(currentApprovalId);
    }, 300);
}

// Reject from Detail Modal
function rejectFromDetail() {
    closeViewDetailModal();
    setTimeout(() => {
        openRejectModal(currentApprovalId);
    }, 300);
}

// Open Approve Modal
function openApproveModal(approvalId) {
    currentApprovalId = approvalId;
    
    // Get approval info (mock data)
    const approvalInfo = getApprovalInfo(approvalId);
    
    // Update modal content
    document.getElementById('approveEventName').textContent = approvalInfo.name;
    
    // Show modal
    const modal = document.getElementById('approveModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Approve Modal
function closeApproveModal() {
    const modal = document.getElementById('approveModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('approveComment').value = '';
    document.getElementById('notifyOrganizer').checked = true;
    currentApprovalId = null;
}

// Confirm Approve
function confirmApprove() {
    if (!currentApprovalId) return;
    
    const comment = document.getElementById('approveComment').value;
    const notify = document.getElementById('notifyOrganizer').checked;
    
    console.log('Approving:', {
        approvalId: currentApprovalId,
        comment,
        notify
    });
    
    // Call API to approve
    // In real implementation, this would be an API call
    
    // Show success message
    alert('Đã phê duyệt hồ sơ thành công!');
    
    // Close modal
    closeApproveModal();
    
    // Remove item from list or update status
    removeApprovalItem(currentApprovalId);
    
    // Update stats
    updateStats();
}

// Open Reject Modal
function openRejectModal(approvalId) {
    currentApprovalId = approvalId;
    
    // Get approval info (mock data)
    const approvalInfo = getApprovalInfo(approvalId);
    
    // Update modal content
    document.getElementById('rejectEventName').textContent = approvalInfo.name;
    
    // Show modal
    const modal = document.getElementById('rejectModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Reject Modal
function closeRejectModal() {
    const modal = document.getElementById('rejectModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectSuggestion').value = '';
    document.getElementById('allowResubmit').checked = true;
    currentApprovalId = null;
}

// Confirm Reject
function confirmReject() {
    if (!currentApprovalId) return;
    
    const reason = document.getElementById('rejectReason').value;
    const suggestion = document.getElementById('rejectSuggestion').value;
    const allowResubmit = document.getElementById('allowResubmit').checked;
    
    // Validate required fields
    if (!reason.trim()) {
        alert('Vui lòng nhập lý do từ chối');
        return;
    }
    
    console.log('Rejecting:', {
        approvalId: currentApprovalId,
        reason,
        suggestion,
        allowResubmit
    });
    
    // Call API to reject
    // In real implementation, this would be an API call
    
    // Show success message
    alert('Đã từ chối hồ sơ. Thông báo đã được gửi đến Ban Tổ chức.');
    
    // Close modal
    closeRejectModal();
    
    // Remove item from list or update status
    removeApprovalItem(currentApprovalId);
    
    // Update stats
    updateStats();
}

// Get Approval Info (Mock Data)
function getApprovalInfo(approvalId) {
    const mockData = {
        1: { name: 'Hội thảo Công nghệ AI và Ứng dụng 2024' },
        2: { name: 'Workshop Khởi nghiệp cho Sinh viên' },
        3: { name: 'Giải Bóng đá Sinh viên Khoa CNTT' },
        4: { name: 'Đêm Nhạc Acoustic "Thanh Xuân"' }
    };
    
    return mockData[approvalId] || { name: 'Hồ sơ không xác định' };
}

// Remove Approval Item from List
function removeApprovalItem(approvalId) {
    // Find and remove the approval item
    const approvalItems = document.querySelectorAll('.approval-item');
    approvalItems.forEach((item, index) => {
        if (index + 1 === approvalId) {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                item.remove();
            }, 300);
        }
    });
}

// Update Stats
function updateStats() {
    // Update pending count
    const pendingCount = document.querySelector('.pending-stat .stat-number');
    if (pendingCount) {
        const currentCount = parseInt(pendingCount.textContent);
        pendingCount.textContent = currentCount - 1;
    }
    
    // Update approved count
    const approvedCount = document.querySelector('.approved-stat .stat-number');
    if (approvedCount) {
        const currentCount = parseInt(approvedCount.textContent);
        approvedCount.textContent = currentCount + 1;
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const approveModal = document.getElementById('approveModal');
    const rejectModal = document.getElementById('rejectModal');
    const viewDetailModal = document.getElementById('viewDetailModal');
    
    if (e.target === approveModal) {
        closeApproveModal();
    }
    
    if (e.target === rejectModal) {
        closeRejectModal();
    }
    
    if (e.target === viewDetailModal) {
        closeViewDetailModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeApproveModal();
        closeRejectModal();
        closeViewDetailModal();
    }
});
