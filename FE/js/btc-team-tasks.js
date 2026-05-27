// Team Tasks JavaScript

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
    document.body.style.overflow = 'hidden';
}
window.openCreateTaskModal = openCreateTaskModal;

function openEditTaskModal(taskId) {
    document.getElementById('taskModalTitle').textContent = 'Chỉnh sửa nhiệm vụ';
    currentTaskId = taskId;
    loadTaskData(taskId);
    document.getElementById('taskModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openEditTaskModal = openEditTaskModal;

function closeTaskModal() {
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

    closeTaskModal();
});

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
