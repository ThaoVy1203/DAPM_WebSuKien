// BTC Approval Management JavaScript
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "https://localhost:7160/api";
}

let approvalPageData = {
    events: [],
    selectedEventId: null,
    approvals: [],
    currentApprovalId: null,
    uploadedFiles: []
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
    setupModals();
    initializeApprovalTypeChange();
    initializeFileUpload();
<<<<<<< HEAD
    initializeFilterSelect();
    await loadEventsSelector();
    await loadApprovalsForSelectedEvent();
});

// ================= SETUP MODALS =================
function setupModals() {
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeApprovalModal();
            closeApprovalDetailModal();
        }
    });

    window.addEventListener("click", function (e) {
        const modal1 = document.getElementById("approvalModal");
        const modal2 = document.getElementById("approvalDetailModal");
        if (e.target === modal1) closeApprovalModal();
        if (e.target === modal2) closeApprovalDetailModal();
=======
    initializeSearch();
});

// ── Tìm kiếm realtime ──────────────────────────────────────────────────────
function initializeSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(applyApprovalSearch, 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { clearTimeout(timer); applyApprovalSearch(); }
        if (e.key === 'Escape') { input.value = ''; applyApprovalSearch(); }
    });
}

function applyApprovalSearch() {
    const kw = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const items = document.querySelectorAll('.approval-item');
    let visible = 0;
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const show = !kw || text.includes(kw);
        item.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    // Hiện số kết quả
    let badge = document.getElementById('approvalSearchBadge');
    if (!badge) {
        badge = document.createElement('p');
        badge.id = 'approvalSearchBadge';
        badge.style.cssText = 'font-size:13px;color:#6B7280;margin:8px 0 4px;';
        document.querySelector('.approval-list')?.before(badge);
    }
    badge.textContent = kw ? `Tìm thấy ${visible} / ${items.length} yêu cầu cho "${kw}"` : '';
}

// Filter Tabs
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const approvalItems = document.querySelectorAll('.approval-item');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');

            // Get filter status
            const filterStatus = this.getAttribute('data-status');

            // Filter approval items
            approvalItems.forEach(item => {
                if (filterStatus === 'all') {
                    item.style.display = '';
                } else {
                    const itemStatus = item.getAttribute('data-status');
                    item.style.display = itemStatus === filterStatus ? '' : 'none';
                }
            });
        });
>>>>>>> origin/Nguyen
    });
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
        approvalPageData.events = events;

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Set selected event
        let savedId = localStorage.getItem("btc_approval_selected_event_id");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            approvalPageData.selectedEventId = savedId;
        } else if (events.length > 0) {
            selector.value = events[0].idSuKien;
            approvalPageData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_approval_selected_event_id", events[0].idSuKien);
        }

        // Change listener
        selector.addEventListener("change", function () {
            approvalPageData.selectedEventId = this.value;
            localStorage.setItem("btc_approval_selected_event_id", this.value);
            loadApprovalsForSelectedEvent();
        });

    } catch (error) {
        console.error("Lỗi tải selector:", error);
    }
}

// ================= LOAD APPROVALS FOR SELECTED EVENT =================
async function loadApprovalsForSelectedEvent() {
    const eventId = approvalPageData.selectedEventId;
    if (!eventId) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/PheDuyet/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải yêu cầu phê duyệt");

        const approvals = await res.json();
        approvalPageData.approvals = approvals;
        renderApprovals(approvals);
        updateStats(approvals);
        initializeFilterTabs();

    } catch (error) {
        console.error("Lỗi load approvals:", error);
    }
}

<<<<<<< HEAD
// ================= UPDATE STATS CARDS =================
function updateStats(data) {
    const pending = data.filter(a => a.trangThai === "pending" || a.trangThai === "Chờ duyệt").length;
    const approved = data.filter(a => a.trangThai === "approved" || a.trangThai === "Đã duyệt").length;
    const rejected = data.filter(a => a.trangThai === "rejected" || a.trangThai === "Từ chối").length;
    const draft = data.filter(a => a.trangThai === "draft" || a.trangThai === "Nháp").length;
=======
function saveDraft() {
    const formData = collectFormData();
    if (!formData.title) { alert('Vui lòng nhập tiêu đề yêu cầu'); return; }

    addApprovalToList(formData, 'draft');
    alert('Đã lưu nháp thành công');
    closeApprovalModal();
}
>>>>>>> origin/Nguyen

    const cards = document.querySelectorAll(".approval-stats .stat-card");
    if (cards.length >= 4) {
        cards[0].querySelector(".stat-number").textContent = pending;
        cards[1].querySelector(".stat-number").textContent = approved;
        cards[2].querySelector(".stat-number").textContent = rejected;
        cards[3].querySelector(".stat-number").textContent = draft;
    }
}

