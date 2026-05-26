// Reports Management JavaScript
const API_BASE_URL = "https://localhost:7160/api";
// Global variables
let currentReportId = null;
let uploadedFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFilterTabs();
    initializeFilterControls();
    initializeFileUpload();
});

// Filter Tabs
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const reportCards = document.querySelectorAll('.report-card');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-type');

            reportCards.forEach(card => {
                if (filterType === 'all') {
                    card.style.display = 'block';
                } else {
                    const cardType = card.getAttribute('data-type');
                    card.style.display = cardType === filterType ? 'block' : 'none';
                }
            });
        });
    });
}

// Filter Controls
function initializeFilterControls() {
    const eventFilter = document.getElementById('eventFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (eventFilter) {
        eventFilter.addEventListener('change', applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const eventValue = document.getElementById('eventFilter').value;
    const statusValue = document.getElementById('statusFilter').value;
    const reportCards = document.querySelectorAll('.report-card');

    reportCards.forEach(card => {
        let showCard = true;

        if (statusValue !== 'all') {
            const cardStatus = card.getAttribute('data-status');
            if (cardStatus !== statusValue) {
                showCard = false;
            }
        }

        card.style.display = showCard ? 'block' : 'none';
    });
}

// File Upload Handler
function initializeFileUpload() {
    const reportFileInput = document.getElementById('reportFileInput');
    const uploadFileInput = document.getElementById('uploadFileInput');

    if (reportFileInput) {
        reportFileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files, 'reportFileList');
        });
    }

    if (uploadFileInput) {
        uploadFileInput.addEventListener('change', function(e) {
            handleSingleFileSelection(e.target.files[0], 'uploadFileDisplay');
        });
    }
}

function handleFileSelection(files, listId) {
    const fileList = document.getElementById(listId);
    Array.from(files).forEach(file => {
        if (file.size <= 20 * 1024 * 1024) { // 20MB limit
            uploadedFiles.push(file);
            addFileToList(file, listId);
        } else {
            alert(`File ${file.name} vượt quá 20MB`);
        }
    });
}

function handleSingleFileSelection(file, displayId) {
    const fileDisplay = document.getElementById(displayId);
    if (!file) return;

    if (file.size <= 20 * 1024 * 1024) {
        const fileIcon = getFileIcon(file.name);
        fileDisplay.innerHTML = `
            <div class="file-item">
                <div class="file-item-info">
                    <i class="${fileIcon}"></i>
                    <span>${file.name}</span>
                </div>
            </div>
        `;
    } else {
        alert(`File ${file.name} vượt quá 20MB`);
        document.getElementById('uploadFileInput').value = '';
    }
}

