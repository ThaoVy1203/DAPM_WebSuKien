if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:5103/api";
}

let eventsData = [];
let locationsData = [];
let categoriesData = [];
let usersData = [];
let currentEventId = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Hide create event button for Member BTC
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const vaiTros = userData.vaiTros || [];
    const isTruongBan = vaiTros.includes("TruongBanToChuc");
    if (!isTruongBan) {
        const btnCreate = document.querySelector('.btn-create');
        if (btnCreate) btnCreate.style.display = 'none';
    }

    loadLocations();
    loadCategories();
    loadUsers();
    loadEvents();
    initializeFilterTabs();
    
    // Form submit for Save / Submit
    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
    
    // Save draft button
    document.querySelector('.btn-save-draft').addEventListener('click', () => {
        saveEvent('Nháp');
    });
});

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }
    return response;
}

async function loadLocations() {
    try {
        const res = await authFetch(`${window.API_BASE}/DiaDiem`);
        if (res.ok) {
            locationsData = await res.json();
            const select = document.getElementById('eventLocation');
            select.innerHTML = '<option value="">Chọn địa điểm</option>';
            locationsData.forEach(loc => {
                select.innerHTML += `<option value="${loc.idDiaDiem}">${loc.tenDiaDiem}</option>`;
            });
        }
    } catch (error) {
        console.error("Error loading locations:", error);
    }
}
window.cancelEvent = cancelEvent;

async function loadCategories() {
    try {
        const res = await authFetch(`${window.API_BASE}/DanhMuc`);
        if (res.ok) {
            categoriesData = await res.json();
            const tagsContainer = document.getElementById('categoryTags');
            tagsContainer.innerHTML = '';
            categoriesData.forEach(cat => {
                const tag = document.createElement('div');
                tag.className = 'category-tag';
                tag.dataset.id = cat.idDanhMuc;
                tag.textContent = cat.tenDanhMuc;
                tag.onclick = () => toggleCategoryTag(tag);
                tagsContainer.appendChild(tag);
            });
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

async function loadUsers() {
    try {
        const res = await authFetch(`${window.API_BASE}/NguoiDung`);
        if (res.ok) {
            usersData = await res.json();
        }
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

async function loadEvents() {
    try {
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) return;
        const userData = JSON.parse(userDataStr);
        const vaiTros = userData.vaiTros || [];
        const isTruongBan = vaiTros.includes("TruongBanToChuc");

        // Load all events from SQL
        const endpoint = `${window.API_BASE}/SuKien`;
        
        const res = await authFetch(endpoint);
        if (res.ok) {
            eventsData = await res.json();
            renderEvents();
            updateFilterCounts();
        }
    } catch (error) {
        console.error("Error loading events:", error);
        showToast("Không thể tải danh sách sự kiện", "error");
    }
}

function initializeFilterTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.status;
            renderEvents();
        });
    });
}

function updateFilterCounts() {
    const now = new Date();
    const counts = {
        all: eventsData.length,
        draft: eventsData.filter(e => e.trangThai === 'Nháp').length,
        pending: eventsData.filter(e => e.trangThai === 'Chờ duyệt').length,
        upcoming: eventsData.filter(e => e.trangThai === 'Đã duyệt' && new Date(e.thoiGianKetThuc) >= now).length,
        completed: eventsData.filter(e => e.trangThai === 'Đã duyệt' && new Date(e.thoiGianKetThuc) < now).length,
        cancelled: eventsData.filter(e => e.trangThai === 'Hủy' || e.trangThai === 'Từ chối').length
    };
    
    const allBtn = document.querySelector('.tab-btn[data-status="all"]');
    const draftBtn = document.querySelector('.tab-btn[data-status="Nháp"]');
    const pendingBtn = document.querySelector('.tab-btn[data-status="Chờ duyệt"]');
    const upcomingBtn = document.querySelector('.tab-btn[data-status="Sắp diễn ra"]');
    const completedBtn = document.querySelector('.tab-btn[data-status="Đã hoàn thành"]');
    const cancelledBtn = document.querySelector('.tab-btn[data-status="Hủy"]');

    if (allBtn) allBtn.textContent = `Tất cả (${counts.all})`;
    if (draftBtn) draftBtn.textContent = `Nháp (${counts.draft})`;
    if (pendingBtn) pendingBtn.textContent = `Chờ duyệt (${counts.pending})`;
    if (upcomingBtn) upcomingBtn.textContent = `Sắp diễn ra (${counts.upcoming})`;
    if (completedBtn) completedBtn.textContent = `Đã hoàn thành (${counts.completed})`;
    if (cancelledBtn) cancelledBtn.textContent = `Đã hủy (${counts.cancelled})`;
}