// ================= RENDER =================
function renderApprovals(data) {
    const container = document.querySelector(".approval-list");
    if (!container) return;

    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = '<div class="loading">Không có yêu cầu phê duyệt nào phù hợp.</div>';
        return;
    }

    data.forEach(item => {
        const statusMap = {
            pending: { text: "Chờ duyệt", class: "pending" },
            approved: { text: "Đã duyệt", class: "approved" },
            rejected: { text: "Từ chối", class: "rejected" },
            draft: { text: "Nháp", class: "draft" }
        };
        const status = statusMap[item.trangThai] || { text: item.trangThai, class: "pending" };

<<<<<<< HEAD
        const typeMap = {
            event: "Sự kiện",
            budget: "Ngân sách",
            venue: "Địa điểm",
            other: "Khác"
        };
        const typeText = typeMap[item.loai] || item.loai;

        container.innerHTML += `
            <div class="approval-item" data-status="${item.trangThai}">
                <div class="approval-header">
                    <div class="approval-title-section">
                        <h3>${item.tieuDe}</h3>
                        <span class="approval-type ${item.loai}">${typeText}</span>
                    </div>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
                <div class="approval-body">
                    <div class="approval-info">
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <span>Người gửi: ${item.nguoiGui || "Người dùng"}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <span>Ngày gửi: ${item.ngayGui}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-user-tie"></i>
                            <span>Người duyệt: ${item.nguoiDuyet || "Ban Giám hiệu"}</span>
                        </div>
                    </div>
                    <div class="approval-description">
                        <p>${item.moTa}</p>
                    </div>
                </div>
                <div class="approval-footer">
                    <button class="btn-action-secondary" onclick="viewApprovalDetail(${item.id})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    ${item.trangThai === 'draft' || item.trangThai === 'rejected' ? `
                        <button class="btn-action-secondary" onclick="editApproval(${item.id})">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </button>
                    ` : ''}
                    ${item.trangThai === 'pending' ? `
                        <button class="btn-action-danger" onclick="cancelApproval(${item.id})">
                            <i class="fas fa-times"></i> Hủy yêu cầu
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
}
=======
    // Thêm item mới vào danh sách
    const status = currentApprovalId ? 'pending' : 'pending';
    addApprovalToList(formData, status);

    if (currentApprovalId) {
        alert('Đã cập nhật và gửi yêu cầu phê duyệt thành công');
    } else {
        alert('Đã gửi yêu cầu phê duyệt thành công');
    }

    closeApprovalModal();
});
>>>>>>> origin/Nguyen

