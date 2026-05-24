// BTC Authorization Management
// Quản lý phân quyền cho Ban Tổ chức

// User roles
const BTC_ROLES = {
    LEADER: 'truong_btc',      // Trưởng Ban Tổ chức
    MEMBER: 'thanh_vien_btc'   // Thành viên Ban Tổ chức
};

// Permission configuration
const PERMISSIONS = {
    [BTC_ROLES.LEADER]: {
        canAccessDashboard: true,
        canAccessEvents: true,
        canAccessBudget: true,
        canAccessApproval: true,
        canAccessTasks: true,
        canAccessAttendance: true,
        canAccessReports: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canViewAll: true
    },
    [BTC_ROLES.MEMBER]: {
        canAccessDashboard: true,      // Chỉ xem sự kiện được phân công
        canAccessEvents: true,          // Có thể xem danh sách và chi tiết sự kiện
        canAccessBudget: false,         // Không truy cập ngân sách
        canAccessApproval: false,       // Không truy cập phê duyệt
        canAccessTasks: true,           // Chỉ xem + cập nhật task của mình
        canAccessAttendance: false,     // Không truy cập quản lý người tham gia
        canAccessReports: false,        // Không truy cập báo cáo
        canCreate: false,               // Không tạo mới
        canEdit: false,                 // Không sửa (trừ task của mình)
        canDelete: false,               // Không xóa
        canApprove: false,              // Không phê duyệt
        canViewAll: false,              // Chỉ xem được phân công
        canUpdateTaskStatus: true       // Có thể cập nhật trạng thái task của mình
    }
};

// Get current user role from localStorage or session
function getCurrentUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const vaiTros = user.vaiTros || [];
    
    if (vaiTros.includes('TruongBanToChuc')) return BTC_ROLES.LEADER;
    if (vaiTros.includes('ThanhVienBanToChuc')) return BTC_ROLES.MEMBER;
    
    return BTC_ROLES.MEMBER;
}

// Check if user has specific permission
function hasPermission(permissionKey) {
    const role = getCurrentUserRole();
    const permissions = PERMISSIONS[role];
    return permissions ? permissions[permissionKey] : false;
}

// Initialize sidebar based on user role
function initializeSidebarPermissions() {
    const role = getCurrentUserRole();
    const permissions = PERMISSIONS[role];
    
    if (!permissions) {
        console.error('Invalid user role');
        return;
    }

    // Define sidebar items and their permission keys
    const sidebarItems = [
        { selector: 'a[href="btc-dashboard.html"]', permission: 'canAccessDashboard' },
        { selector: 'a[href="btc-events.html"]', permission: 'canAccessEvents' },
        { selector: 'a[href="btc-budget.html"]', permission: 'canAccessBudget' },
        { selector: 'a[href="btc-approval.html"]', permission: 'canAccessApproval' },
        { selector: 'a[href="btc-team-tasks.html"]', permission: 'canAccessTasks' },
        { selector: 'a[href="btc-attendance.html"]', permission: 'canAccessAttendance' },
        { selector: 'a[href="btc-reports.html"]', permission: 'canAccessReports' }
    ];

    // Apply permissions to each sidebar item
    sidebarItems.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
            if (!permissions[item.permission]) {
                // Disable the link
                element.classList.add('disabled');
                element.setAttribute('data-disabled', 'true');
                
                // Add tooltip
                element.setAttribute('title', 'Bạn không có quyền truy cập chức năng này');
                
                // Prevent navigation
                element.addEventListener('click', function(e) {
                    if (this.getAttribute('data-disabled') === 'true') {
                        e.preventDefault();
                        showPermissionDeniedMessage();
                    }
                });
            }
        }
    });

    // Update user role display
    updateUserRoleDisplay(role);
}