function isUpcoming(event) {
    return new Date(event.thoiGianBatDau) > new Date() && event.trangThai !== 'Hủy' && event.trangThai !== 'Từ chối';
}

function isOngoing(event) {
    const now = new Date();
    return new Date(event.thoiGianBatDau) <= now && new Date(event.thoiGianKetThuc) >= now && event.trangThai !== 'Hủy' && event.trangThai !== 'Từ chối';
}

function isCompleted(event) {
    return new Date(event.thoiGianKetThuc) < new Date() && event.trangThai !== 'Hủy' && event.trangThai !== 'Từ chối';
}

function toggleCategoryTag(tag) {
    if (document.getElementById('eventForm').classList.contains('readonly')) return;
    tag.classList.toggle('selected');
}

let currentBase64Image = null;
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentBase64Image = e.target.result;
            const img = document.getElementById('imagePreview');
            img.src = currentBase64Image;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        currentBase64Image = null;
        document.getElementById('imagePreview').style.display = 'none';
    }
}

function getEventStatusInfo(event) {
    if (event.trangThai === 'Hủy') return { text: 'Đã hủy', class: 'cancelled', icon: 'fa-ban' };
    if (event.trangThai === 'Từ chối') return { text: 'Từ chối', class: 'rejected', icon: 'fa-times-circle' };
    if (event.trangThai === 'Nháp') return { text: 'Bản nháp', class: 'draft', icon: 'fa-file-alt' };
    if (event.trangThai === 'Chờ duyệt') return { text: 'Chờ duyệt', class: 'pending', icon: 'fa-clock' };
    
    if (isCompleted(event)) return { text: 'Đã hoàn thành', class: 'completed', icon: 'fa-check-circle' };
    if (isOngoing(event)) return { text: 'Đang diễn ra', class: 'ongoing', icon: 'fa-play-circle' };
    return { text: 'Sắp diễn ra', class: 'upcoming', icon: 'fa-calendar-alt' };
}

