// Team Tasks JavaScript
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "https://localhost:7160/api";
}

<<<<<<< HEAD
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
        const res = await fetch(`${window.API_BASE}/NguoiDung`, {
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
        const res = await fetch(`${window.API_BASE}/SuKien`, {
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
        const res = await fetch(`${window.API_BASE}/tasks/su-kien/${eventId}`, {
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
=======
let currentTaskId = null;
let taskIdCounter = 100;

// ── Khởi tạo ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    initSearch();
    initEventDropdown();
    // Gán data-status cho các cột
    const cols = document.querySelectorAll('.kanban-column');
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    cols.forEach((col, i) => { if (statuses[i]) col.dataset.status = statuses[i]; });
});

// ── Tìm kiếm header ─────────────────────────────────────────────────────────
function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const kw = input.value.trim().toLowerCase();
            document.querySelectorAll('.task-card').forEach(card => {
                card.style.display = !kw || card.textContent.toLowerCase().includes(kw) ? '' : 'none';
            });
            updateColumnCounts();
        }, 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; document.querySelectorAll('.task-card').forEach(c => c.style.display = ''); updateColumnCounts(); }
    });
}

// ── Dropdown lọc theo sự kiện ───────────────────────────────────────────────
function initEventDropdown() {
    const btn = document.querySelector('.event-dropdown');
    if (!btn) return;

    // Tạo dropdown menu
    const menu = document.createElement('div');
    menu.id = 'eventDropdownMenu';
    menu.style.cssText = `
        position:absolute; top:calc(100% + 6px); left:0; min-width:260px;
        background:white; border:1px solid #E5E7EB; border-radius:10px;
        box-shadow:0 8px 24px rgba(0,0,0,0.12); z-index:9999; display:none;
        overflow:hidden;
    `;

    const events = [
        { value: '', label: 'Tất cả sự kiện' },
        { value: 'hoi-nghi-cong-nghe', label: 'Hội nghị Công nghệ Thường niên 2024' },
        { value: 'workshop-khoi-nghiep', label: 'Workshop Khởi nghiệp Sinh viên' },
        { value: 'ngay-hoi-viec-lam', label: 'Ngày hội Việc làm 2024' },
    ];

    events.forEach(ev => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:12px 16px;cursor:pointer;font-size:14px;color:#374151;transition:background 0.15s;';
        item.textContent = ev.label;
        item.addEventListener('mouseenter', () => item.style.background = '#F9FAFB');
        item.addEventListener('mouseleave', () => item.style.background = 'white');
        item.addEventListener('click', () => {
            btn.childNodes[0].textContent = ev.label + ' ';
            menu.style.display = 'none';
            filterTasksByEvent(ev.value);
        });
        menu.appendChild(item);
    });

    btn.style.position = 'relative';
    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(menu);

    btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => menu.style.display = 'none');
}

function filterTasksByEvent(eventValue) {
    document.querySelectorAll('.task-card').forEach(card => {
        if (!eventValue) {
            card.style.display = '';
        } else {
            // Dùng data-event attribute — chính xác 100%
            const cardEvent = card.dataset.event || '';
            card.style.display = cardEvent === eventValue ? '' : 'none';
        }
    });
    updateColumnCounts();
}

// ── Cập nhật số lượng task trong cột ────────────────────────────────────────
function updateColumnCounts() {
    document.querySelectorAll('.kanban-column').forEach(col => {
        const visible = [...col.querySelectorAll('.task-card')].filter(c => c.style.display !== 'none').length;
        const countEl = col.querySelector('.task-count');
        if (countEl) countEl.textContent = visible;
    });
}

// ── Modal Tạo / Sửa task ────────────────────────────────────────────────────
function openCreateTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Tạo nhiệm vụ mới';
    document.getElementById('taskForm').reset();
    currentTaskId = null;
    document.getElementById('taskModal').classList.add('active');
>>>>>>> origin/Nguyen
    document.body.style.overflow = 'hidden';
}
window.openCreateTaskModal = openCreateTaskModal;

<<<<<<< HEAD
async function openEditTaskModal(taskId) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Chỉnh sửa nhiệm vụ';
    taskPageData.currentTaskId = taskId;

    await loadTaskData(taskId);

    modal.classList.add('active');
=======
function openEditTaskModal(taskId) {
    document.getElementById('taskModalTitle').textContent = 'Chỉnh sửa nhiệm vụ';
    currentTaskId = taskId;
    loadTaskData(taskId);
    document.getElementById('taskModal').classList.add('active');
>>>>>>> origin/Nguyen
    document.body.style.overflow = 'hidden';
}
window.openEditTaskModal = openEditTaskModal;