// Show permission denied message
function showPermissionDeniedMessage() {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'permission-toast';
    toast.innerHTML = `
        <i class="fas fa-lock"></i>
        <span>Bạn không có quyền truy cập chức năng này. Chỉ Trưởng Ban Tổ chức mới có quyền này.</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Update user role display in header
function updateUserRoleDisplay(role) {
    const userRoleElement = document.querySelector('.user-role');
    if (userRoleElement) {
        if (role === BTC_ROLES.LEADER) {
            userRoleElement.textContent = 'Trưởng Ban Tổ chức';
        } else if (role === BTC_ROLES.MEMBER) {
            userRoleElement.textContent = 'Thành viên Ban Tổ chức';
        }
    }
}

// Check page access permission
function checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop();
    const role = getCurrentUserRole();
    const permissions = PERMISSIONS[role];
    
    const pagePermissions = {
        'btc-dashboard.html': 'canAccessDashboard',
        'btc-events.html': 'canAccessEvents',
        'btc-budget.html': 'canAccessBudget',
        'btc-approval.html': 'canAccessApproval',
        'btc-team-tasks.html': 'canAccessTasks',
        'btc-attendance.html': 'canAccessAttendance',
        'btc-reports.html': 'canAccessReports'
    };
    
    const requiredPermission = pagePermissions[currentPage];
    
    if (requiredPermission && !permissions[requiredPermission]) {
        // Redirect to dashboard with error message
        showAccessDeniedPage();
        return false;
    }
    
    return true;
}

// Show access denied page
function showAccessDeniedPage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="access-denied-container">
                <div class="access-denied-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h1>Truy cập bị từ chối</h1>
                <p>Bạn không có quyền truy cập trang này.</p>
                <p class="access-denied-detail">Chỉ Trưởng Ban Tổ chức mới có quyền truy cập chức năng này.</p>
                <button class="btn-primary" onclick="window.location.href='btc-dashboard.html'">
                    <i class="fas fa-home"></i>
                    Quay về Dashboard
                </button>
            </div>
        `;
    }
}

