<<<<<<< HEAD
// Reports Management JavaScript
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "https://localhost:7160/api";
}

let reportPageData = {
    events: [],
    selectedEventId: null,
    reports: [],
    currentReportId: null,
    uploadedFiles: []
};

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    setupModals();
    initializeApprovalTypeChange();
    initializeFileUpload();
    await loadEventsSelector();
    await loadReportsForSelectedEvent();
});

// Setup Modals and click outside
function setupModals() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeReportModal();
            closeUploadReportModal();
            closeViewReportModal();
        }
    });

    window.addEventListener('click', function(e) {
        const reportModal = document.getElementById('reportModal');
        const uploadModal = document.getElementById('uploadReportModal');
        const viewModal = document.getElementById('viewReportModal');
        
        if (e.target === reportModal) closeReportModal();
        if (e.target === uploadModal) closeUploadReportModal();
        if (e.target === viewModal) closeViewReportModal();
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
        reportPageData.events = events;

        selector.innerHTML = "";
        events.forEach(e => {
            selector.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
        });

        // Initialize relatedEvent dropdown inside forms
        const formEventSelect1 = document.getElementById("relatedEvent");
        if (formEventSelect1) {
            formEventSelect1.innerHTML = '<option value="">Chọn sự kiện</option>';
            events.forEach(e => {
                formEventSelect1.innerHTML += `<option value="${e.idSuKien}">${e.tenSuKien}</option>`;
            });
        }

        // Get saved selected event
        let savedId = localStorage.getItem("btc_reports_selected_event_id");
        if (savedId && events.some(e => e.idSuKien == savedId)) {
            selector.value = savedId;
            reportPageData.selectedEventId = savedId;
        } else if (events.length > 0) {
            selector.value = events[0].idSuKien;
            reportPageData.selectedEventId = events[0].idSuKien;
            localStorage.setItem("btc_reports_selected_event_id", events[0].idSuKien);
        }

        // Change listener
        selector.addEventListener("change", function () {
            reportPageData.selectedEventId = this.value;
            localStorage.setItem("btc_reports_selected_event_id", this.value);
            loadReportsForSelectedEvent();
        });

    } catch (error) {
        console.error("Lỗi tải selector:", error);
    }
}

// ================= LOAD REPORTS FOR SELECTED EVENT =================
async function loadReportsForSelectedEvent() {
    const eventId = reportPageData.selectedEventId;
    if (!eventId) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_BASE}/reports/su-kien/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Lỗi tải báo cáo");

        let reports = await res.json();
        
        let customRepStr = localStorage.getItem(`reports_custom_event_${eventId}`);
        if (customRepStr) {
            try {
                let customReports = JSON.parse(customRepStr) || [];
                reports = reports.concat(customReports);
            } catch (e) {
                console.error("Lỗi parse custom reports:", e);
            }
        }

        reportPageData.reports = reports;
        renderReports(reports);
        updateStats(reports);
        initializeFilterTabs();

    } catch (error) {
        console.error("Lỗi load reports:", error);
    }
}

// ================= UPDATE STATS =================
function updateStats(data) {
    const total = data.length;
    const completed = data.filter(r => r.status === "completed").length;
    const pending = data.filter(r => r.status === "pending").length;
    const draft = data.filter(r => r.status === "draft").length;

    const stats = document.querySelectorAll(".report-stats .stat-card");
    if (stats.length >= 4) {
        stats[0].querySelector(".stat-number").textContent = total;
        stats[1].querySelector(".stat-number").textContent = completed;
        stats[2].querySelector(".stat-number").textContent = pending;
        stats[3].querySelector(".stat-number").textContent = draft;
    }
}