function closeTaskModal() {
<<<<<<< HEAD
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
        const res = await fetch(`${window.API_BASE}/tasks/${taskId}`, {
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
        const res = await fetch(`${window.API_BASE}/tasks/${taskId}`, {
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
            response = await fetch(`${window.API_BASE}/tasks/${taskPageData.currentTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) alert('Đã cập nhật nhiệm vụ thành công');
        } else {
            response = await fetch(`${window.API_BASE}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) alert('Đã tạo nhiệm vụ mới thành công');
        }
=======
    document.getElementById('taskModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
window.closeTaskModal = closeTaskModal;

function loadTaskData(taskId) {
    const mock = {
        1: { title:'Ký kết hợp đồng ăn uống cho Tiệc tối VIP', priority:'high', status:'todo', deadline:'2024-10-12', progress:0, assignee:'1', description:'', notes:'' },
        2: { title:'Hoàn tất danh sách diễn giả và sắp xếp đi lại', priority:'medium', status:'todo', deadline:'2024-10-15', progress:0, assignee:'5', description:'', notes:'' },
        3: { title:'Thiết kế banner mạng xã hội cho đợt Tuyển dụng', priority:'low', status:'in-progress', deadline:'2024-10-08', progress:60, assignee:'6', description:'', notes:'' },
        4: { title:'Kiểm tra các giao thức an toàn cho sự kiện trong khuôn viên', priority:'high', status:'review', deadline:'2024-10-10', progress:90, assignee:'4', description:'', notes:'' },
    };
    const d = mock[taskId]; if (!d) return;
    document.getElementById('taskTitle').value       = d.title;
    document.getElementById('taskDescription').value = d.description;
    document.getElementById('taskPriority').value    = d.priority;
    document.getElementById('taskStatus').value      = d.status;
    document.getElementById('taskDeadline').value    = d.deadline;
    document.getElementById('taskProgress').value    = d.progress;
    document.getElementById('taskAssignee').value    = d.assignee;
    document.getElementById('taskNotes').value       = d.notes;
}

// ── Form submit — thêm card vào đúng cột ────────────────────────────────────
document.getElementById('taskForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const title    = document.getElementById('taskTitle').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status   = document.getElementById('taskStatus').value;
    const deadline = document.getElementById('taskDeadline').value;
    const progress = parseInt(document.getElementById('taskProgress').value) || 0;

    if (!title) { alert('Vui lòng nhập tiêu đề nhiệm vụ'); return; }

    if (currentTaskId) {
        // Cập nhật card hiện có
        const card = document.querySelector(`.task-card[data-id="${currentTaskId}"]`);
        if (card) {
            const titleEl = card.querySelector('.task-title');
            if (titleEl) titleEl.textContent = title;
            const priEl = card.querySelector('.task-priority');
            if (priEl) { priEl.className = `task-priority ${priority}`; priEl.textContent = getPriorityText(priority); }
        }
        alert('Đã cập nhật nhiệm vụ thành công');
    } else {
        // Tạo card mới
        const newId = ++taskIdCounter;
        const card  = buildTaskCard({ id: newId, title, priority, status, deadline, progress });

        // Map status → cột (dựa vào data-status đã gán lúc init)
        const col = [...document.querySelectorAll('.kanban-column')]
            .find(c => c.dataset.status === status);
        const list = col?.querySelector('.tasks-list');

        if (list) {
            list.appendChild(card);
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            // Fallback: cột đầu tiên
            document.querySelector('.tasks-list')?.appendChild(card);
        }

        updateColumnCounts();
        alert('Đã tạo nhiệm vụ mới thành công');
    }
>>>>>>> origin/Nguyen

        if (!response.ok) throw new Error();

<<<<<<< HEAD
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
        const response = await fetch(`${window.API_BASE}/tasks/${id}`, {
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
=======
function buildTaskCard(data) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = data.id;

    // Gán data-event từ sự kiện đang được lọc
    const activeEventBtn = document.querySelector('.event-dropdown');
    const activeEventText = activeEventBtn?.childNodes[0]?.textContent?.trim() || '';
    const eventMap = {
        'Hội nghị Công nghệ Thường niên 2024': 'hoi-nghi-cong-nghe',
        'Workshop Khởi nghiệp Sinh viên':       'workshop-khoi-nghiep',
        'Ngày hội Việc làm 2024':               'ngay-hoi-viec-lam',
    };
    card.dataset.event = eventMap[activeEventText] || 'hoi-nghi-cong-nghe';

    let deadlineText = '';
    if (data.deadline) {
        const d = new Date(data.deadline);
        deadlineText = `${String(d.getDate()).padStart(2,'0')} TH${String(d.getMonth()+1).padStart(2,'0')}`;
    }

    card.innerHTML = `
        <div class="task-priority ${data.priority}">${getPriorityText(data.priority)}</div>
        <h3 class="task-title">${data.title}</h3>
        ${data.progress > 0 ? `
        <div class="task-progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${data.progress}%"></div></div>
        </div>` : ''}
        <div class="task-footer">
            <div class="task-assignee">
                <img src="https://ui-avatars.com/api/?name=New&background=0D5A9C&color=fff" alt="Assignee">
                <span>Chưa gán</span>
            </div>
            ${deadlineText ? `<div class="task-date"><i class="fas fa-calendar"></i> ${deadlineText}</div>` : ''}
        </div>
    `;

    card.addEventListener('click', () => openTaskDetailModal(data.id));
    return card;
}

function getPriorityText(p) {
    return { high:'ƯU TIÊN CAO', medium:'TRUNG BÌNH', low:'ƯU TIÊN THẤP' }[p] || p;
}

// ── Modal Chi tiết ──────────────────────────────────────────────────────────
function openTaskDetailModal(taskId) {
    currentTaskId = taskId;
    loadTaskDetailData(taskId);
    document.getElementById('taskDetailModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openTaskDetailModal = openTaskDetailModal;

function closeTaskDetailModal() {
    document.getElementById('taskDetailModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
window.closeTaskDetailModal = closeTaskDetailModal;

function editTaskFromDetail() { closeTaskDetailModal(); openEditTaskModal(currentTaskId); }
window.editTaskFromDetail = editTaskFromDetail;

function loadTaskDetailData(taskId) {
    const mock = {
        1: { title:'Ký kết hợp đồng ăn uống cho Tiệc tối VIP', description:'Liên hệ và ký kết hợp đồng với nhà cung cấp dịch vụ ăn uống cho tiệc tối VIP.', priority:'high', priorityText:'ƯU TIÊN CAO', status:'todo', statusText:'CẦN LÀM', assigneeName:'TS. Aris', assigneeAvatar:'https://ui-avatars.com/api/?name=TS+Aris&background=0D5A9C&color=fff', deadline:'12/10/2024', progress:0, notes:'Cần hoàn thành trước ngày 12/10' },
        2: { title:'Hoàn tất danh sách diễn giả và sắp xếp đi lại', description:'Liên hệ và xác nhận danh sách diễn giả, sắp xếp lịch trình di chuyển.', priority:'medium', priorityText:'TRUNG BÌNH', status:'todo', statusText:'CẦN LÀM', assigneeName:'Sarah L.', assigneeAvatar:'https://ui-avatars.com/api/?name=Sarah+L&background=10B981&color=fff', deadline:'15/10/2024', progress:0, notes:'' },
        3: { title:'Thiết kế banner mạng xã hội cho đợt Tuyển dụng', description:'Thiết kế banner quảng cáo cho các nền tảng mạng xã hội.', priority:'low', priorityText:'ƯU TIÊN THẤP', status:'in-progress', statusText:'ĐANG THỰC HIỆN', assigneeName:'Mike T.', assigneeAvatar:'https://ui-avatars.com/api/?name=Mike+T&background=1976D2&color=fff', deadline:'08/10/2024', progress:60, notes:'Đã hoàn thành 60%' },
        4: { title:'Kiểm tra các giao thức an toàn cho sự kiện trong khuôn viên', description:'Kiểm tra và đảm bảo các giao thức an toàn, phòng cháy chữa cháy.', priority:'high', priorityText:'ƯU TIÊN CAO', status:'review', statusText:'XEM XÉT', assigneeName:'D/u Jane', assigneeAvatar:'https://ui-avatars.com/api/?name=D+Jane&background=F59E0B&color=fff', deadline:'HÔM NAY', progress:90, notes:'Đang chờ phê duyệt' },
    };
    const d = mock[taskId];
    if (!d) return;
    document.getElementById('detailTaskTitle').textContent  = d.title;
    document.getElementById('detailDescription').textContent = d.description;
    const priEl = document.getElementById('detailPriority');
    priEl.textContent = d.priorityText; priEl.className = `task-priority ${d.priority}`;
    const stEl = document.getElementById('detailStatus');
    stEl.textContent = d.statusText; stEl.className = `task-status-badge ${d.status}`;
    document.getElementById('detailAssigneeName').textContent = d.assigneeName;
    document.getElementById('detailAssigneeAvatar').src       = d.assigneeAvatar;
    document.getElementById('detailDeadline').textContent     = d.deadline;
    document.getElementById('detailProgressBar').style.width  = d.progress + '%';
    document.getElementById('detailProgressText').textContent = d.progress + '%';
    document.getElementById('detailNotes').textContent        = d.notes;
}

// ── Đóng modal ──────────────────────────────────────────────────────────────
window.addEventListener('click', e => {
    if (e.target === document.getElementById('taskModal'))       closeTaskModal();
    if (e.target === document.getElementById('taskDetailModal')) closeTaskDetailModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTaskModal(); closeTaskDetailModal(); }
});
>>>>>>> origin/Nguyen
