// Team Tasks JavaScript
const API_BASE = "https://localhost:7160/api";

let taskPageData = {
    events: [],
    selectedEventId: null,
    users: [],
    tasks: [],
    currentTaskId: null
};

// ================= INIT =================
document.addEventListener('DOMContentLoaded', async function () {
    setupModals();
    await loadUsers();
    await loadEventsSelector();
    await loadTasksForSelectedEvent();
});

// ================= SETUP MODALS =================
function setupModals() {
    // Close modal on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeTaskDetailModal();
        }
    });

    // Close on click outside
    window.addEventListener('click', function(e) {
        const taskModal = document.getElementById('taskModal');
        const taskDetailModal = document.getElementById('taskDetailModal');
        if (e.target === taskModal) closeTaskModal();
        if (e.target === taskDetailModal) closeTaskDetailModal();
    });
}

// ================= LOAD USERS =================
async function loadUsers() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/NguoiDung`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            taskPageData.users = await res.json();
            const assigneeSelect = document.getElementById("taskAssignee");
            if (assigneeSelect) {
                assigneeSelect.innerHTML = '<option value="">Chọn người phụ trách</option>';
                taskPageData.users.forEach(user => {
                    const name = user.hoTen || user.name || "Người dùng";
                    assigneeSelect.innerHTML += `<option value="${name}">${name}</option>`;
                });
            }
        }
    } catch (error) {
        console.error("Lỗi load users:", error);
    }
}

// ================= LOAD EVENTS SELECTOR =================
async function loadEventsSelector() {
    const selector = document.getElementById("eventSelector");
    if (!selector) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/SuKien`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải sự kiện");

        const events = await res.json();
        taskPageData.events = events;

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Get saved selected event
        let savedId = localStorage.getItem("btc_tasks_selected_event_id");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            taskPageData.selectedEventId = savedId;
        } else if (events.length > 0) {
            selector.value = events[0].idSuKien;
            taskPageData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_tasks_selected_event_id", events[0].idSuKien);
        }

        // Change listener
        selector.addEventListener("change", function () {
            taskPageData.selectedEventId = this.value;
            localStorage.setItem("btc_tasks_selected_event_id", this.value);
            loadTasksForSelectedEvent();
        });

    } catch (error) {
        console.error("Lỗi tải selector:", error);
    }
}

// ================= LOAD TASKS FOR SELECTED EVENT =================
async function loadTasksForSelectedEvent() {
    const eventId = taskPageData.selectedEventId;
    if (!eventId) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/tasks/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải danh sách công việc");

        const tasks = await res.json();
        taskPageData.tasks = tasks;
        renderKanbanBoard(tasks);

    } catch (error) {
        console.error("Lỗi load tasks:", error);
        alert("Không tải được dữ liệu công việc!");
    }
}

