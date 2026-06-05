// CTSV Approval Management JavaScript

const API_BASE = "http://localhost:5103/api";
let currentApprovalId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    initializeFilterTabs();
    initializeFilters();
    await loadApprovals();
});

// ==================== LOAD DATA ====================

async function loadApprovals() {
    try {
        const response = await fetch(`${API_BASE}/approvals`);
        const approvals = await response.json();

        renderApprovals(approvals);
        updateStatsFromData(approvals);

    } catch (error) {
        console.error("Error loading approvals:", error);
    }
}

function renderApprovals(approvals) {
    const container = document.getElementById('approvalList');
    if (!container) return;

    container.innerHTML = approvals.map(item => `
        <div class="approval-item" data-id="${item.id}" data-priority="${item.priority}">
            <h4>${item.name}</h4>
            <p>${item.type}</p>

            <button onclick="viewApprovalDetail(${item.id})">Xem</button>
            <button onclick="openApproveModal(${item.id})">Duyệt</button>
            <button onclick="openRejectModal(${item.id})">Từ chối</button>
        </div>
    `).join('');
}

// ==================== FILTER ====================

function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            applyFilters();
        });
    });
}

function initializeFilters() {
    document.getElementById('eventTypeFilter')
        ?.addEventListener('change', applyFilters);

    document.getElementById('dateFilter')
        ?.addEventListener('change', applyFilters);
}

async function applyFilters() {
    const eventType = document.getElementById('eventTypeFilter')?.value || "";
    const dateRange = document.getElementById('dateFilter')?.value || "";

    try {
        const response = await fetch(
            `${API_BASE}/approvals/filter?eventType=${eventType}&dateRange=${dateRange}`
        );

        const data = await response.json();
        renderApprovals(data);

    } catch (error) {
        console.error("Filter error:", error);
    }
}

// ==================== DETAIL ====================

async function viewApprovalDetail(approvalId) {
    try {
        const response = await fetch(`${API_BASE}/approvals/${approvalId}`);
        const approvalInfo = await response.json();

        document.getElementById('detailEventName').textContent = approvalInfo.name;
        document.getElementById('detailPriority').textContent = approvalInfo.priority;
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

        currentApprovalId = approvalId;

        document.getElementById('viewDetailModal').classList.add('active');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error("Error loading approval detail:", error);
    }
}

function closeViewDetailModal() {
    document.getElementById('viewDetailModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ==================== APPROVE ====================

async function openApproveModal(approvalId) {
    currentApprovalId = approvalId;

    const response = await fetch(`${API_BASE}/approvals/${approvalId}`);
    const approval = await response.json();

    document.getElementById('approveEventName').textContent = approval.name;
    document.getElementById('approveModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApproveModal() {
    document.getElementById('approveModal').classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('approveComment').value = '';
    currentApprovalId = null;
}

async function confirmApprove() {
    if (!currentApprovalId) return;

    const comment = document.getElementById('approveComment').value;
    const notify = document.getElementById('notifyOrganizer').checked;

    try {
        await fetch(`${API_BASE}/approvals/${currentApprovalId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment,
                notify
            })
        });

        alert("Đã phê duyệt hồ sơ thành công!");
        closeApproveModal();
        await loadApprovals();

    } catch (error) {
        console.error("Approve error:", error);
    }
}

// ==================== REJECT ====================

async function openRejectModal(approvalId) {
    currentApprovalId = approvalId;

    const response = await fetch(`${API_BASE}/approvals/${approvalId}`);
    const approval = await response.json();

    document.getElementById('rejectEventName').textContent = approval.name;
    document.getElementById('rejectModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectSuggestion').value = '';
    currentApprovalId = null;
}

async function confirmReject() {
    if (!currentApprovalId) return;

    const reason = document.getElementById('rejectReason').value;
    const suggestion = document.getElementById('rejectSuggestion').value;
    const allowResubmit = document.getElementById('allowResubmit').checked;

    if (!reason.trim()) {
        alert("Vui lòng nhập lý do từ chối");
        return;
    }

    try {
        await fetch(`${API_BASE}/approvals/${currentApprovalId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason,
                suggestion,
                allowResubmit
            })
        });

        alert("Đã từ chối hồ sơ");
        closeRejectModal();
        await loadApprovals();

    } catch (error) {
        console.error("Reject error:", error);
    }
}

// ==================== EXPORT ====================

async function exportPendingList() {
    window.open(`${API_BASE}/approvals/export`, "_blank");
}

// ==================== STATS ====================

function updateStatsFromData(data) {
    const pending = data.filter(x => x.status === "pending").length;
    const approved = data.filter(x => x.status === "approved").length;

    const pendingEl = document.querySelector('.pending-stat .stat-number');
    const approvedEl = document.querySelector('.approved-stat .stat-number');

    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
}

// ==================== MODAL HELPERS ====================

window.addEventListener('click', function (e) {
    ['approveModal', 'rejectModal', 'viewDetailModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeApproveModal();
        closeRejectModal();
        closeViewDetailModal();
    }
});