function renderEvents() {
    const container = document.getElementById('eventsGrid');
    container.innerHTML = '';
    
    let filtered = eventsData;
    const now = new Date();
    if (currentFilter === 'Nháp') filtered = eventsData.filter(e => e.trangThai === 'Nháp');
    else if (currentFilter === 'Chờ duyệt') filtered = eventsData.filter(e => e.trangThai === 'Chờ duyệt');
    else if (currentFilter === 'Sắp diễn ra') filtered = eventsData.filter(e => e.trangThai === 'Đã duyệt' && new Date(e.thoiGianKetThuc) >= now);
    else if (currentFilter === 'Đã hoàn thành') filtered = eventsData.filter(e => e.trangThai === 'Đã duyệt' && new Date(e.thoiGianKetThuc) < now);
    else if (currentFilter === 'Hủy') filtered = eventsData.filter(e => e.trangThai === 'Hủy' || e.trangThai === 'Từ chối');
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 8px;">
            <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
            <h3 style="color: #64748b;">Không có sự kiện nào</h3>
        </div>`;
        return;
    }
    
    filtered.forEach(event => {
        const statusInfo = getEventStatusInfo(event);
        const startTime = new Date(event.thoiGianBatDau).toLocaleString('vi-VN');
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vaiTros = userData.vaiTros || [];
        const isTruongBan = vaiTros.includes("TruongBanToChuc");

        let actionsHtml = '';
        if (isTruongBan) {
            if (event.trangThai === 'Nháp' || event.trangThai === 'Từ chối') {
                actionsHtml += `<button class="btn-action btn-edit" onclick="openEditEventModal(${event.idSuKien})"><i class="fas fa-edit"></i> Chỉnh sửa</button>`;
            }
            if (event.trangThai === 'Nháp') {
                actionsHtml += `<button class="btn-action btn-submit-approval" style="color: #0056b3; border-color: #0056b3; background: #e6f0fa;" onclick="submitApproval(${event.idSuKien})"><i class="fas fa-paper-plane"></i> Gửi phê duyệt</button>`;
                actionsHtml += `<button class="btn-action btn-cancel" onclick="deleteEvent(${event.idSuKien})"><i class="fas fa-trash"></i> Xóa</button>`;
            }
            const cancelAllowedStatuses = ['Chờ duyệt', 'Từ chối', 'Đã duyệt'];
            const isFutureEvent = new Date(event.thoiGianBatDau) > new Date();
            const canCancel = (cancelAllowedStatuses.includes(event.trangThai) && isFutureEvent) || event.trangThai === 'Từ chối';
            if (canCancel) {
                actionsHtml += `<button class="btn-action btn-cancel" onclick="confirmCancelEvent(${event.idSuKien})"><i class="fas fa-times-circle"></i> Hủy</button>`;
            }
        }
        actionsHtml += `<button class="btn-action btn-view" onclick="openViewEventModal(${event.idSuKien})"><i class="fas fa-eye"></i> Chi tiết</button>`;
        
        container.innerHTML += `
            <div class="event-card">
                <div class="event-image">
                    <img src="${event.hinhAnh || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}" alt="Event" onerror="this.src='../images/banner.png'">
                    <span class="event-badge ${statusInfo.class}"><i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}</span>
                </div>
                <div class="event-content">
                    <div class="event-date">
                        <i class="fas fa-calendar"></i>
                        <span>${startTime}</span>
                    </div>
                    <h3 class="event-title">${escapeHtml(event.tenSuKien)}</h3>
                    <div class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(event.tenDiaDiem || 'Chưa xác định')}</span>
                    </div>
                    <div class="event-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${event.soDaDangKy}/${event.soLuongToiDa || '∞'} người</span>
                        </div>
                    </div>
                    <div class="event-actions">
                        ${actionsHtml}
                    </div>
                </div>
            </div>
        `;
    });
}

function setFormReadOnly(isReadOnly) {
    const form = document.getElementById('eventForm');
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach(el => el.disabled = isReadOnly);
    const buttons = form.querySelectorAll('button:not(.btn-cancel-modal)');
    buttons.forEach(el => el.disabled = isReadOnly);
    
    if (isReadOnly) {
        form.classList.add('readonly');
    } else {
        form.classList.remove('readonly');
    }
    
    document.querySelector('.btn-save-draft').style.display = isReadOnly ? 'none' : 'inline-block';
    document.querySelector('.btn-submit').style.display = isReadOnly ? 'none' : 'inline-block';
    
    document.querySelector('.btn-cancel-modal').textContent = isReadOnly ? 'Đóng' : 'Hủy';
    
    const imageUploadWrapper = document.querySelector('.image-upload-wrapper');
    if(imageUploadWrapper) {
        imageUploadWrapper.style.display = isReadOnly ? 'none' : 'block';
    }
}

function openCreateEventModal() {
    currentEventId = null;
    currentBase64Image = null;
    document.getElementById('modalTitle').textContent = 'Tạo sự kiện mới';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    
    // Clear tags
    document.querySelectorAll('.category-tag').forEach(tag => tag.classList.remove('selected'));
    
    // Clear lists
    const tbody = document.getElementById('budgetTableBody');
    if(tbody) tbody.innerHTML = '';
    calculateBudgetTotal();
    
    const list = document.getElementById('organizersList');
    if(list) list.innerHTML = '';
    
    document.getElementById('statusGroup').style.display = 'none';
    setFormReadOnly(false);
    
    document.querySelector('.btn-save-draft').textContent = 'Lưu bản nháp';
    document.querySelector('.btn-submit').textContent = 'Gửi phê duyệt';
    
    document.getElementById('eventModal').classList.add('active');
}

function openEditEventModal(id) {
    const event = eventsData.find(e => e.idSuKien === id);
    if (!event) return;
    
    currentEventId = id;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sự kiện';
    document.getElementById('eventId').value = event.idSuKien;
    
    document.getElementById('eventName').value = event.tenSuKien;
    document.getElementById('eventLocation').value = event.idDiaDiem || '';
    
    // Convert dates to local datetime-local format
    const startObj = new Date(event.thoiGianBatDau);
    startObj.setMinutes(startObj.getMinutes() - startObj.getTimezoneOffset());
    document.getElementById('eventStartTime').value = startObj.toISOString().slice(0, 16);
    
    const endObj = new Date(event.thoiGianKetThuc);
    endObj.setMinutes(endObj.getMinutes() - endObj.getTimezoneOffset());
    document.getElementById('eventEndTime').value = endObj.toISOString().slice(0, 16);
    
    document.getElementById('eventMaxAttendees').value = event.soLuongToiDa || '';
    document.getElementById('eventDescription').value = event.moTa || '';
    
    // Image
    currentBase64Image = event.hinhAnh || null;
    const imgPreview = document.getElementById('imagePreview');
    if (currentBase64Image) {
        imgPreview.src = currentBase64Image;
        imgPreview.style.display = 'block';
    } else {
        imgPreview.style.display = 'none';
    }
    
    // Categories
    document.querySelectorAll('.category-tag').forEach(tag => tag.classList.remove('selected'));
    if (event.danhMucs) {
        event.danhMucs.forEach(dm => {
            const tag = document.querySelector(`.category-tag[data-id="${dm.idDanhMuc}"]`);
            if (tag) tag.classList.add('selected');
        });
    }

    // Budget
    const tbody = document.getElementById('budgetTableBody');
    if(tbody) tbody.innerHTML = '';
    if (event.nganSachs && event.nganSachs.length > 0) {
        event.nganSachs.forEach(ns => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${escapeHtml(ns.tenHangMuc)}" style="width: 100%;"></td>
                <td><input type="number" value="${ns.soLuong}" min="1" class="budget-qty" oninput="calculateBudgetTotal()" style="width: 100%;"></td>
                <td><input type="number" value="${ns.donGia}" min="0" class="budget-price" oninput="calculateBudgetTotal()" style="width: 100%;"></td>
                <td class="total-cell" style="font-weight: 500; color: #0f172a;">${new Intl.NumberFormat('vi-VN').format(ns.thanhTien)}</td>
                <td><button type="button" class="btn-remove" onclick="this.closest('tr').remove(); calculateBudgetTotal();" style="color: #ef4444; background: none; border: none; cursor: pointer;"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    calculateBudgetTotal();

    // Organizers
    const list = document.getElementById('organizersList');
    if(list) list.innerHTML = '';
    if (event.thanhVienBTCs && event.thanhVienBTCs.length > 0) {
        event.thanhVienBTCs.forEach(tv => {
            const div = document.createElement('div');
            div.className = 'organizer-item new-organizer';
            div.dataset.userId = tv.idNguoiDung;
            div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc; margin-top: 10px; border-radius: 8px;';
            const userName = tv.hoTen || 'Chưa cập nhật';
            const avatarInitial = userName ? userName.charAt(0).toUpperCase() : 'U';
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <div style="width: 32px; height: 32px; background: #64748b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${avatarInitial}</div>
                    <div class="organizer-info" style="flex: 1; display: flex; align-items: center;">
                        <div class="organizer-name" style="font-weight: 600; font-size: 14px;">${escapeHtml(userName)}</div>
                    </div>
                </div>
                <div style="margin-left: 10px;">
                    <button type="button" onclick="removeOrganizer('${tv.idNguoiDung}')" style="color: #ef4444; background: none; border: none; cursor: pointer; padding: 4px;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    // Status badge
    const statusInfo = getEventStatusInfo(event);
    const badgeDiv = document.getElementById('eventStatusBadge');
    badgeDiv.innerHTML = `<span style="display:inline-block; padding: 4px 12px; border-radius: 4px; background: var(--${statusInfo.class}-bg, #e2e8f0); color: var(--${statusInfo.class}-color, #475569); font-weight: 500;">
        <i class="fas ${statusInfo.icon}"></i> ${event.trangThai}
    </span>`;
    document.getElementById('statusGroup').style.display = 'block';
    
    setFormReadOnly(false);
    
    document.querySelector('.btn-save-draft').textContent = 'Cập nhật bản nháp';
    document.querySelector('.btn-submit').textContent = 'Cập nhật & Gửi phê duyệt';
    
    document.getElementById('eventModal').classList.add('active');
}

function openViewEventModal(id) {
    openEditEventModal(id);
    document.getElementById('modalTitle').textContent = 'Chi tiết sự kiện';
    
    setFormReadOnly(true);
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

async function saveEvent(forceStatus = null) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    const selectedTags = document.querySelectorAll('.category-tag.selected');
    const selectedCategories = Array.from(selectedTags).map(t => parseInt(t.dataset.id));
    
    const startValue = document.getElementById('eventStartTime').value;
    const endValue = document.getElementById('eventEndTime').value;
    const startObj = new Date(startValue);
    const endObj = new Date(endValue);
    
    if (endObj <= startObj) {
        showToast("Thời gian kết thúc phải lớn hơn thời gian bắt đầu", "error");
        return;
    }
    
    const thanhVienBTCs = [];
    document.querySelectorAll('.organizer-item').forEach(item => {
        const roleInput = item.querySelector('.role-input');
        thanhVienBTCs.push({
            idNguoiDung: item.dataset.userId,
            vaiTro: roleInput ? roleInput.value : ''
        });
    });

    const nganSachs = [];
    document.querySelectorAll('#budgetTableBody tr').forEach(row => {
        const nameInput = row.querySelector('td:nth-child(1) input');
        const qtyInput = row.querySelector('.budget-qty');
        const priceInput = row.querySelector('.budget-price');
        
        if (nameInput && qtyInput && priceInput && nameInput.value.trim() !== '') {
            const qty = parseInt(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            nganSachs.push({
                tenHangMuc: nameInput.value.trim(),
                loai: "other",
                soLuong: qty,
                donGia: price,
                thanhTien: qty * price
            });
        }
    });

    const formData = {
        tenSuKien: document.getElementById('eventName').value,
        idDiaDiem: parseInt(document.getElementById('eventLocation').value) || null,
        thoiGianBatDau: startValue,
        thoiGianKetThuc: endValue,
        soLuongToiDa: parseInt(document.getElementById('eventMaxAttendees').value) || null,
        moTa: document.getElementById('eventDescription').value,
        danhMucIds: selectedCategories,
        idNguoiTao: userData.idNguoiDung,
        hinhAnh: currentBase64Image,
        thanhVienBTCs: thanhVienBTCs,
        nganSachs: nganSachs
    };
    
    if (forceStatus) formData.trangThai = forceStatus;
    else formData.trangThai = 'Chờ duyệt'; // Trạng thái khi Gửi phê duyệt mới/chỉnh sửa

    try {
        const url = currentEventId ? `${window.API_BASE}/SuKien/${currentEventId}` : `${window.API_BASE}/SuKien`;
        const method = currentEventId ? 'PUT' : 'POST';
        
        const res = await authFetch(url, {
            method: method,
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            showToast("Lưu sự kiện thành công!", "success");
            closeEventModal();
            loadEvents();
        } else {
            const err = await res.json();
            showToast(err.message || "Lỗi khi lưu sự kiện", "error");
        }
    } catch (error) {
        console.error("Save error:", error);
        showToast("Lỗi hệ thống", "error");
    }
}

let eventToCancel = null;
function confirmCancelEvent(id) {
    eventToCancel = id;
    document.getElementById('cancelReason').value = '';
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    eventToCancel = null;
    document.getElementById('confirmModal').classList.remove('active');
}

async function cancelEvent() {
    if (!eventToCancel) return;
    
    const reason = document.getElementById('cancelReason').value;
    try {
        const res = await authFetch(`${window.API_BASE}/SuKien/${eventToCancel}/huy`, {
            method: 'PUT',
            body: JSON.stringify({ lyDoHuy: reason })
        });
        
        if (res.ok) {
            showToast("Đã hủy sự kiện", "success");
            closeConfirmModal();
            loadEvents();
        } else {
            const err = await res.json();
            showToast(err.message || "Không thể hủy sự kiện", "error");
        }
    } catch (error) {
        console.error("Cancel error:", error);
        showToast("Lỗi hệ thống", "error");
    }
}

async function deleteEvent(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện nháp này không? Thao tác này không thể hoàn tác.")) return;
    
    try {
        const res = await authFetch(`${window.API_BASE}/SuKien/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok || res.status === 204) {
            showToast("Đã xóa sự kiện thành công", "success");
            loadEvents();
        } else {
            const err = await res.json();
            showToast(err.message || "Không thể xóa sự kiện", "error");
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Lỗi hệ thống", "error");
    }
}

