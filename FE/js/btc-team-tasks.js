// Team Tasks JavaScript

// Global variables
let currentTaskId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Team Tasks page loaded');
});

// Create Task Modal
function openCreateTaskModal() {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    
    modalTitle.textContent = 'Tạo nhiệm vụ mới';
    document.getElementById('taskForm').reset();
    currentTaskId = null;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openEditTaskModal(taskId) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    
    modalTitle.textContent = 'Chỉnh sửa nhiệm vụ';
    currentTaskId = taskId;
    
    // Load task data
    loadTaskData(taskId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function loadTaskData(taskId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            title: 'Ký kết hợp đồng ăn uống cho Tiệc tối VIP',
            description: 'Liên hệ và ký kết hợp đồng với nhà cung cấp dịch vụ ăn uống',
            priority: 'high',
            status: 'todo',
            deadline: '2024-10-12',
            progress: 0,
            assignee: '1',
            notes: 'Cần hoàn thành trước ngày 12/10'
        },
        2: {
            title: 'Hoàn tất danh sách diễn giả và sắp xếp đi lại',
            description: 'Liên hệ và xác nhận danh sách diễn giả, sắp xếp lịch trình di chuyển',
            priority: 'medium',
            status: 'todo',
            deadline: '2024-10-15',
            progress: 0,
            assignee: '5',
            notes: ''
        },
        3: {
            title: 'Thiết kế banner mạng xã hội cho đợt Tuyển dụng',
            description: 'Thiết kế banner quảng cáo cho các nền tảng mạng xã hội',
            priority: 'low',
            status: 'in-progress',
            deadline: '2024-10-08',
            progress: 60,
            assignee: '6',
            notes: 'Đã hoàn thành 60%'
        },
        4: {
            title: 'Kiểm tra các giao thức an toàn cho sự kiện trong khuôn viên',
            description: 'Kiểm tra và đảm bảo các giao thức an toàn cho sự kiện',
            priority: 'high',
            status: 'review',
            deadline: '2024-10-10',
            progress: 90,
            assignee: '4',
            notes: 'Đang chờ phê duyệt'
        }
    };

    const data = mockData[taskId];
    if (data) {
        document.getElementById('taskTitle').value = data.title;
        document.getElementById('taskDescription').value = data.description;
        document.getElementById('taskPriority').value = data.priority;
        document.getElementById('taskStatus').value = data.status;
        document.getElementById('taskDeadline').value = data.deadline;
        document.getElementById('taskProgress').value = data.progress;
        document.getElementById('taskAssignee').value = data.assignee;
        document.getElementById('taskNotes').value = data.notes;
    }
}

// Task Detail Modal
function openTaskDetailModal(taskId) {
    const modal = document.getElementById('taskDetailModal');
    currentTaskId = taskId;
    
    // Load task detail data
    loadTaskDetailData(taskId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskDetailModal() {
    const modal = document.getElementById('taskDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function editTaskFromDetail() {
    closeTaskDetailModal();
    openEditTaskModal(currentTaskId);
}

function loadTaskDetailData(taskId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            title: 'Ký kết hợp đồng ăn uống cho Tiệc tối VIP',
            description: 'Liên hệ và ký kết hợp đồng với nhà cung cấp dịch vụ ăn uống cho tiệc tối VIP trong sự kiện.',
            priority: 'high',
            priorityText: 'ƯU TIÊN CAO',
            status: 'todo',
            statusText: 'CẦN LÀM',
            assigneeName: 'TS. Aris',
            assigneeAvatar: 'https://ui-avatars.com/api/?name=TS+Aris&background=0D5A9C&color=fff',
            deadline: '12/10/2024',
            progress: 0,
            notes: 'Cần hoàn thành trước ngày 12/10'
        },
        2: {
            title: 'Hoàn tất danh sách diễn giả và sắp xếp đi lại',
            description: 'Liên hệ và xác nhận danh sách diễn giả, sắp xếp lịch trình di chuyển và chỗ ở.',
            priority: 'medium',
            priorityText: 'TRUNG BÌNH',
            status: 'todo',
            statusText: 'CẦN LÀM',
            assigneeName: 'Sarah L.',
            assigneeAvatar: 'https://ui-avatars.com/api/?name=Sarah+L&background=10B981&color=fff',
            deadline: '15/10/2024',
            progress: 0,
            notes: 'Không có ghi chú'
        },
        3: {
            title: 'Thiết kế banner mạng xã hội cho đợt Tuyển dụng',
            description: 'Thiết kế banner quảng cáo cho các nền tảng mạng xã hội như Facebook, Instagram, LinkedIn.',
            priority: 'low',
            priorityText: 'ƯU TIÊN THẤP',
            status: 'in-progress',
            statusText: 'ĐANG THỰC HIỆN',
            assigneeName: 'Mike T.',
            assigneeAvatar: 'https://ui-avatars.com/api/?name=Mike+T&background=1976D2&color=fff',
            deadline: '08/10/2024',
            progress: 60,
            notes: 'Đã hoàn thành 60%, đang chờ feedback'
        },
        4: {
            title: 'Kiểm tra các giao thức an toàn cho sự kiện trong khuôn viên',
            description: 'Kiểm tra và đảm bảo các giao thức an toàn, phòng cháy chữa cháy, lối thoát hiểm cho sự kiện.',
            priority: 'high',
            priorityText: 'ƯU TIÊN CAO',
            status: 'review',
            statusText: 'XEM XÉT',
            assigneeName: 'D/u Jane',
            assigneeAvatar: 'https://ui-avatars.com/api/?name=D+Jane&background=F59E0B&color=fff',
            deadline: 'HÔM NAY',
            progress: 90,
            notes: 'Đang chờ phê duyệt từ ban giám hiệu'
        }
    };

    const data = mockData[taskId];
    if (data) {
        document.getElementById('detailTaskTitle').textContent = data.title;
        document.getElementById('detailDescription').textContent = data.description;
        document.getElementById('detailPriority').textContent = data.priorityText;
        document.getElementById('detailPriority').className = `task-priority ${data.priority}`;
        document.getElementById('detailStatus').textContent = data.statusText;
        document.getElementById('detailStatus').className = `task-status-badge ${data.status}`;
        document.getElementById('detailAssigneeName').textContent = data.assigneeName;
        document.getElementById('detailAssigneeAvatar').src = data.assigneeAvatar;
        document.getElementById('detailDeadline').textContent = data.deadline;
        document.getElementById('detailProgressBar').style.width = data.progress + '%';
        document.getElementById('detailProgressText').textContent = data.progress + '%';
        document.getElementById('detailNotes').textContent = data.notes;
    }
}

// Form Submission
document.getElementById('taskForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        deadline: document.getElementById('taskDeadline').value,
        progress: document.getElementById('taskProgress').value,
        assignee: document.getElementById('taskAssignee').value,
        notes: document.getElementById('taskNotes').value
    };

    console.log('Task data:', formData);

    // Call API to save task
    if (currentTaskId) {
        // Update existing task
        alert('Đã cập nhật nhiệm vụ thành công');
    } else {
        // Create new task
        alert('Đã tạo nhiệm vụ mới thành công');
    }

    closeTaskModal();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const taskModal = document.getElementById('taskModal');
    const taskDetailModal = document.getElementById('taskDetailModal');
    
    if (e.target === taskModal) {
        closeTaskModal();
    }
    
    if (e.target === taskDetailModal) {
        closeTaskDetailModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeTaskDetailModal();
    }
});

// Drag and Drop functionality (optional - for future enhancement)
// This would allow dragging tasks between columns
