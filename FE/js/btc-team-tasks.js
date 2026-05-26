// Team Tasks JavaScript

const API_BASE = "https://localhost:7160/api/teamtasks";

// Global variables
let currentTaskId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('Team Tasks page loaded');
});

// ================= CREATE / EDIT MODAL =================

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

    loadTaskData(taskId);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ================= LOAD TASK DATA =================

async function loadTaskData(taskId) {
    try {
        const response = await fetch(`${API_BASE}/${taskId}`);

        if (!response.ok) throw new Error();

        const data = await response.json();

        document.getElementById('taskTitle').value = data.title || '';
        document.getElementById('taskDescription').value = data.description || '';
        document.getElementById('taskPriority').value = data.priority || '';
        document.getElementById('taskStatus').value = data.status || '';
        document.getElementById('taskDeadline').value = data.deadline?.split('T')[0] || '';
        document.getElementById('taskProgress').value = data.progress || 0;
        document.getElementById('taskAssignee').value = data.assigneeId || '';
        document.getElementById('taskNotes').value = data.notes || '';

    } catch (error) {
        console.error('Lỗi load task:', error);
        alert('Không tải được dữ liệu nhiệm vụ');
    }
}

// ================= DETAIL MODAL =================

function openTaskDetailModal(taskId) {
    const modal = document.getElementById('taskDetailModal');
    currentTaskId = taskId;

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

async function loadTaskDetailData(taskId) {
    try {
        const response = await fetch(`${API_BASE}/${taskId}`);

        if (!response.ok) throw new Error();

        const data = await response.json();

        document.getElementById('detailTaskTitle').textContent = data.title;
        document.getElementById('detailDescription').textContent = data.description;

        document.getElementById('detailPriority').textContent = data.priority;
        document.getElementById('detailPriority').className = `task-priority ${data.priority}`;

        document.getElementById('detailStatus').textContent = data.status;
        document.getElementById('detailStatus').className = `task-status-badge ${data.status}`;

        document.getElementById('detailAssigneeName').textContent = data.assigneeName || '';
        document.getElementById('detailAssigneeAvatar').src = data.assigneeAvatar || '';

        document.getElementById('detailDeadline').textContent = data.deadline || '';
        document.getElementById('detailProgressBar').style.width = `${data.progress}%`;
        document.getElementById('detailProgressText').textContent = `${data.progress}%`;

        document.getElementById('detailNotes').textContent = data.notes || '';

    } catch (error) {
        console.error('Lỗi load detail:', error);
        alert('Không tải được chi tiết nhiệm vụ');
    }
}

// ================= SAVE TASK =================

document.getElementById('taskForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        deadline: document.getElementById('taskDeadline').value,
        progress: parseInt(document.getElementById('taskProgress').value),
        assigneeId: document.getElementById('taskAssignee').value,
        notes: document.getElementById('taskNotes').value
    };

    try {
        let response;

        if (currentTaskId) {
            response = await fetch(`${API_BASE}/${currentTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            alert('Đã cập nhật nhiệm vụ thành công');
        } else {
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            alert('Đã tạo nhiệm vụ mới thành công');
        }

        if (!response.ok) throw new Error();

        closeTaskModal();
        location.reload();

    } catch (error) {
        console.error(error);
        alert('Lưu nhiệm vụ thất bại');
    }
});

// ================= DELETE TASK =================

async function deleteTask(taskId) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;

    try {
        const response = await fetch(`${API_BASE}/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error();

        alert('Đã xóa nhiệm vụ');
        location.reload();

    } catch (error) {
        console.error(error);
        alert('Xóa thất bại');
    }
}

// ================= CLOSE MODAL =================

window.addEventListener('click', function (e) {
    const taskModal = document.getElementById('taskModal');
    const taskDetailModal = document.getElementById('taskDetailModal');

    if (e.target === taskModal) {
        closeTaskModal();
    }

    if (e.target === taskDetailModal) {
        closeTaskDetailModal();
    }
});

// ================= KEYBOARD =================

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeTaskDetailModal();
    }
});