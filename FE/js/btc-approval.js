// Approval Management JavaScript

// Global variables
let currentApprovalId = null;
let uploadedFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFilterTabs();
    initializeApprovalTypeChange();
    initializeFileUpload();
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
    });
}

// Approval Type Change Handler
function initializeApprovalTypeChange() {
    const approvalTypeSelect = document.getElementById('approvalType');
    const budgetSection = document.getElementById('budgetSection');

    if (approvalTypeSelect && budgetSection) {
        approvalTypeSelect.addEventListener('change', function() {
            if (this.value === 'budget') {
                budgetSection.style.display = 'block';
            } else {
                budgetSection.style.display = 'none';
            }
        });
    }
}

// File Upload Handler
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.size <= 10 * 1024 * 1024) { // 10MB limit
                    uploadedFiles.push(file);
                    addFileToList(file);
                } else {
                    alert(`File ${file.name} vượt quá 10MB`);
                }
            });
            // Reset input
            fileInput.value = '';
        });
    }
}

function addFileToList(file) {
    const fileList = document.getElementById('fileList');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = getFileIcon(file.name);
    
    fileItem.innerHTML = `
        <div class="file-item-info">
            <i class="${fileIcon}"></i>
            <span>${file.name}</span>
        </div>
        <button class="btn-remove-file" onclick="removeFile('${file.name}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    fileList.appendChild(fileItem);
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'default': 'fas fa-file'
    };
    return iconMap[ext] || iconMap['default'];
}

function removeFile(filename) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== filename);
    
    const fileList = document.getElementById('fileList');
    const fileItems = fileList.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.textContent.includes(filename)) {
            item.remove();
        }
    });
}

// Modal Functions
function openCreateApprovalModal() {
    const modal = document.getElementById('approvalModal');
    const modalTitle = document.getElementById('approvalModalTitle');
    
    modalTitle.textContent = 'Soạn hồ sơ phê duyệt';
    document.getElementById('approvalForm').reset();
    currentApprovalId = null;
    uploadedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('budgetSection').style.display = 'none';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApprovalModal() {
    const modal = document.getElementById('approvalModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function editApproval(approvalId) {
    const modal = document.getElementById('approvalModal');
    const modalTitle = document.getElementById('approvalModalTitle');
    
    modalTitle.textContent = 'Chỉnh sửa hồ sơ phê duyệt';
    currentApprovalId = approvalId;
    
    // Load approval data (mock data for now)
    loadApprovalData(approvalId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loadApprovalData(approvalId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            type: 'event',
            approver: 'bgh',
            title: 'Phê duyệt kế hoạch tổ chức Hội thảo Công nghệ 2024',
            description: 'Kế hoạch tổ chức Hội thảo Công nghệ Thường niên 2024 với quy mô 500 người tham dự...',
            expectedDate: '2024-12-15',
            priority: 'high'
        },
        4: {
            type: 'event',
            approver: 'bgh',
            title: 'Phê duyệt kế hoạch Ngày hội Việc làm 2024',
            description: 'Hồ sơ đang được soạn thảo...',
            expectedDate: '2024-12-20',
            priority: 'normal'
        }
    };

    const data = mockData[approvalId];
    if (data) {
        document.getElementById('approvalType').value = data.type;
        document.getElementById('approver').value = data.approver;
        document.getElementById('approvalTitle').value = data.title;
        document.getElementById('approvalDescription').value = data.description;
        document.getElementById('expectedDate').value = data.expectedDate;
        document.getElementById('priority').value = data.priority;
        
        // Show budget section if type is budget
        if (data.type === 'budget') {
            document.getElementById('budgetSection').style.display = 'block';
        }
    }
}

function saveDraft() {
    const formData = collectFormData();
    if (!formData.title) { alert('Vui lòng nhập tiêu đề yêu cầu'); return; }

    addApprovalToList(formData, 'draft');
    alert('Đã lưu nháp thành công');
    closeApprovalModal();
}

function collectFormData() {
    return {
        type: document.getElementById('approvalType').value,
        approver: document.getElementById('approver').value,
        title: document.getElementById('approvalTitle').value,
        description: document.getElementById('approvalDescription').value,
        expectedDate: document.getElementById('expectedDate').value,
        priority: document.getElementById('priority').value,
        totalBudget: document.getElementById('totalBudget')?.value,
        budgetSource: document.getElementById('budgetSource')?.value,
        additionalNotes: document.getElementById('additionalNotes').value,
        files: uploadedFiles
    };
}

// View Approval Detail
function viewApprovalDetail(approvalId) {
    const modal = document.getElementById('approvalDetailModal');
    currentApprovalId = approvalId;
    
    // Load approval detail data (mock data for now)
    loadApprovalDetailData(approvalId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApprovalDetailModal() {
    const modal = document.getElementById('approvalDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function loadApprovalDetailData(approvalId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            title: 'Phê duyệt kế hoạch tổ chức Hội thảo Công nghệ 2024',
            status: 'pending',
            type: 'Phê duyệt sự kiện',
            sender: 'Nguyễn Văn A',
            sentDate: '15/11/2024',
            approver: 'Ban Giám hiệu',
            description: 'Kế hoạch tổ chức Hội thảo Công nghệ Thường niên 2024 với quy mô 500 người tham dự, dự kiến tổ chức vào ngày 15/12/2024 tại Hội trường A1. Sự kiện bao gồm các phiên thảo luận chuyên đề, workshop thực hành và triển lãm công nghệ.'
        },
        2: {
            title: 'Phê duyệt ngân sách Workshop Khởi nghiệp',
            status: 'approved',
            type: 'Phê duyệt ngân sách',
            sender: 'Nguyễn Văn A',
            sentDate: '10/11/2024',
            approver: 'Ban Giám hiệu',
            approvedDate: '12/11/2024',
            description: 'Ngân sách tổng cộng 75,000,000 đ cho Workshop Khởi nghiệp Sinh viên bao gồm chi phí địa điểm, ăn uống, và thiết bị.'
        },
        3: {
            title: 'Phê duyệt địa điểm tổ chức Đêm nhạc Acoustic',
            status: 'rejected',
            type: 'Phê duyệt địa điểm',
            sender: 'Nguyễn Văn A',
            sentDate: '05/11/2024',
            approver: 'Ban Giám hiệu',
            rejectedDate: '07/11/2024',
            description: 'Đề xuất sử dụng Hội trường A1 để tổ chức Đêm nhạc Acoustic vào tối 20/12/2024.'
        }
    };

    const data = mockData[approvalId];
    if (data) {
        document.getElementById('detailTitle').textContent = data.title;
        
        const statusBadge = document.getElementById('detailStatus');
        statusBadge.className = 'status-badge ' + data.status;
        statusBadge.textContent = getStatusText(data.status);
        
        document.getElementById('detailType').textContent = data.type;
        document.getElementById('detailSender').textContent = data.sender;
        document.getElementById('detailSentDate').textContent = data.sentDate;
        document.getElementById('detailApprover').textContent = data.approver;
        document.getElementById('detailDescription').textContent = data.description;
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối',
        'draft': 'Nháp'
    };
    return statusMap[status] || status;
}

// Cancel Approval
function cancelApproval(approvalId) {
    if (confirm('Bạn có chắc chắn muốn hủy yêu cầu phê duyệt này?')) {
        console.log('Canceling approval:', approvalId);
        alert('Đã hủy yêu cầu phê duyệt');
        
        // Remove from UI
        const approvalItem = document.querySelector(`.approval-item[data-status="pending"]`);
        if (approvalItem) {
            approvalItem.remove();
        }
    }
}

// Delete Approval Draft
function deleteApproval(approvalId) {
    if (confirm('Bạn có chắc chắn muốn xóa bản nháp này?')) {
        console.log('Deleting approval draft:', approvalId);
        alert('Đã xóa bản nháp');
        
        // Remove from UI
        const approvalItem = document.querySelector(`.approval-item[data-status="draft"]`);
        if (approvalItem) {
            approvalItem.remove();
        }
    }
}

// Resubmit Approval
function resubmitApproval(approvalId) {
    editApproval(approvalId);
}

// Form Submission
document.getElementById('approvalForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = collectFormData();
    
    // Validate required fields
    if (!formData.type || !formData.approver || !formData.title || !formData.description) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    console.log('Submitting approval:', formData);

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

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const approvalModal = document.getElementById('approvalModal');
    const detailModal = document.getElementById('approvalDetailModal');
    
    if (e.target === approvalModal) {
        closeApprovalModal();
    }
    
    if (e.target === detailModal) {
        closeApprovalDetailModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeApprovalModal();
        closeApprovalDetailModal();
    }
});

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
            }
        });
    });
}