async function submitApproval(id) {
    if(!confirm("Bạn có chắc chắn muốn gửi phê duyệt sự kiện này?")) return;
    
    const event = eventsData.find(e => e.idSuKien === id);
    if (!event) return;
    
    const formData = {
        tenSuKien: event.tenSuKien,
        idDiaDiem: event.idDiaDiem,
        thoiGianBatDau: event.thoiGianBatDau,
        thoiGianKetThuc: event.thoiGianKetThuc,
        soLuongToiDa: event.soLuongToiDa,
        moTa: event.moTa,
        danhMucIds: event.danhMucs ? event.danhMucs.map(dm => dm.idDanhMuc) : [],
        idNguoiTao: event.idNguoiTao,
        hinhAnh: event.hinhAnh,
        trangThai: 'Chờ duyệt'
    };
    
    try {
        const res = await authFetch(`${window.API_BASE}/SuKien/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            showToast("Đã gửi phê duyệt thành công!", "success");
            loadEvents();
        } else {
            const err = await res.json();
            showToast(err.message || "Lỗi khi gửi phê duyệt", "error");
        }
    } catch (error) {
        console.error("Submit approval error:", error);
        showToast("Lỗi hệ thống", "error");
    }
}

// Utils
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        Object.assign(toastContainer.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: '10px'
        });
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    Object.assign(toast.style, {
        background: bgColor, color: 'white', padding: '12px 20px',
        borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '250px', display: 'flex', justifyContent: 'space-between',
        animation: 'slideIn 0.3s ease forwards'
    });
    
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:none;border:none;color:white;cursor:pointer;margin-left:10px" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

window.addBudgetRow = function() {
    if (document.getElementById('eventForm').classList.contains('readonly')) return;
    const tbody = document.getElementById('budgetTableBody');
    if(!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Nhập tên hạng mục..." style="width: 100%;" ${document.getElementById('eventForm').classList.contains('readonly') ? 'disabled' : ''}></td>
        <td><input type="number" value="1" min="1" class="budget-qty" oninput="calculateBudgetTotal()" style="width: 100%;" ${document.getElementById('eventForm').classList.contains('readonly') ? 'disabled' : ''}></td>
        <td><input type="number" value="0" min="0" class="budget-price" oninput="calculateBudgetTotal()" style="width: 100%;" ${document.getElementById('eventForm').classList.contains('readonly') ? 'disabled' : ''}></td>
        <td class="total-cell" style="font-weight: 500; color: #0f172a;">0</td>
        <td><button type="button" class="btn-remove" onclick="this.closest('tr').remove(); calculateBudgetTotal();" style="color: #ef4444; background: none; border: none; cursor: pointer;" ${document.getElementById('eventForm').classList.contains('readonly') ? 'disabled' : ''}><i class="fas fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    calculateBudgetTotal();
}

window.calculateBudgetTotal = function() {
    const rows = document.querySelectorAll('#budgetTableBody tr');
    let grandTotal = 0;
    
    rows.forEach(row => {
        const qtyInput = row.querySelector('.budget-qty');
        const priceInput = row.querySelector('.budget-price');
        const totalCell = row.querySelector('.total-cell');
        
        if (qtyInput && priceInput && totalCell) {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const rowTotal = qty * price;
            
            grandTotal += rowTotal;
            totalCell.textContent = new Intl.NumberFormat('vi-VN').format(rowTotal);
        }
    });
    
    const grandTotalEl = document.getElementById('budgetGrandTotal');
    if (grandTotalEl) {
        grandTotalEl.textContent = new Intl.NumberFormat('vi-VN').format(grandTotal) + ' VNĐ';
    }
}

window.toggleUserSelection = function() {
    if (document.getElementById('eventForm').classList.contains('readonly')) return;
    
    const container = document.getElementById('userSelectionContainer');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        renderUserCheckboxes();
    } else {
        container.style.display = 'none';
    }
}

window.filterUserSelection = function() {
    const term = document.getElementById('userSearchInput').value.toLowerCase();
    renderUserCheckboxes(term);
}

function renderUserCheckboxes(filterTerm = '') {
    const container = document.getElementById('userCheckboxes');
    container.innerHTML = '';
    
    // Ignore current logged in user (organizer themselves) if needed, but let's show all
    const filteredUsers = usersData.filter(u => 
        (u.hoTen && u.hoTen.toLowerCase().includes(filterTerm)) ||
        (u.maSoSSO && u.maSoSSO.toLowerCase().includes(filterTerm)) ||
        (u.email && u.email.toLowerCase().includes(filterTerm))
    );
    
    // Get currently added users to check them
    const addedUserIds = Array.from(document.querySelectorAll('.organizer-item')).map(el => el.dataset.userId);

    if (filteredUsers.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 14px;">Không tìm thấy người dùng.</p>';
        return;
    }

    filteredUsers.forEach(u => {
        const isChecked = addedUserIds.includes(u.idNguoiDung) ? 'checked' : '';
        const nameText = `${u.hoTen || 'Chưa cập nhật'} (${u.maSoSSO || u.email})`;
        
        container.innerHTML += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" value="${u.idNguoiDung}" onchange="handleUserSelectionChange(this, '${u.idNguoiDung}', '${escapeHtml(u.hoTen || '')}', '${escapeHtml(u.maSoSSO || '')}')" ${isChecked}>
                <span>${escapeHtml(nameText)}</span>
            </label>
        `;
    });
}