// ================= FILTER TABS =================
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabButtons.forEach(button => {
        // Remove existing listeners by cloning
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);

<<<<<<< HEAD
        newBtn.addEventListener("click", function () {
            document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const status = this.dataset.status;
            if (status === "all") {
                renderApprovals(approvalPageData.approvals);
            } else {
                renderApprovals(approvalPageData.approvals.filter(a => a.trangThai === status));
=======
// ── Thêm item mới vào danh sách ────────────────────────────────────────────
function addApprovalToList(data, status) {
    const list = document.querySelector('.approval-list');
    if (!list) return;

    const typeMap    = { event:'Sự kiện', budget:'Ngân sách', venue:'Địa điểm', other:'Khác' };
    const approverMap = { bgh:'Ban Giám hiệu', hsv:'Hội Sinh viên', doan:'Đoàn Trường' };
    const statusMap  = { pending:'Chờ duyệt', draft:'Nháp' };
    const today      = new Date().toLocaleDateString('vi-VN');
    const newId      = Date.now(); // id tạm

    const typeLabel     = typeMap[data.type]     || data.type     || 'Khác';
    const approverLabel = approverMap[data.approver] || data.approver || '';
    const statusLabel   = statusMap[status]      || status;

    const isDraft = status === 'draft';

    const item = document.createElement('div');
    item.className = 'approval-item';
    item.dataset.status = status;
    item.innerHTML = `
        <div class="approval-header">
            <div class="approval-title-section">
                <h3>${data.title || '(Chưa có tiêu đề)'}</h3>
                <span class="approval-type ${data.type || 'other'}">${typeLabel}</span>
            </div>
            <span class="status-badge ${status}">${statusLabel}</span>
        </div>
        <div class="approval-body">
            <div class="approval-info">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span>${isDraft ? 'Người tạo' : 'Người gửi'}: Nguyễn Văn A</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${isDraft ? 'Lưu lần cuối' : 'Ngày gửi'}: ${today}</span>
                </div>
                ${!isDraft && approverLabel ? `
                <div class="info-item">
                    <i class="fas fa-user-tie"></i>
                    <span>Người duyệt: ${approverLabel}</span>
                </div>` : ''}
            </div>
            <div class="approval-description">
                <p>${(data.description || '').substring(0, 120)}${(data.description || '').length > 120 ? '...' : ''}</p>
            </div>
        </div>
        <div class="approval-footer">
            ${isDraft ? `
                <button class="btn-action-primary" onclick="editApproval(${newId})">
                    <i class="fas fa-edit"></i> Tiếp tục soạn
                </button>
                <button class="btn-action-danger" onclick="this.closest('.approval-item').remove()">
                    <i class="fas fa-trash"></i> Xóa nháp
                </button>
            ` : `
                <button class="btn-action-secondary" onclick="viewApprovalDetail(${newId})">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
                <button class="btn-action-secondary" onclick="editApproval(${newId})">
                    <i class="fas fa-edit"></i> Chỉnh sửa
                </button>
                <button class="btn-action-danger" onclick="cancelApproval(${newId})">
                    <i class="fas fa-times"></i> Hủy yêu cầu
                </button>
            `}
        </div>
    `;

    // Thêm vào đầu danh sách
    list.insertBefore(item, list.firstChild);

    // Cập nhật số liệu stat card
    updateApprovalStats(status, 1);

    // Scroll đến item mới
    item.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateApprovalStats(status, delta) {
    const map = { pending: '.pending-stat', draft: '.draft-stat', approved: '.approved-stat', rejected: '.rejected-stat' };
    const sel = map[status];
    if (!sel) return;
    const el = document.querySelector(`${sel} .stat-number`);
    if (el) el.textContent = parseInt(el.textContent || '0') + delta;
}

// Filter Select Handler
const filterSelect = document.querySelector('.filter-select');
if (filterSelect) {
    filterSelect.addEventListener('change', function() {
        const filterValue = this.value;
        const approvalItems = document.querySelectorAll('.approval-item');
        
        approvalItems.forEach(item => {
            const typeSpan = item.querySelector('.approval-type');
            if (!typeSpan) return;
            
            if (filterValue === 'all') {
                item.style.display = '';
            } else {
                const itemType = typeSpan.classList.contains(filterValue);
                item.style.display = itemType ? '' : 'none';
>>>>>>> origin/Nguyen
            }
        });
    });
}

// ================= APPROVAL TYPE =================
function initializeApprovalTypeChange() {
    const approvalTypeSelect = document.getElementById("approvalType");
    const budgetSection = document.getElementById("budgetSection");

    if (approvalTypeSelect && budgetSection) {
        approvalTypeSelect.addEventListener("change", function () {
            budgetSection.style.display = this.value === "budget" ? "block" : "none";
        });
    }
}

// ================= FILE UPLOAD =================
function initializeFileUpload() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", function (e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.size <= 10 * 1024 * 1024) {
                approvalPageData.uploadedFiles.push(file);
                addFileToList(file);
            } else {
                alert(`${file.name} vượt quá 10MB`);
            }
        });
        fileInput.value = "";
    });
}

function addFileToList(file) {
    const fileList = document.getElementById("fileList");
    if (fileList) {
        fileList.innerHTML += `
            <div class="file-item">
                <span>${file.name}</span>
                <button type="button" onclick="removeFile('${file.name}')">X</button>
            </div>
        `;
    }
}

function removeFile(filename) {
    approvalPageData.uploadedFiles = approvalPageData.uploadedFiles.filter(f => f.name !== filename);
    loadFileList();
}

function loadFileList() {
    const fileList = document.getElementById("fileList");
    if (fileList) {
        fileList.innerHTML = "";
        approvalPageData.uploadedFiles.forEach(addFileToList);
    }
}

// ================= MODAL CONTROLS =================
function openCreateApprovalModal() {
    approvalPageData.currentApprovalId = null;
    document.getElementById("approvalForm").reset();
    approvalPageData.uploadedFiles = [];
    loadFileList();
    document.getElementById("approvalModal").classList.add("active");
}

function closeApprovalModal() {
    document.getElementById("approvalModal").classList.remove("active");
}

function closeApprovalDetailModal() {
    document.getElementById("approvalDetailModal").classList.remove("active");
}

// ================= FORM UTILS =================
function collectFormData() {
    return {
        loai: document.getElementById("approvalType").value,
        nguoiDuyet: document.getElementById("approver").options[document.getElementById("approver").selectedIndex]?.text || "Cấp trên",
        tieuDe: document.getElementById("approvalTitle").value,
        moTa: document.getElementById("approvalDescription").value,
        ngayGui: new Date().toLocaleDateString("vi-VN"),
        nguoiGui: "Trưởng Ban Tổ chức"
    };
}