// ================= RENDER REPORTS =================
function renderReports(data) {
    const container = document.querySelector(".reports-grid");
    if (!container) return;

    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = '<div class="loading" style="grid-column: 1/-1;">Chưa có báo cáo nào cho sự kiện này.</div>';
        return;
    }

    data.forEach(item => {
        const typeIcon = item.typeIcon || 'fas fa-file';
        const typeLabel = item.typeLabel || 'Khác';
        const statusClass = item.status || 'draft';
        const statusLabel = item.statusLabel || 'Bản nháp';

        container.innerHTML += `
            <div class="report-card" data-type="${item.type}" data-status="${item.status}">
                <div class="report-header">
                    <div class="report-type ${item.type}">
                        <i class="${typeIcon}"></i>
                        <span>${typeLabel}</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="report-body">
                    <h3>${item.title}</h3>
                    <p class="report-description">${item.description || ''}</p>
                    <div class="report-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Ngày tạo: ${item.date}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span>Người tạo: ${item.creator || 'Nguyễn Văn A'}</span>
                        </div>
                    </div>
                </div>
                <div class="report-footer">
                    <button class="btn-action-secondary" onclick="viewReport(${item.id})">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="btn-action-secondary" onclick="downloadReport(${item.id}, 'pdf')">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button class="btn-action-secondary" onclick="downloadReport(${item.id}, 'excel')">
                        <i class="fas fa-file-excel"></i> Excel
                    </button>
                    ${item.status === 'draft' || item.status === 'pending' ? `
                        <button class="btn-action-primary" onclick="editReport(${item.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
}

// ================= FILTER TABS =================
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);

        newBtn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-type');
            if (filterType === 'all') {
                renderReports(reportPageData.reports);
            } else {
                renderReports(reportPageData.reports.filter(r => r.type === filterType));
            }
        });
    });
}

function initializeApprovalTypeChange() {
    // dummy needed for compatibility
}

function initializeFileUpload() {
    // dummy needed for compatibility
}