window.handleUserSelectionChange = function(checkbox, userId, userName, maSo) {
    const list = document.getElementById('organizersList');
    
    if (checkbox.checked) {
        // Add to list
        const div = document.createElement('div');
        div.className = 'organizer-item new-organizer';
        div.dataset.userId = userId;
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc; margin-top: 10px; border-radius: 8px;';
        
        const avatarInitial = userName ? userName.charAt(0).toUpperCase() : 'U';
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <div style="width: 32px; height: 32px; background: #64748b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${avatarInitial}</div>
                <div class="organizer-info" style="flex: 1; display: flex; align-items: center;">
                    <div class="organizer-name" style="font-weight: 600; font-size: 14px;">${userName} <span style="font-weight:normal; color:#666; font-size: 12px;">(${maSo})</span></div>
                </div>
            </div>
            <div style="margin-left: 10px;">
                <button type="button" onclick="removeOrganizer('${userId}')" style="color: #ef4444; background: none; border: none; cursor: pointer; padding: 4px;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    } else {
        // Remove from list
        removeOrganizer(userId);
    }
}

window.removeOrganizer = function(userId) {
    const items = document.querySelectorAll('.organizer-item');
    items.forEach(item => {
        if (item.dataset.userId === userId) {
            item.remove();
        }
    });
    // Uncheck if modal is open
    const checkbox = document.querySelector(`#userCheckboxes input[value="${userId}"]`);
    if (checkbox) checkbox.checked = false;
}