// ================= SAVE / SUBMIT =================
async function saveApproval(trangThai) {
    const eventId = approvalPageData.selectedEventId;
    if (!eventId) return;

    const formData = collectFormData();
    const payload = {
        eventId: parseInt(eventId),
        tieuDe: formData.tieuDe,
        loai: formData.loai,
        trangThai: trangThai,
        nguoiGui: formData.nguoiGui,
        nguoiDuyet: formData.nguoiDuyet,
        moTa: formData.moTa
    };

    try {
        const token = localStorage.getItem("token");
        let res;

        if (approvalPageData.currentApprovalId) {
            res = await fetch(`${window.API_BASE}/PheDuyet/${approvalPageData.currentApprovalId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`${window.API_BASE}/PheDuyet`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) throw new Error("Lỗi lưu phê duyệt");

        closeApprovalModal();
        await loadApprovalsForSelectedEvent();

    } catch (error) {
        console.error("Lỗi lưu phê duyệt:", error);
        alert("Lưu yêu cầu phê duyệt thất bại!");
    }
}

document.getElementById("approvalForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    await saveApproval("pending"); // Gửi phê duyệt
    alert("Đã gửi yêu cầu phê duyệt thành công!");
});

window.saveDraft = async function() {
    await saveApproval("draft");
    alert("Đã lưu bản nháp thành công!");
};

// ================= EDIT =================
function editApproval(id) {
    const item = approvalPageData.approvals.find(a => a.id == id);
    if (!item) return;

    approvalPageData.currentApprovalId = id;

    document.getElementById("approvalType").value = item.loai;
    document.getElementById("approvalTitle").value = item.tieuDe;
    document.getElementById("approvalDescription").value = item.moTa;
    
    // Trigger display of budget section if needed
    const budgetSection = document.getElementById("budgetSection");
    if (budgetSection) {
        budgetSection.style.display = item.loai === "budget" ? "block" : "none";
    }

    document.getElementById("approvalModal").classList.add("active");
}

// ================= VIEW DETAIL =================
function viewApprovalDetail(id) {
    const item = approvalPageData.approvals.find(a => a.id == id);
    if (!item) return;

    document.getElementById("detailTitle").textContent = item.tieuDe;
    document.getElementById("detailDescription").textContent = item.moTa;
    document.getElementById("detailSender").textContent = item.nguoiGui || "Trưởng Ban Tổ chức";
    document.getElementById("detailSentDate").textContent = item.ngayGui;
    document.getElementById("detailApprover").textContent = item.nguoiDuyet || "Ban Giám hiệu";

    const statusMap = {
        pending: { text: "Chờ duyệt", class: "pending" },
        approved: { text: "Đã duyệt", class: "approved" },
        rejected: { text: "Từ chối", class: "rejected" },
        draft: { text: "Nháp", class: "draft" }
    };
    const status = statusMap[item.trangThai] || { text: item.trangThai, class: "pending" };
    document.getElementById("detailStatus").textContent = status.text;
    document.getElementById("detailStatus").className = `status-badge ${status.class}`;

    document.getElementById("approvalDetailModal").classList.add("active");
}

// ================= CANCEL =================
async function cancelApproval(id) {
    if (!confirm("Hủy yêu cầu phê duyệt này?")) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/PheDuyet/cancel/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi hủy phê duyệt");
        await loadApprovalsForSelectedEvent();

    } catch (error) {
        console.error("Lỗi hủy phê duyệt:", error);
        alert("Hủy yêu cầu thất bại!");
    }
}

// ================= DELETE =================
async function deleteApproval(id) {
    if (!confirm("Xóa bản nháp này?")) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/PheDuyet/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi xóa phê duyệt");
        await loadApprovalsForSelectedEvent();

    } catch (error) {
        console.error("Lỗi xóa phê duyệt:", error);
        alert("Xóa bản nháp thất bại!");
    }
}

// ================= FILTER SELECT =================
function initializeFilterSelect() {
    const filterSelect = document.querySelector(".filter-select");
    if (!filterSelect) return;

    filterSelect.addEventListener("change", function () {
        const val = this.value;
        if (val === "all") {
            renderApprovals(approvalPageData.approvals);
        } else {
            renderApprovals(approvalPageData.approvals.filter(a => a.loai === val));
        }
    });
}

// Export functions to window
window.openCreateApprovalModal = openCreateApprovalModal;
window.closeApprovalModal = closeApprovalModal;
window.closeApprovalDetailModal = closeApprovalDetailModal;
window.editApproval = editApproval;
window.viewApprovalDetail = viewApprovalDetail;
window.cancelApproval = cancelApproval;
window.deleteApproval = deleteApproval;
window.removeFile = removeFile;