// ================= MODALS CONTROLS =================
function openCreateReportModal() {
    const modal = document.getElementById('reportModal');
    if (!modal) return;

    reportPageData.currentReportId = null;
    document.getElementById('reportForm').reset();
    
    // Set default related event
    const formEvent = document.getElementById('relatedEvent');
    if (formEvent && reportPageData.selectedEventId) {
        formEvent.value = reportPageData.selectedEventId;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openUploadReportModal() {
    document.getElementById('uploadReportForm').reset();
    document.getElementById('uploadReportModal').classList.add('active');
}

function closeUploadReportModal() {
    document.getElementById('uploadReportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeViewReportModal() {
    document.getElementById('viewReportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ================= CREATE / SAVE REPORT =================
async function saveReport(status = "completed") {
    const eventId = reportPageData.selectedEventId;
    if (!eventId) return;

    const title = document.getElementById('reportTitle').value;
    const desc = document.getElementById('reportDescription').value;
    const content = document.getElementById('reportContent').value;
    
    const types = document.getElementsByName('reportType');
    let selectedType = 'event';
    types.forEach(t => {
        if (t.checked) selectedType = t.value;
    });

    const typeLabels = {
        event: { label: 'Báo cáo sự kiện', icon: 'fas fa-calendar-check' },
        budget: { label: 'Báo cáo tài chính', icon: 'fas fa-money-bill-wave' },
        attendance: { label: 'Báo cáo tham dự', icon: 'fas fa-users' },
        summary: { label: 'Báo cáo tổng kết', icon: 'fas fa-chart-line' }
    };
    const details = typeLabels[selectedType];

    const data = {
        type: selectedType,
        typeLabel: details.label,
        typeIcon: details.icon,
        title: title,
        status: status,
        statusLabel: status === "completed" ? "Hoàn thành" : (status === "pending" ? "Đang xử lý" : "Bản nháp"),
        date: new Date().toLocaleDateString("vi-VN"),
        creator: 'Nguyễn Văn A',
        event: reportPageData.events.find(e => e.idSuKien == eventId)?.tenSuKien || "Sự kiện",
        updated: new Date().toLocaleDateString("vi-VN") + " 12:00",
        description: desc,
        content: content,
        attachments: [],
        isCustom: true
    };

    let customReports = reportPageData.reports.filter(r => r.isCustom) || [];

    if (reportPageData.currentReportId) {
        const index = customReports.findIndex(r => r.id == reportPageData.currentReportId);
        if (index !== -1) {
            data.id = reportPageData.currentReportId;
            customReports[index] = data;
        }
    } else {
        data.id = Date.now();
        customReports.push(data);
    }

    localStorage.setItem(`reports_custom_event_${eventId}`, JSON.stringify(customReports));
    closeReportModal();
    await loadReportsForSelectedEvent();
}

document.getElementById('reportForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    await saveReport("completed");
    alert("Đã lưu báo cáo thành công!");
});

window.saveReportDraft = async function() {
    await saveReport("draft");
    alert("Đã lưu bản nháp báo cáo!");
};

// ================= VIEW REPORT =================
function viewReport(id) {
    const item = reportPageData.reports.find(r => r.id == id);
    if (!item) return;

    reportPageData.currentReportId = id;

    document.getElementById('viewReportTitle').textContent = item.title;
    
    const typeElement = document.getElementById('viewReportType');
    typeElement.className = `report-type ${item.type}`;
    typeElement.innerHTML = `<i class="${item.typeIcon}"></i><span>${item.typeLabel}</span>`;

    const statusElement = document.getElementById('viewReportStatus');
    statusElement.className = `status-badge ${item.status}`;
    statusElement.textContent = item.statusLabel;

    document.getElementById('viewReportDate').textContent = item.date;
    document.getElementById('viewReportCreator').textContent = item.creator;
    document.getElementById('viewReportEvent').textContent = item.event;
    document.getElementById('viewReportUpdated').textContent = item.updated;
    document.getElementById('viewReportDescription').textContent = item.description;
    document.getElementById('viewReportContent').innerHTML = item.content || '<p>Không có nội dung chi tiết.</p>';

    document.getElementById('viewReportModal').classList.add('active');
}

// ================= EDIT REPORT =================
function editReport(id) {
    const item = reportPageData.reports.find(r => r.id == id);
    if (!item) return;

    reportPageData.currentReportId = id;

    // Prepopulate inputs
    const typeRadio = document.querySelector(`input[name="reportType"][value="${item.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    document.getElementById('reportTitle').value = item.title;
    document.getElementById('relatedEvent').value = reportPageData.selectedEventId;
    document.getElementById('reportDescription').value = item.description || '';
    document.getElementById('reportContent').value = item.content || '';

    closeViewReportModal();
    document.getElementById('reportModal').classList.add('active');
}

function editReportFromView() {
    if (reportPageData.currentReportId) {
        editReport(reportPageData.currentReportId);
    }
}

// ================= ACTIONS =================
function downloadReport(id, format) {
    alert(`Đang xuất báo cáo và tải xuống dạng ${format.toUpperCase()}...`);
}

function downloadReportFromView(format) {
    downloadReport(reportPageData.currentReportId, format);
}

function deleteReport(id) {
    if (!confirm("Xác nhận xóa báo cáo này?")) return;
    const eventId = reportPageData.selectedEventId;
    let customRepStr = localStorage.getItem(`reports_custom_event_${eventId}`);
    if (customRepStr) {
        let customReports = JSON.parse(customRepStr) || [];
        customReports = customReports.filter(r => r.id != id);
        localStorage.setItem(`reports_custom_event_${eventId}`, JSON.stringify(customReports));
    }
    loadReportsForSelectedEvent();
}

// Export functions
window.openCreateReportModal = openCreateReportModal;
window.closeReportModal = closeReportModal;
window.openUploadReportModal = openUploadReportModal;
window.closeUploadReportModal = closeUploadReportModal;
window.closeViewReportModal = closeViewReportModal;
window.editReport = editReport;
window.viewReport = viewReport;
window.downloadReport = downloadReport;
window.downloadReportFromView = downloadReportFromView;
window.editReportFromView = editReportFromView;
window.deleteReport = deleteReport;
=======
// btc-reports.js - Kết nối API thật + Xuất Excel

const API_BASE_URL = 'http://localhost:5103/api';

// ==================== STATE ====================
let currentUser = null;
let allEvents = [];        // Tất cả sự kiện của BTC hiện tại
let currentReportId = null;
let uploadedFiles = [];
let currentEventIdForReport = null; // Sự kiện đang xem báo cáo

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async function () {
    // Lấy user từ localStorage
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!currentUser || !currentUser.idNguoiDung) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        return;
    }

    // Cập nhật tên user trên header
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl) userNameEl.textContent = currentUser.hoTen || 'Người dùng';
    if (userRoleEl && currentUser.vaiTros?.length > 0) {
        const roleMap = {
            'TruongBanToChuc': 'Trưởng Ban Tổ chức',
            'ThanhVienBanToChuc': 'Thành viên Ban Tổ chức'
        };
        userRoleEl.textContent = roleMap[currentUser.vaiTros[0]] || currentUser.vaiTros[0];
    }

    await loadEvents();
    initializeFilterTabs();
    initializeFilterControls();
    initializeFileUpload();
    setupLogout();
});

// ==================== GỌI API ====================
async function apiFetch(endpoint) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API lỗi: ${res.status}`);
    return res.json();
}

// ==================== LOAD SỰ KIỆN ====================
async function loadEvents() {
    try {
        const allEventsData = await apiFetch('/SuKien');

        // Lọc sự kiện do BTC hiện tại tạo
        allEvents = allEventsData.filter(e => e.idNguoiTao === currentUser.idNguoiDung);

        updateStats();
        renderEventList();
        populateEventDropdown();
    } catch (err) {
        console.error('Lỗi load sự kiện:', err);
        showError('Không thể tải danh sách sự kiện. Vui lòng kiểm tra kết nối server.');
    }
}

// ==================== CẬP NHẬT THỐNG KÊ ====================
function updateStats() {
    const total = allEvents.length;
    const daDuyet = allEvents.filter(e => e.trangThai === 'Đã duyệt').length;
    const choXet = allEvents.filter(e => e.trangThai === 'Chờ duyệt').length;
    const nhap = allEvents.filter(e => e.trangThai === 'Nháp').length;

    setStatNumber('.total-reports .stat-number', total);
    setStatNumber('.completed-reports .stat-number', daDuyet);
    setStatNumber('.pending-reports .stat-number', choXet);
    setStatNumber('.draft-reports .stat-number', nhap);
}

function setStatNumber(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
}

// ==================== RENDER DANH SÁCH SỰ KIỆN ====================
function renderEventList(filterStatus = 'all') {
    const grid = document.querySelector('.reports-grid');
    if (!grid) return;

    let filtered = allEvents;
    if (filterStatus !== 'all') {
        const statusMap = {
            'completed': 'Đã duyệt',
            'pending': 'Chờ duyệt',
            'draft': 'Nháp'
        };
        filtered = allEvents.filter(e => e.trangThai === statusMap[filterStatus]);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; color: #6B7280;">
                <i class="fas fa-folder-open" style="font-size:48px; margin-bottom:16px; display:block; opacity:0.4;"></i>
                <p>Không có sự kiện nào phù hợp</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(event => {
        const statusInfo = getStatusInfo(event.trangThai);
        const ngay = new Date(event.thoiGianBatDau).toLocaleDateString('vi-VN');
        return `
        <div class="report-card" data-id="${event.idSuKien}" data-status="${statusInfo.key}">
            <div class="report-header">
                <div class="report-type event">
                    <i class="fas fa-calendar-check"></i>
                    <span>Báo cáo sự kiện</span>
                </div>
                <span class="status-badge ${statusInfo.key}">${event.trangThai}</span>
            </div>
            <div class="report-body">
                <h3>${event.tenSuKien}</h3>
                <p class="report-description">${event.moTa || 'Không có mô tả'}</p>
                <div class="report-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Ngày tổ chức: ${ngay}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.tenDiaDiem || 'Chưa xác định'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>Đăng ký: ${event.soDaDangKy}${event.soLuongToiDa ? '/' + event.soLuongToiDa : ''} người</span>
                    </div>
                </div>
            </div>
            <div class="report-footer">
                <button class="btn-action-secondary" onclick="viewEventReport(${event.idSuKien})">
                    <i class="fas fa-eye"></i> Xem
                </button>
                <button class="btn-action-secondary" onclick="exportExcel(${event.idSuKien}, '${escapeQuote(event.tenSuKien)}')">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
            </div>
        </div>`;
    }).join('');
}

function escapeQuote(str) {
    return str.replace(/'/g, "\\'");
}

function getStatusInfo(trangThai) {
    const map = {
        'Đã duyệt': { key: 'completed' },
        'Chờ duyệt': { key: 'pending' },
        'Nháp': { key: 'draft' },
        'Từ chối': { key: 'rejected' }
    };
    return map[trangThai] || { key: 'draft' };
}

// ==================== DROPDOWN SỰ KIỆN TRONG MODAL ====================
function populateEventDropdown() {
    const selects = document.querySelectorAll('#eventFilter, #relatedEvent');
    selects.forEach(sel => {
        // Giữ option đầu tiên, xóa phần còn lại
        while (sel.options.length > 1) sel.remove(1);
        allEvents.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.idSuKien;
            opt.textContent = e.tenSuKien;
            sel.appendChild(opt);
        });
    });
}

// ==================== XEM BÁO CÁO CHI TIẾT ====================
async function viewEventReport(idSuKien) {
    const event = allEvents.find(e => e.idSuKien === idSuKien);
    if (!event) return;

    currentEventIdForReport = idSuKien;

    // Cập nhật tiêu đề và thông tin cơ bản
    document.getElementById('viewReportTitle').textContent = event.tenSuKien;
    document.getElementById('viewReportDate').textContent =
        new Date(event.thoiGianBatDau).toLocaleDateString('vi-VN');
    document.getElementById('viewReportCreator').textContent = event.tenNguoiTao || currentUser.hoTen;
    document.getElementById('viewReportEvent').textContent = event.tenSuKien;
    document.getElementById('viewReportUpdated').textContent =
        new Date(event.thoiGianTao).toLocaleString('vi-VN');
    document.getElementById('viewReportDescription').textContent = event.moTa || 'Không có mô tả';

    // Cập nhật type/status badge
    const typeEl = document.getElementById('viewReportType');
    typeEl.className = 'report-type event';
    typeEl.innerHTML = '<i class="fas fa-calendar-check"></i><span>Báo cáo sự kiện</span>';

    const statusEl = document.getElementById('viewReportStatus');
    const si = getStatusInfo(event.trangThai);
    statusEl.className = `status-badge ${si.key}`;
    statusEl.textContent = event.trangThai;

    // Load danh sách người tham gia
    const contentEl = document.getElementById('viewReportContent');
    contentEl.innerHTML = '<p style="color:#6B7280; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';

    try {
        const dangKyList = await apiFetch(`/DangKy/su-kien/${idSuKien}`);
        renderReportContent(event, dangKyList, contentEl);
        renderReportAttachments(dangKyList);
    } catch (err) {
        contentEl.innerHTML = '<p style="color:#EF4444;">Không thể tải danh sách người tham gia.</p>';
    }

    // Mở modal
    document.getElementById('viewReportModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderReportContent(event, dangKyList, container) {
    const tongDangKy = dangKyList.length;
    const daCheckin = dangKyList.filter(d => d.thoiGianCheckin).length;
    const noShow = dangKyList.filter(d => !d.thoiGianCheckin && d.trangThai !== 'Đã hủy').length;
    const daHuy = dangKyList.filter(d => d.trangThai === 'Đã hủy').length;
    const tiLe = tongDangKy > 0 ? Math.round((daCheckin / tongDangKy) * 100) : 0;

    container.innerHTML = `
        <div class="stats-grid-view" style="margin-bottom:24px;">
            <div class="stat-box">
                <div class="stat-icon blue"><i class="fas fa-user-plus"></i></div>
                <div class="stat-info">
                    <span class="stat-number">${tongDangKy}</span>
                    <span class="stat-label">Tổng đăng ký</span>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info">
                    <span class="stat-number">${daCheckin}</span>
                    <span class="stat-label">Đã tham dự</span>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon orange"><i class="fas fa-user-times"></i></div>
                <div class="stat-info">
                    <span class="stat-number">${noShow}</span>
                    <span class="stat-label">Vắng mặt</span>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon purple"><i class="fas fa-percentage"></i></div>
                <div class="stat-info">
                    <span class="stat-number">${tiLe}%</span>
                    <span class="stat-label">Tỷ lệ tham dự</span>
                </div>
            </div>
        </div>

        <h4 style="margin-bottom:12px; font-size:14px; color:#374151;">
            <i class="fas fa-list"></i> Danh sách người tham gia (${tongDangKy} người)
        </h4>
        ${renderParticipantTable(dangKyList)}
    `;
}

function renderParticipantTable(list) {
    if (list.length === 0) {
        return '<p style="color:#6B7280; font-style:italic;">Chưa có người đăng ký</p>';
    }

    const rows = list.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${d.hoTenNguoiDung || d.idNguoiDung}</td>
            <td>${d.idNguoiDung}</td>
            <td>${new Date(d.thoiGianDangKy).toLocaleDateString('vi-VN')}</td>
            <td>${d.thoiGianCheckin ? new Date(d.thoiGianCheckin).toLocaleString('vi-VN') : '—'}</td>
            <td>${d.thoiGianCheckout ? new Date(d.thoiGianCheckout).toLocaleString('vi-VN') : '—'}</td>
            <td>
                <span class="status-badge ${d.thoiGianCheckin ? 'completed' : (d.trangThai === 'Đã hủy' ? 'rejected' : 'pending')}">
                    ${d.thoiGianCheckin ? 'Đã tham dự' : (d.trangThai === 'Đã hủy' ? 'Đã hủy' : 'Vắng mặt')}
                </span>
            </td>
        </tr>
    `).join('');

    return `
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="background:#F3F4F6;">
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">STT</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Họ tên</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Mã số</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Ngày đăng ký</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Check-in</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Check-out</th>
                        <th style="padding:10px 8px; text-align:left; border-bottom:1px solid #E5E7EB;">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderReportAttachments(dangKyList) {
    const container = document.getElementById('viewReportAttachments');
    if (!container) return;
    // Không có file đính kèm thật, hiển thị thông tin hướng dẫn xuất
    container.innerHTML = `
        <p style="color:#6B7280; font-style:italic;">
            <i class="fas fa-info-circle"></i> 
            Nhấn "Xuất Excel" để tải danh sách người tham gia về máy.
        </p>`;
}

// ==================== XUẤT EXCEL ====================
async function exportExcel(idSuKien, tenSuKien) {
    try {
        const url = `${API_BASE_URL}/BaoCao/xuat-excel/${idSuKien}`;
        console.log('Đang gọi API:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            // credentials: 'include'   // Bỏ comment nếu dùng authentication sau này
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Lỗi server (${response.status}): ${errorText}`);
        }

        const blob = await response.blob();
        
        if (blob.size === 0) {
            throw new Error('File trả về rỗng');
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `BaoCao_${tenSuKien.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        alert('✅ Xuất Excel thành công!');
    } catch (err) {
        console.error('Export error:', err);
        alert('❌ Không thể xuất Excel: ' + err.message);
    }
}

// Hàm xuất Excel từ modal xem báo cáo
async function downloadReportFromView(format) {
    if (!currentEventIdForReport) return;
    const event = allEvents.find(e => e.idSuKien === currentEventIdForReport);
    if (!event) return;

    if (format === 'excel') {
        await exportExcel(currentEventIdForReport, event.tenSuKien);
    } else {
        alert('Xuất PDF đang được phát triển. Vui lòng dùng chức năng Xuất Excel.');
    }
}

// Tải thư viện JS động
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ==================== ĐÓNG MODAL ====================
function closeViewReportModal() {
    document.getElementById('viewReportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeReportModal() {
    document.getElementById('reportModal')?.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeUploadReportModal() {
    document.getElementById('uploadReportModal')?.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openCreateReportModal() {
    document.getElementById('reportModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openUploadReportModal() {
    document.getElementById('uploadReportModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function editReportFromView() {
    closeViewReportModal();
}

// ==================== BỘ LỌC ====================
function initializeFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
}

function initializeFilterControls() {
    document.getElementById('eventFilter')?.addEventListener('change', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
}

function applyFilters() {
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-type') || 'all';
    const statusValue = document.getElementById('statusFilter')?.value || 'all';
    const eventValue = document.getElementById('eventFilter')?.value || 'all';

    const cards = document.querySelectorAll('.report-card');
    cards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        const cardId = card.getAttribute('data-id');

        let show = true;
        if (statusValue !== 'all' && cardStatus !== statusValue) show = false;
        if (eventValue !== 'all' && cardId !== eventValue) show = false;

        card.style.display = show ? 'block' : 'none';
    });
}

// ==================== UPLOAD FILE ====================
function initializeFileUpload() {
    document.getElementById('reportFileInput')?.addEventListener('change', function (e) {
        handleFileSelection(e.target.files, 'reportFileList');
    });
    document.getElementById('uploadFileInput')?.addEventListener('change', function (e) {
        handleSingleFileSelection(e.target.files[0], 'uploadFileDisplay');
    });
}

function handleFileSelection(files, listId) {
    const fileList = document.getElementById(listId);
    Array.from(files).forEach(file => {
        if (file.size <= 20 * 1024 * 1024) {
            uploadedFiles.push(file);
            addFileToList(file, listId);
        } else {
            alert(`File ${file.name} vượt quá 20MB`);
        }
    });
}

function handleSingleFileSelection(file, displayId) {
    if (!file) return;
    const fileDisplay = document.getElementById(displayId);
    if (file.size <= 20 * 1024 * 1024) {
        fileDisplay.innerHTML = `
            <div class="file-item">
                <div class="file-item-info">
                    <i class="${getFileIcon(file.name)}"></i>
                    <span>${file.name}</span>
                </div>
            </div>`;
    } else {
        alert(`File ${file.name} vượt quá 20MB`);
        document.getElementById('uploadFileInput').value = '';
    }
}

function addFileToList(file, listId) {
    const fileList = document.getElementById(listId);
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
        <div class="file-item-info">
            <i class="${getFileIcon(file.name)}"></i>
            <span>${file.name}</span>
        </div>
        <button class="btn-remove-file" onclick="removeFile('${file.name}', '${listId}')">
            <i class="fas fa-times"></i>
        </button>`;
    fileList.appendChild(item);
}

function removeFile(filename, listId) {
    uploadedFiles = uploadedFiles.filter(f => f.name !== filename);
    document.querySelectorAll(`#${listId} .file-item`).forEach(item => {
        if (item.textContent.includes(filename)) item.remove();
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ({ pdf: 'fas fa-file-pdf', doc: 'fas fa-file-word', docx: 'fas fa-file-word', xls: 'fas fa-file-excel', xlsx: 'fas fa-file-excel', ppt: 'fas fa-file-powerpoint', pptx: 'fas fa-file-powerpoint' })[ext] || 'fas fa-file';
}

// ==================== ĐĂNG XUẤT ====================
function setupLogout() {
    document.querySelectorAll('.nav-item.danger').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    });
}

// ==================== HIỂN THỊ LỖI ====================
function showError(msg) {
    const grid = document.querySelector('.reports-grid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#EF4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:16px; display:block;"></i>
                <p>${msg}</p>
            </div>`;
    }
}

// ==================== ĐÓNG MODAL KHI CLICK NGOÀI ====================
window.addEventListener('click', function (e) {
    ['reportModal', 'uploadReportModal', 'viewReportModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportModal();
        closeUploadReportModal();
        closeViewReportModal();
    }
});
>>>>>>> origin/Nguyen