// ================= RENDER KANBAN BOARD =================
function renderKanbanBoard(tasks) {
    const columns = {
        todo: { list: document.getElementById("list-todo"), count: document.getElementById("count-todo"), data: [] },
        inprogress: { list: document.getElementById("list-inprogress"), count: document.getElementById("count-inprogress"), data: [] },
        review: { list: document.getElementById("list-review"), count: document.getElementById("count-review"), data: [] },
        done: { list: document.getElementById("list-done"), count: document.getElementById("count-done"), data: [] }
    };

    // Clear all lists
    Object.values(columns).forEach(col => {
        if (col.list) col.list.innerHTML = "";
    });

    tasks.forEach(task => {
        const status = mapBackendStatusToKanban(task.trangThai);
        if (columns[status]) {
            columns[status].data.push(task);
        }
    });

    // Populate and update counts
    Object.keys(columns).forEach(key => {
        const col = columns[key];
        if (col.count) col.count.textContent = col.data.length;

        if (!col.list) return;

        if (col.data.length === 0) {
            col.list.innerHTML = '<div class="no-tasks" style="text-align:center; padding: 20px; color:#aaa; font-size: 13px;">Chưa có nhiệm vụ</div>';
            return;
        }

        col.data.forEach(task => {
            const priorityClass = getPriorityClass(task.tieuDe); // determine priority color mock
            const priorityText = getPriorityText(task.tieuDe);
            const assigneeName = task.nguoiPhuTrach || "Chưa phân công";

            col.list.innerHTML += `
                <div class="task-card" onclick="openTaskDetailModal(${task.idCongViec})">
                    <div class="task-priority ${priorityClass}">${priorityText}</div>
                    <h3 class="task-title">${task.tieuDe || task.tenCongViec || "Nhiệm vụ"}</h3>
                    <p style="font-size:12px; color:#888; margin-bottom:8px; line-height:1.4;">${task.moTa || "Chưa có mô tả"}</p>
                    <div class="task-footer">
                        <div class="task-assignee">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeName)}&background=0D5A9C&color=fff" alt="Assignee">
                            <span>${assigneeName}</span>
                        </div>
                        <div class="task-date">
                            <i class="fas fa-calendar"></i>
                            ${task.hanChot ? new Date(task.hanChot).toLocaleDateString("vi-VN") : "Hạn chót"}
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

function mapBackendStatusToKanban(trangThai) {
    if (!trangThai) return "todo";
    const statusLower = trangThai.toLowerCase();
    if (statusLower.includes("chưa") || statusLower === "todo") return "todo";
    if (statusLower.includes("tiến") || statusLower === "in-progress") return "inprogress";
    if (statusLower.includes("xem") || statusLower === "review") return "review";
    if (statusLower.includes("hoàn") || statusLower === "done" || statusLower === "completed") return "done";
    return "todo";
}

function mapKanbanStatusToBackend(status) {
    if (status === "todo") return "Chưa bắt đầu";
    if (status === "inprogress") return "Đang thực hiện";
    if (status === "review") return "Xem xét";
    if (status === "done") return "Hoàn thành";
    return "Chưa bắt đầu";
}

function getPriorityClass(title = "") {
    const lower = title.toLowerCase();
    if (lower.includes("gấp") || lower.includes("vip") || lower.includes("ký")) return "high";
    if (lower.includes("thiết kế") || lower.includes("hoàn tất")) return "medium";
    return "low";
}

function getPriorityText(title = "") {
    const lower = title.toLowerCase();
    if (lower.includes("gấp") || lower.includes("vip") || lower.includes("ký")) return "ƯU TIÊN CAO";
    if (lower.includes("thiết kế") || lower.includes("hoàn tất")) return "TRUNG BÌNH";
    return "ƯU TIÊN THẤP";
}

// ================= CREATE / EDIT MODAL =================
function openCreateTaskModal() {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Tạo nhiệm vụ mới';
    document.getElementById('taskForm').reset();
    taskPageData.currentTaskId = null;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function openEditTaskModal(taskId) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Chỉnh sửa nhiệm vụ';
    taskPageData.currentTaskId = taskId;

    await loadTaskData(taskId);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ================= LOAD TASK FOR EDIT =================
async function loadTaskData(taskId) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        document.getElementById('taskTitle').value = data.tieuDe || data.tenCongViec || '';
        document.getElementById('taskDescription').value = data.moTa || '';
        document.getElementById('taskStatus').value = mapBackendStatusToKanban(data.trangThai);
        document.getElementById('taskDeadline').value = data.hanChot ? data.hanChot.split('T')[0] : '';
        document.getElementById('taskAssignee').value = data.nguoiPhuTrach || '';
        document.getElementById('taskNotes').value = ''; // field optional

    } catch (error) {
        console.error('Lỗi load task:', error);
        alert('Không tải được dữ liệu nhiệm vụ');
    }
}

// ================= DETAIL MODAL =================
async function openTaskDetailModal(taskId) {
    const modal = document.getElementById('taskDetailModal');
    if (!modal) return;

    taskPageData.currentTaskId = taskId;
    await loadTaskDetailData(taskId);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskDetailModal() {
    const modal = document.getElementById('taskDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function editTaskFromDetail() {
    const id = taskPageData.currentTaskId;
    closeTaskDetailModal();
    openEditTaskModal(id);
}

async function loadTaskDetailData(taskId) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        const priorityText = getPriorityText(data.tieuDe);
        const priorityClass = getPriorityClass(data.tieuDe);

        document.getElementById('detailTaskTitle').textContent = data.tieuDe || data.tenCongViec || 'Nhiệm vụ';
        document.getElementById('detailDescription').textContent = data.moTa || 'Chưa có mô tả chi tiết';

        const pEl = document.getElementById('detailPriority');
        pEl.textContent = priorityText;
        pEl.className = `task-priority ${priorityClass}`;

        const statusKanban = mapBackendStatusToKanban(data.trangThai);
        const statusMap = {
            todo: { text: "CẦN LÀM", class: "todo" },
            inprogress: { text: "ĐANG THỰC HIỆN", class: "in-progress" },
            review: { text: "XEM XÉT", class: "review" },
            done: { text: "HOÀN THÀNH", class: "completed" }
        };
        const st = statusMap[statusKanban] || { text: "CẦN LÀM", class: "todo" };

        const sEl = document.getElementById('detailStatus');
        sEl.textContent = st.text;
        sEl.className = `task-status-badge ${st.class}`;

        document.getElementById('detailAssigneeName').textContent = data.nguoiPhuTrach || "Chưa phân công";
        document.getElementById('detailAssigneeAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nguoiPhuTrach || "User")}&background=0D5A9C&color=fff`;

        document.getElementById('detailDeadline').textContent = data.hanChot ? new Date(data.hanChot).toLocaleDateString("vi-VN") : "Không có";
        
        const isCompleted = statusKanban === "done";
        document.getElementById('detailProgressBar').style.width = isCompleted ? "100%" : (statusKanban === "review" ? "80%" : (statusKanban === "inprogress" ? "40%" : "0%"));
        document.getElementById('detailProgressText').textContent = isCompleted ? "100%" : (statusKanban === "review" ? "80%" : (statusKanban === "inprogress" ? "40%" : "0%"));

    } catch (error) {
        console.error('Lỗi load detail:', error);
        alert('Không tải được chi tiết nhiệm vụ');
    }
}

// ================= SAVE TASK =================
document.getElementById('taskForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const eventId = taskPageData.selectedEventId;
    if (!eventId) {
        alert("Vui lòng chọn sự kiện trước!");
        return;
    }

    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDescription').value;
    const statusKanban = document.getElementById('taskStatus').value;
    const deadlineVal = document.getElementById('taskDeadline').value;
    const assignee = document.getElementById('taskAssignee').value;

    const data = {
        tenCongViec: title,
        idSuKien: parseInt(eventId),
        tieuDe: title,
        moTa: desc,
        hanChot: deadlineVal ? new Date(deadlineVal).toISOString() : null,
        trangThai: mapKanbanStatusToBackend(statusKanban),
        nguoiPhuTrach: assignee || null
    };

    try {
        const token = localStorage.getItem("token");
        let response;

        if (taskPageData.currentTaskId) {
            response = await fetch(`${API_BASE}/tasks/${taskPageData.currentTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) alert('Đã cập nhật nhiệm vụ thành công');
        } else {
            response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) alert('Đã tạo nhiệm vụ mới thành công');
        }

        if (!response.ok) throw new Error();

        closeTaskModal();
        await loadTasksForSelectedEvent();

    } catch (error) {
        console.error(error);
        alert('Lưu nhiệm vụ thất bại');
    }
});

// ================= DELETE TASK =================
async function deleteTask() {
    const id = taskPageData.currentTaskId;
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error();

        alert('Đã xóa nhiệm vụ');
        closeTaskDetailModal();
        await loadTasksForSelectedEvent();

    } catch (error) {
        console.error(error);
        alert('Xóa thất bại');
    }
}

// Export functions to window
window.openCreateTaskModal = openCreateTaskModal;
window.openEditTaskModal = openEditTaskModal;
window.closeTaskModal = closeTaskModal;
window.openTaskDetailModal = openTaskDetailModal;
window.closeTaskDetailModal = closeTaskDetailModal;
window.editTaskFromDetail = editTaskFromDetail;
window.deleteTask = deleteTask;