function addFileToList(file, listId) {
    const fileList = document.getElementById(listId);
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = getFileIcon(file.name);
    
    fileItem.innerHTML = `
        <div class="file-item-info">
            <i class="${fileIcon}"></i>
            <span>${file.name}</span>
        </div>
        <button class="btn-remove-file" onclick="removeFile('${file.name}', '${listId}')">
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
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'default': 'fas fa-file'
    };
    return iconMap[ext] || iconMap['default'];
}

function removeFile(filename, listId) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== filename);
    
    const fileList = document.getElementById(listId);
    const fileItems = fileList.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.textContent.includes(filename)) {
            item.remove();
        }
    });
}

// Modal Functions
function openCreateReportModal() {
    const modal = document.getElementById('reportModal');
    const modalTitle = document.getElementById('reportModalTitle');
    
    modalTitle.textContent = 'Tạo báo cáo mới';
    document.getElementById('reportForm').reset();
    currentReportId = null;
    uploadedFiles = [];
    document.getElementById('reportFileList').innerHTML = '';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openUploadReportModal() {
    const modal = document.getElementById('uploadReportModal');
    document.getElementById('uploadReportForm').reset();
    document.getElementById('uploadFileDisplay').innerHTML = '';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUploadReportModal() {
    const modal = document.getElementById('uploadReportModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function editReport(reportId) {
    const modal = document.getElementById('reportModal');
    const modalTitle = document.getElementById('reportModalTitle');
    
    modalTitle.textContent = 'Chỉnh sửa báo cáo';
    currentReportId = reportId;
    
    // Load report data (mock data for now)
    loadReportData(reportId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loadReportData(reportId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            type: 'event',
            title: 'Báo cáo Hội thảo Công nghệ 2024',
            event: '1',
            date: '2024-12-20',
            description: 'Báo cáo tổng kết sự kiện Hội thảo Công nghệ Thường niên 2024',
            content: 'Nội dung chi tiết báo cáo...'
        }
    };

    const data = mockData[reportId];
    if (data) {
        document.querySelector(`input[name="reportType"][value="${data.type}"]`).checked = true;
        document.getElementById('reportTitle').value = data.title;
        document.getElementById('relatedEvent').value = data.event;
        document.getElementById('reportDate').value = data.date;
        document.getElementById('reportDescription').value = data.description;
        document.getElementById('reportContent').value = data.content;
    }
}

function viewReport(reportId) {
    const modal = document.getElementById('viewReportModal');
    
    // Load report data (mock data for now)
    loadViewReportData(reportId);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loadViewReportData(reportId) {
    // Mock data - replace with actual API call
    const mockData = {
        1: {
            type: 'event',
            typeLabel: 'Báo cáo sự kiện',
            typeIcon: 'fas fa-calendar-check',
            title: 'Báo cáo Hội thảo Công nghệ 2024',
            status: 'completed',
            statusLabel: 'Hoàn thành',
            date: '20/12/2024',
            creator: 'Nguyễn Văn A',
            event: 'Hội thảo Công nghệ 2024',
            updated: '20/12/2024 10:30',
            description: 'Báo cáo tổng kết sự kiện Hội thảo Công nghệ Thường niên 2024 với 500 người tham dự, bao gồm các hoạt động chính, kết quả đạt được và đánh giá tổng thể.',
            content: `
                <p><strong>I. Tổng quan sự kiện</strong></p>
                <p>Hội thảo Công nghệ Thường niên 2024 đã được tổ chức thành công vào ngày 15/12/2024 tại Hội trường A1 với sự tham gia của 500 người bao gồm sinh viên, giảng viên và các chuyên gia trong ngành.</p>
                
                <p><strong>II. Các hoạt động chính</strong></p>
                <ul>
                    <li>Phiên khai mạc và phát biểu của Ban Giám hiệu</li>
                    <li>3 phiên thảo luận chuyên đề về AI, Blockchain và IoT</li>
                    <li>Workshop thực hành với các công nghệ mới</li>
                    <li>Triển lãm công nghệ từ các doanh nghiệp đối tác</li>
                </ul>

                <p><strong>III. Kết quả đạt được</strong></p>
                <ul>
                    <li>500 người tham dự (vượt 25% so với kế hoạch)</li>
                    <li>15 diễn giả chuyên gia chia sẻ kinh nghiệm</li>
                    <li>20 doanh nghiệp tham gia triển lãm</li>
                    <li>Tỷ lệ hài lòng: 95%</li>
                </ul>

                <p><strong>IV. Đánh giá và kiến nghị</strong></p>
                <p>Sự kiện đã đạt được mục tiêu đề ra, tạo được sự quan tâm lớn từ cộng đồng sinh viên. Đề xuất mở rộng quy mô và thời gian tổ chức cho các năm tiếp theo.</p>
            `,
            attachments: [
                { name: 'Báo cáo chi tiết.pdf', size: '2.5 MB', type: 'pdf' },
                { name: 'Thống kê tham dự.xlsx', size: '1.2 MB', type: 'excel' },
                { name: 'Slide trình bày.pptx', size: '5.8 MB', type: 'ppt' }
            ]
        },
        2: {
            type: 'budget',
            typeLabel: 'Báo cáo tài chính',
            typeIcon: 'fas fa-money-bill-wave',
            title: 'Báo cáo Tài chính Q4/2024',
            status: 'completed',
            statusLabel: 'Hoàn thành',
            date: '28/12/2024',
            creator: 'Trần Thị B',
            event: 'Tất cả sự kiện Q4',
            updated: '28/12/2024 14:20',
            description: 'Báo cáo chi tiết về tình hình thu chi, ngân sách các sự kiện trong quý 4 năm 2024.',
            content: `
                <p><strong>I. Tổng quan tài chính Q4/2024</strong></p>
                <p>Quý 4 năm 2024 đã tổ chức thành công 8 sự kiện với tổng ngân sách 450 triệu đồng.</p>
                
                <p><strong>II. Chi tiết thu chi</strong></p>
                <ul>
                    <li>Tổng thu: 480 triệu đồng</li>
                    <li>Tổng chi: 420 triệu đồng</li>
                    <li>Dư: 60 triệu đồng</li>
                </ul>

                <p><strong>III. Phân tích chi phí</strong></p>
                <ul>
                    <li>Chi phí tổ chức: 250 triệu (59.5%)</li>
                    <li>Chi phí marketing: 80 triệu (19%)</li>
                    <li>Chi phí nhân sự: 60 triệu (14.3%)</li>
                    <li>Chi phí khác: 30 triệu (7.2%)</li>
                </ul>

                <p><strong>IV. Đánh giá và kiến nghị</strong></p>
                <p>Tình hình tài chính ổn định, có lãi. Đề xuất tăng ngân sách cho các sự kiện lớn trong năm tới.</p>
            `,
            attachments: [
                { name: 'Báo cáo tài chính Q4.pdf', size: '3.2 MB', type: 'pdf' },
                { name: 'Bảng kê chi tiết.xlsx', size: '2.1 MB', type: 'excel' }
            ]
        },
        3: {
            type: 'attendance',
            typeLabel: 'Báo cáo tham dự',
            typeIcon: 'fas fa-users',
            title: 'Báo cáo Người tham dự Workshop',
            status: 'pending',
            statusLabel: 'Đang xử lý',
            date: '15/12/2024',
            creator: 'Lê Văn C',
            event: 'Workshop Khởi nghiệp',
            updated: '15/12/2024 16:45',
            description: 'Thống kê số lượng và thông tin người tham dự Workshop Khởi nghiệp.',
            content: `
                <p><strong>I. Tổng quan</strong></p>
                <p>Workshop Khởi nghiệp đã thu hút 250 người đăng ký và 220 người tham dự thực tế.</p>
                
                <p><strong>II. Phân tích người tham dự</strong></p>
                <ul>
                    <li>Sinh viên năm 3-4: 180 người (82%)</li>
                    <li>Sinh viên năm 1-2: 30 người (13%)</li>
                    <li>Khách mời: 10 người (5%)</li>
                </ul>

                <p><strong>III. Đánh giá</strong></p>
                <p>Tỷ lệ tham dự đạt 88%, cao hơn mức trung bình. Cần tiếp tục duy trì chất lượng nội dung.</p>
            `,
            attachments: [
                { name: 'Danh sách tham dự.xlsx', size: '1.5 MB', type: 'excel' }
            ]
        },
        4: {
            type: 'summary',
            typeLabel: 'Báo cáo tổng kết',
            typeIcon: 'fas fa-chart-line',
            title: 'Tổng kết hoạt động năm 2024',
            status: 'draft',
            statusLabel: 'Bản nháp',
            date: '30/12/2024',
            creator: 'Nguyễn Văn A',
            event: 'Tất cả sự kiện 2024',
            updated: '30/12/2024 09:15',
            description: 'Báo cáo tổng kết toàn bộ hoạt động, sự kiện trong năm 2024.',
            content: `
                <p><strong>I. Tổng quan năm 2024</strong></p>
                <p>Năm 2024 đã tổ chức thành công 24 sự kiện với tổng số 5,000 người tham dự.</p>
                
                <p><strong>II. Các sự kiện nổi bật</strong></p>
                <ul>
                    <li>Hội thảo Công nghệ Thường niên</li>
                    <li>Ngày hội Việc làm</li>
                    <li>Workshop Khởi nghiệp</li>
                </ul>

                <p><em>Nội dung đang được hoàn thiện...</em></p>
            `,
            attachments: []
        }
    };

    const data = mockData[reportId];
    if (data) {
        // Update modal content
        document.getElementById('viewReportTitle').textContent = data.title;
        
        // Update type badge
        const typeElement = document.getElementById('viewReportType');
        typeElement.className = `report-type ${data.type}`;
        typeElement.innerHTML = `<i class="${data.typeIcon}"></i><span>${data.typeLabel}</span>`;
        
        // Update status badge
        const statusElement = document.getElementById('viewReportStatus');
        statusElement.className = `status-badge ${data.status}`;
        statusElement.textContent = data.statusLabel;
        
        // Update meta information
        document.getElementById('viewReportDate').textContent = data.date;
        document.getElementById('viewReportCreator').textContent = data.creator;
        document.getElementById('viewReportEvent').textContent = data.event;
        document.getElementById('viewReportUpdated').textContent = data.updated;
        
        // Update description and content
        document.getElementById('viewReportDescription').textContent = data.description;
        document.getElementById('viewReportContent').innerHTML = data.content;
        
        // Update attachments
        const attachmentsContainer = document.getElementById('viewReportAttachments');
        if (data.attachments.length > 0) {
            attachmentsContainer.innerHTML = data.attachments.map(file => {
                const iconClass = getFileIconClass(file.type);
                return `
                    <div class="attachment-card">
                        <div class="attachment-icon ${file.type}">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="attachment-info">
                            <span class="attachment-name">${file.name}</span>
                            <span class="attachment-size">${file.size}</span>
                        </div>
                        <button class="btn-download-attachment" onclick="downloadAttachment('${file.name}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            attachmentsContainer.innerHTML = '<p style="color: var(--text-gray); font-style: italic;">Không có tài liệu đính kèm</p>';
        }
        
        // Store current report ID for edit function
        currentReportId = reportId;
    }
}