// Hide action buttons based on permissions
function hideRestrictedActions() {
    const role = getCurrentUserRole();
    const permissions = PERMISSIONS[role];
    const currentPage = window.location.pathname.split('/').pop();
    
    // Special handling for Dashboard - Members
    if (currentPage === 'btc-dashboard.html' && role === BTC_ROLES.MEMBER) {
        // Hide "Gửi báo cáo" and "Gửi phê duyệt ngân sách" buttons
        const headerButtons = document.querySelectorAll('.header-actions .btn-secondary, .header-actions .btn-primary');
        headerButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Hide entire "Yêu cầu cần Phê duyệt" card
        const approvalCard = document.querySelector('.approval-card');
        if (approvalCard) {
            approvalCard.style.display = 'none';
        }
        
        return; // Exit early for dashboard
    }
    
    // Special handling for Events page - Members can view but not create/edit/delete
    if (currentPage === 'btc-events.html' && role === BTC_ROLES.MEMBER) {
        // Hide create event button
        const createButtons = document.querySelectorAll('.btn-create, .btn-primary[onclick*="openCreateEventModal"]');
        createButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Hide edit and delete buttons in event cards
        const editButtons = document.querySelectorAll('[onclick*="editEvent"], [onclick*="openEditEventModal"]');
        editButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Hide cancel/delete buttons
        const cancelButtons = document.querySelectorAll('[onclick*="deleteEvent"], [onclick*="cancelEvent"], .btn-cancel-event');
        cancelButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show view-only notice
        showMemberViewNotice('Bạn chỉ có quyền xem danh sách và chi tiết sự kiện. Không thể tạo, sửa hoặc hủy sự kiện.');
        
        return; // Exit early for events page
    }
    
    // Special handling for Tasks page - Members can update status
    if (currentPage === 'btc-team-tasks.html' && role === BTC_ROLES.MEMBER) {
        // Hide "Thêm Nhiệm vụ Mới" button in page header
        const addTaskButtons = document.querySelectorAll('.page-header .btn-primary[onclick*="openCreateTaskModal"]');
        addTaskButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Replace sidebar "Tạo nhiệm vụ mới" button with "Cập nhật trạng thái"
        const createTaskBtn = document.querySelector('.btn-create');
        if (createTaskBtn) {
            createTaskBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái công việc';
            createTaskBtn.onclick = function() {
                openTaskStatusUpdateModal();
            };
        }
        
        // Replace "Chỉnh sửa" buttons with "Cập nhật trạng thái" in task cards
        const editTaskButtons = document.querySelectorAll('.task-card .btn-edit, [onclick*="openEditTaskModal"]');
        editTaskButtons.forEach(btn => {
            // Get task ID from button
            const taskCard = btn.closest('.task-card');
            if (taskCard) {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái';
                btn.className = 'btn-update-status';
                btn.onclick = function() {
                    const taskId = taskCard.getAttribute('data-task-id') || '1';
                    openTaskStatusUpdateModalForTask(taskId);
                };
            }
        });
        
        // Intercept edit task modal opening to modify it for members
        interceptTaskEditModal();
        
        // Show member view notice
        showMemberViewNotice('Bạn chỉ có thể xem và cập nhật trạng thái các công việc được giao cho mình.');
        
        return; // Exit early for tasks page
    }
    
    // Hide create buttons if no create permission
    if (!permissions.canCreate) {
        const createButtons = document.querySelectorAll('.btn-create, .btn-primary[onclick*="create"], .btn-primary[onclick*="Create"]');
        createButtons.forEach(btn => {
            if (!btn.textContent.includes('Lưu') && !btn.textContent.includes('Cập nhật')) {
                btn.style.display = 'none';
            }
        });
    }
    
    // Hide edit buttons if no edit permission
    if (!permissions.canEdit) {
        const editButtons = document.querySelectorAll('[onclick*="edit"], [onclick*="Edit"], .btn-edit');
        editButtons.forEach(btn => {
            // Allow editing own tasks
            if (!btn.closest('.task-card') && !btn.closest('.my-task')) {
                btn.style.display = 'none';
            }
        });
    }
    
    // Hide delete buttons if no delete permission
    if (!permissions.canDelete) {
        const deleteButtons = document.querySelectorAll('[onclick*="delete"], [onclick*="Delete"], .btn-delete, .btn-action-danger');
        deleteButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Hide approval buttons if no approve permission
    if (!permissions.canApprove) {
        const approveButtons = document.querySelectorAll('[onclick*="approve"], [onclick*="Approve"], .btn-approve');
        approveButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

// Intercept task edit modal to lock fields for members
function interceptTaskEditModal() {
    const role = getCurrentUserRole();
    if (role !== BTC_ROLES.MEMBER) return;
    
    // Watch for modal opening
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
                    // Check if it's task modal
                    const modalTitle = node.querySelector('.modal-header h2');
                    if (modalTitle && (modalTitle.textContent.includes('Chỉnh sửa nhiệm vụ') || modalTitle.textContent.includes('Chi tiết nhiệm vụ'))) {
                        lockTaskModalFields(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also check existing modals
    setTimeout(() => {
        const existingModals = document.querySelectorAll('.modal.active');
        existingModals.forEach(modal => {
            const modalTitle = modal.querySelector('.modal-header h2');
            if (modalTitle && (modalTitle.textContent.includes('Chỉnh sửa nhiệm vụ') || modalTitle.textContent.includes('Chi tiết nhiệm vụ'))) {
                lockTaskModalFields(modal);
            }
        });
    }, 500);
}

// Lock task modal fields for members (only allow status and notes)
function lockTaskModalFields(modal) {
    const role = getCurrentUserRole();
    if (role !== BTC_ROLES.MEMBER) return;
    
    // Change modal title
    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Cập nhật Trạng thái Nhiệm vụ';
    }
    
    // Lock all input fields except status and notes
    const inputs = modal.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], select');
    inputs.forEach(input => {
        const fieldName = input.id || input.name || '';
        // Only allow status select and notes textarea
        if (!fieldName.includes('status') && !fieldName.includes('Status') && 
            !fieldName.includes('progress') && !fieldName.includes('Progress')) {
            input.disabled = true;
            input.style.backgroundColor = '#F3F4F6';
            input.style.cursor = 'not-allowed';
        }
    });
    
    // Lock textareas except notes
    const textareas = modal.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const fieldName = textarea.id || textarea.name || '';
        if (!fieldName.includes('note') && !fieldName.includes('Note') && 
            !fieldName.includes('ghi') && !fieldName.includes('Ghi')) {
            textarea.disabled = true;
            textarea.style.backgroundColor = '#F3F4F6';
            textarea.style.cursor = 'not-allowed';
        }
    });
    
    // Hide action buttons except save/update
    const actionButtons = modal.querySelectorAll('.modal-footer button');
    actionButtons.forEach(btn => {
        if (btn.textContent.includes('Xóa') || btn.textContent.includes('Delete')) {
            btn.style.display = 'none';
        }
        if (btn.textContent.includes('Lưu') || btn.textContent.includes('Cập nhật')) {
            btn.textContent = 'Cập nhật trạng thái';
        }
    });
    
    // Add notice at top of modal
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody && !modalBody.querySelector('.member-edit-notice')) {
        const notice = document.createElement('div');
        notice.className = 'member-edit-notice';
        notice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Bạn chỉ có thể cập nhật trạng thái và ghi chú. Các thông tin khác không thể chỉnh sửa.</span>
        `;
        modalBody.insertBefore(notice, modalBody.firstChild);
    }
}

// Show member view notice
function showMemberViewNotice(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !document.querySelector('.member-view-notice')) {
        const notice = document.createElement('div');
        notice.className = 'filtered-view-notice member-view-notice';
        notice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        // Insert after page header
        const pageHeader = mainContent.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.after(notice);
        } else {
            mainContent.insertBefore(notice, mainContent.firstChild);
        }
    }
}

// Open task status update modal for members
function openTaskStatusUpdateModal() {
    // Check if there are any assigned tasks
    const assignedTasks = document.querySelectorAll('.task-card[data-assigned="true"]');
    
    if (assignedTasks.length === 0) {
        showPermissionDeniedMessage('Bạn chưa có công việc nào được giao.');
        return;
    }
    
    // Create and show status update modal
    let modal = document.getElementById('taskStatusUpdateModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'taskStatusUpdateModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cập nhật Trạng thái Công việc</h2>
                    <button class="btn-close" onclick="closeTaskStatusUpdateModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Chọn công việc <span class="required">*</span></label>
                        <select id="taskSelectForUpdate" required>
                            <option value="">-- Chọn công việc --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Trạng thái mới <span class="required">*</span></label>
                        <select id="newTaskStatus" required>
                            <option value="">-- Chọn trạng thái --</option>
                            <option value="pending">Đang làm</option>
                            <option value="in-progress">Đang thực hiện</option>
                            <option value="review">Chờ duyệt</option>
                            <option value="completed">Hoàn thành</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tiến độ (%)</label>
                        <input type="number" id="taskProgress" min="0" max="100" value="0">
                    </div>
                    <div class="form-group">
                        <label>Ghi chú</label>
                        <textarea id="taskUpdateNotes" rows="4" placeholder="Ghi chú về tiến độ công việc..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel-modal" onclick="closeTaskStatusUpdateModal()">Hủy</button>
                    <button type="button" class="btn-submit" onclick="submitTaskStatusUpdate()">Cập nhật</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Populate task select with assigned tasks
        const taskSelect = modal.querySelector('#taskSelectForUpdate');
        assignedTasks.forEach((task, index) => {
            const taskTitle = task.querySelector('h3')?.textContent || `Công việc ${index + 1}`;
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = taskTitle;
            taskSelect.appendChild(option);
        });
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Open task status update modal for specific task
function openTaskStatusUpdateModalForTask(taskId) {
    // Create simplified modal for specific task
    let modal = document.getElementById('taskStatusUpdateModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'taskStatusUpdateModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cập nhật Trạng thái Công việc</h2>
                    <button class="btn-close" onclick="closeTaskStatusUpdateModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="taskIdForUpdate" value="${taskId}">
                    <div class="form-group">
                        <label>Trạng thái mới <span class="required">*</span></label>
                        <select id="newTaskStatus" required>
                            <option value="">-- Chọn trạng thái --</option>
                            <option value="pending">Đang làm</option>
                            <option value="in-progress">Đang thực hiện</option>
                            <option value="review">Chờ duyệt</option>
                            <option value="completed">Hoàn thành</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tiến độ (%)</label>
                        <input type="number" id="taskProgress" min="0" max="100" value="0">
                    </div>
                    <div class="form-group">
                        <label>Ghi chú</label>
                        <textarea id="taskUpdateNotes" rows="4" placeholder="Ghi chú về tiến độ công việc..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel-modal" onclick="closeTaskStatusUpdateModal()">Hủy</button>
                    <button type="button" class="btn-submit" onclick="submitTaskStatusUpdate()">Cập nhật</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Update task ID if modal already exists
        const taskIdInput = modal.querySelector('#taskIdForUpdate');
        if (taskIdInput) {
            taskIdInput.value = taskId;
        }
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close task status update modal
function closeTaskStatusUpdateModal() {
    const modal = document.getElementById('taskStatusUpdateModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Submit task status update
function submitTaskStatusUpdate() {
    const taskId = document.getElementById('taskSelectForUpdate').value;
    const status = document.getElementById('newTaskStatus').value;
    const progress = document.getElementById('taskProgress').value;
    const notes = document.getElementById('taskUpdateNotes').value;
    
    if (!taskId || !status) {
        alert('Vui lòng chọn công việc và trạng thái mới');
        return;
    }
    
    console.log('Updating task status:', { taskId, status, progress, notes });
    
    // Call API to update task status
    // In real implementation, this would be an API call
    
    alert('Đã cập nhật trạng thái công việc thành công!');
    closeTaskStatusUpdateModal();
    
    // Reload or update UI
    // location.reload();
}

// Make functions globally available
window.openTaskStatusUpdateModal = openTaskStatusUpdateModal;
window.openTaskStatusUpdateModalForTask = openTaskStatusUpdateModalForTask;
window.closeTaskStatusUpdateModal = closeTaskStatusUpdateModal;
window.submitTaskStatusUpdate = submitTaskStatusUpdate;

// Filter data based on user role (for members - only show assigned items)
function filterDataByRole(data, type = 'events') {
    const role = getCurrentUserRole();
    
    if (role === BTC_ROLES.LEADER) {
        return data; // Leaders see everything
    }
    
    // Members only see assigned items
    // This should be implemented based on actual assignment data
    // For now, return filtered mock data
    
    if (type === 'events') {
        // Filter events where user is assigned
        return data.filter(item => item.isAssigned === true);
    }
    
    if (type === 'tasks') {
        // Filter tasks assigned to user
        return data.filter(item => item.assignedToMe === true);
    }
    
    return data;
}

// Add role badge to user profile
function addRoleBadge() {
    const role = getCurrentUserRole();
    const userInfo = document.querySelector('.user-info');
    
    if (userInfo && !document.querySelector('.role-badge')) {
        const badge = document.createElement('span');
        badge.className = 'role-badge';
        
        if (role === BTC_ROLES.LEADER) {
            badge.classList.add('leader');
            badge.innerHTML = '<i class="fas fa-crown"></i> Trưởng ban';
        } else {
            badge.classList.add('member');
            badge.innerHTML = '<i class="fas fa-user"></i> Thành viên';
        }
        
        userInfo.appendChild(badge);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on a BTC page
    const currentPage = window.location.pathname;
    if (currentPage.includes('btc-')) {
        // Initialize sidebar permissions
        initializeSidebarPermissions();
        
        // Check page access
        checkPageAccess();
        
        // Hide restricted actions
        hideRestrictedActions();
        
        // Add role badge
        addRoleBadge();
    }
});

// Export functions for use in other scripts
window.BTCAuth = {
    getCurrentUserRole,
    hasPermission,
    checkPageAccess,
    filterDataByRole,
    showPermissionDeniedMessage,
    BTC_ROLES
};