function getFileIconClass(type) {
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'excel': 'fas fa-file-excel',
        'ppt': 'fas fa-file-powerpoint',
        'word': 'fas fa-file-word',
        'default': 'fas fa-file'
    };
    return iconMap[type] || iconMap['default'];
}

function closeViewReportModal() {
    const modal = document.getElementById('viewReportModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function downloadReportFromView(format) {
    if (!currentReportId) return;
    
    console.log(`Downloading report ${currentReportId} as ${format}`);
    alert(`Đang xuất báo cáo dưới định dạng ${format.toUpperCase()}...`);
    
    // Simulate download
    // In real implementation, call API to generate and download file
}

function editReportFromView() {
    if (!currentReportId) return;
    
    // Close view modal
    closeViewReportModal();
    
    // Open edit modal
    setTimeout(() => {
        editReport(currentReportId);
    }, 300);
}

function downloadAttachment(filename) {
    console.log('Downloading attachment:', filename);
    alert(`Đang tải file: ${filename}`);
    
    // Simulate download
    // In real implementation, call API to download file
}

function downloadReport(reportId, format) {
    console.log(`Downloading report ${reportId} as ${format}`);
    alert(`Đang tải báo cáo dưới định dạng ${format.toUpperCase()}...`);
    
    // Simulate download
    // In real implementation, call API to generate and download file
}

function deleteReport(reportId) {
    if (confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
        console.log('Deleting report:', reportId);
        alert('Đã xóa báo cáo');
        
        // Remove from UI
        const reportCard = document.querySelector(`.report-card[data-status="draft"]`);
        if (reportCard) {
            reportCard.remove();
        }
    }
}

function saveReportDraft() {
    const formData = collectReportFormData();
    
    console.log('Saving report draft:', formData);
    
    alert('Đã lưu bản nháp thành công');
    closeReportModal();
}

function collectReportFormData() {
    const reportType = document.querySelector('input[name="reportType"]:checked')?.value;
    
    return {
        type: reportType,
        title: document.getElementById('reportTitle').value,
        event: document.getElementById('relatedEvent').value,
        date: document.getElementById('reportDate').value,
        description: document.getElementById('reportDescription').value,
        content: document.getElementById('reportContent').value,
        files: uploadedFiles
    };
}

// Form Submissions
document.getElementById('reportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = collectReportFormData();
    
    // Validate required fields
    if (!formData.type || !formData.title || !formData.description) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    console.log('Submitting report:', formData);

    // Call API to save report
    if (currentReportId) {
        alert('Đã cập nhật báo cáo thành công');
    } else {
        alert('Đã tạo báo cáo mới thành công');
    }

    closeReportModal();
});

document.getElementById('uploadReportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('uploadReportTitle').value;
    const type = document.getElementById('uploadReportType').value;
    const file = document.getElementById('uploadFileInput').files[0];
    const notes = document.getElementById('uploadNotes').value;
    
    if (!title || !type || !file) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    console.log('Uploading report:', { title, type, file, notes });

    alert('Đã upload báo cáo thành công');
    closeUploadReportModal();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const reportModal = document.getElementById('reportModal');
    const uploadModal = document.getElementById('uploadReportModal');
    const viewModal = document.getElementById('viewReportModal');
    
    if (e.target === reportModal) {
        closeReportModal();
    }
    
    if (e.target === uploadModal) {
        closeUploadReportModal();
    }
    
    if (e.target === viewModal) {
        closeViewReportModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeReportModal();
        closeUploadReportModal();
        closeViewReportModal();
    }
});
