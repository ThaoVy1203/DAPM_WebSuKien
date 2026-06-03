<<<<<<< HEAD
const API_URL = "https://localhost:7160/api/DiaDiem";

let editingId = null;
let allLocations = [];

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    await loadLocations();
    initTabs();
    initSearch();
    initializeEventHandlers();
});

// ==========================
// LOAD
// ==========================
async function loadLocations() {
    try {
        const response = await fetch(API_URL);
        allLocations = await response.json();

        renderLocationCards(allLocations);
        renderLocationTable(allLocations);
        renderLocations(allLocations);
        updateStats(allLocations);

=======
// Admin Locations Page

let allLocations = [];
let filteredLocations = [];
let editingLocationId = null;

document.addEventListener('DOMContentLoaded', async function () {
    await loadLocations();
    initSearch();
    initFilterTabs();
    initFilterControls();
});

// ===== Load từ API =====
async function loadLocations() {
    try {
        allLocations = await API.get(API_CONFIG.ENDPOINTS.DIADIEM) || [];
        filteredLocations = [...allLocations];
        renderLocationCards(filteredLocations);
        updateStats(allLocations);
        updateTabCounts(allLocations);
>>>>>>> origin/Nguyen
    } catch (error) {
        console.error("Lỗi load địa điểm:", error);
        showError('Không tải được dữ liệu địa điểm. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

<<<<<<< HEAD
// ==========================
// RENDER CARDS (grid view)
// ==========================
function renderLocationCards(locations) {
=======
// ===== Render cards =====
function renderLocationCards(locs) {
>>>>>>> origin/Nguyen
    const container = document.querySelector('.locations-grid');
    if (!container) return;

    container.innerHTML = '';

<<<<<<< HEAD
    locations.slice(0, 6).forEach(location => {
        const statusClass = location.trangThai ? 'available' : 'maintenance';
        const statusText = location.trangThai ? 'Hoạt động' : 'Bảo trì';

        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <div class="location-image">
                <img src="../images/location${location.id}.jpg" alt="${location.tenDiaDiem}"
                     onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=${encodeURIComponent(location.tenDiaDiem)}'">
                <span class="location-status ${statusClass}">${statusText}</span>
            </div>
            <div class="location-info">
                <h3>${location.tenDiaDiem}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${location.viTri || 'Chưa xác định'}</p>
                <p><i class="fas fa-tag"></i> ${location.loaiDiaDiem || ''}</p>
                <div class="location-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${location.sucChua || 0} người</span>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="btn-action view" onclick="viewLocation(${location.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" onclick="editLocation(${location.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteLocation(${location.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================
// RENDER TABLE
// ==========================
function renderLocationTable(locations) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    locations.forEach((location, index) => {
        const statusClass = location.trangThai ? 'active' : 'inactive';
        const statusText = location.trangThai ? 'Hoạt động' : 'Bảo trì';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${location.tenDiaDiem}</strong></td>
            <td>${location.loaiDiaDiem || ''}</td>
            <td>${location.viTri || 'Chưa xác định'}</td>
            <td>${location.sucChua || 0}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewLocation(${location.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" onclick="editLocation(${location.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteLocation(${location.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================
// RENDER (alias cho filter/tab)
// ==========================
function renderLocations(locations) {
    renderLocationCards(locations);
    renderLocationTable(locations);
}

// ==========================
// STATS
// ==========================
function updateStats(locations) {
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) totalElement.textContent = locations.length;

    const availableCount = locations.filter(l => l.trangThai).length;
    const availableElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (availableElement) availableElement.textContent = availableCount;

    const totalCapacity = locations.reduce((sum, l) => sum + (l.sucChua || 0), 0);
    const capacityElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (capacityElement) capacityElement.textContent = totalCapacity.toLocaleString();
}

// ==========================
// FILTER
// ==========================
function applyFilters() {
    const capacityFilter = document.getElementById('capacityFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;

    let filtered = [...allLocations];

    if (capacityFilter) {
        filtered = filtered.filter(loc => loc.sucChua >= parseInt(capacityFilter));
    }

    if (statusFilter !== "" && statusFilter != null) {
        filtered = filtered.filter(loc => String(loc.trangThai) === statusFilter);
    }

    renderLocations(filtered);
}

// ==========================
// TABS
// ==========================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            tabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            if (filter === 'all') {
                renderLocations(allLocations);
            } else {
                renderLocations(allLocations.filter(loc => loc.loaiDiaDiem === filter));
            }
=======
    if (locs.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#9CA3AF;">
                <i class="fas fa-map-marker-alt" style="font-size:48px;display:block;margin-bottom:16px;color:#D1D5DB;"></i>
                <h3 style="color:#374151;margin-bottom:8px;">Không tìm thấy địa điểm nào</h3>
                <p>Thử thay đổi bộ lọc hoặc thêm địa điểm mới.</p>
            </div>`;
        updateResultCount(0);
        return;
    }

    locs.forEach(loc => container.appendChild(createLocationCard(loc)));
    updateResultCount(locs.length);
}

function createLocationCard(loc) {
    const card = document.createElement('div');
    card.className = 'location-card';
    card.dataset.id = loc.idDiaDiem;
    card.dataset.capacity = loc.sucChua || 0;
    card.dataset.status = loc.trangThaiSuDung || 'Hoạt động';

    const isActive = loc.trangThaiSuDung === 'Hoạt động';
    const statusClass = isActive ? 'available' : 'maintenance';
    const statusText = loc.trangThaiSuDung || 'Hoạt động';

    card.innerHTML = `
        <div class="location-image">
            <img src="../images/location${loc.idDiaDiem}.jpg" alt="${loc.tenDiaDiem}"
                 onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=${encodeURIComponent(loc.tenDiaDiem)}'">
            <span class="location-status ${statusClass}">${statusText.toUpperCase()}</span>
        </div>
        <div class="location-info">
            <h3>${loc.tenDiaDiem}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${loc.viTri || 'Chưa xác định'}</p>
            <div class="location-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>${(loc.sucChua || 0).toLocaleString('vi-VN')} người</span>
                </div>
                <div class="stat">
                    <i class="fas fa-calendar-check"></i>
                    <span>0 sự kiện</span>
                </div>
            </div>
            <div class="location-actions">
                <button class="btn-action edit" onclick="openEditModal(${loc.idDiaDiem})" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteLocation(${loc.idDiaDiem})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    return card;
}

// ===== Cập nhật stats =====
function updateStats(locs) {
    const total = locs.length;
    const active = locs.filter(l => l.trangThaiSuDung === 'Hoạt động').length;
    const maintenance = total - active;
    const totalCap = locs.reduce((s, l) => s + (l.sucChua || 0), 0);

    const els = document.querySelectorAll('.stat-card .stat-number');
    if (els[0]) els[0].textContent = total;
    if (els[1]) els[1].textContent = active;
    if (els[2]) els[2].textContent = maintenance;
    if (els[3]) els[3].textContent = totalCap.toLocaleString('vi-VN');
}

// ===== Cập nhật số lượng tab =====
function updateTabCounts(locs) {
    const counts = {
        all: locs.length,
        hall: locs.filter(l => isHall(l)).length,
        room: locs.filter(l => isRoom(l)).length,
        outdoor: locs.filter(l => isOutdoor(l)).length,
    };
    const labels = { all: 'Tất cả', hall: 'Hội trường', room: 'Phòng học', outdoor: 'Ngoài trời' };
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const f = btn.dataset.filter;
        if (counts[f] !== undefined) btn.textContent = `${labels[f]} (${counts[f]})`;
    });
}

function isHall(loc) {
    const name = (loc.tenDiaDiem || '').toLowerCase();
    return name.includes('hội trường') || name.includes('hall') || (loc.sucChua || 0) >= 200;
}
function isRoom(loc) {
    const name = (loc.tenDiaDiem || '').toLowerCase();
    return name.includes('phòng') || name.includes('room');
}
function isOutdoor(loc) {
    const name = (loc.tenDiaDiem || '').toLowerCase();
    const pos = (loc.viTri || '').toLowerCase();
    return name.includes('sân') || name.includes('ngoài') || pos.includes('ngoài') || pos.includes('sân');
}

// ===== Số kết quả =====
function updateResultCount(count) {
    let el = document.getElementById('locationResultCount');
    if (!el) {
        el = document.createElement('p');
        el.id = 'locationResultCount';
        el.style.cssText = 'font-size:13px;color:#6B7280;margin:0 0 16px;';
        document.querySelector('.locations-grid')?.before(el);
    }
    el.textContent = `Hiển thị ${count} / ${allLocations.length} địa điểm`;
}

// ===== Tìm kiếm header =====
function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(applyFilters, 300);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(debounce); applyFilters(); } });
}

// ===== Filter tabs =====
function initFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
>>>>>>> origin/Nguyen
        });
    });
}

<<<<<<< HEAD
// ==========================
// EXPORT
// ==========================
function exportLocations() {
    alert('Xuất danh sách địa điểm...');
}

// ==========================
// MODAL
// ==========================
function openAddLocationModal() {
    editingId = null;

    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('locationForm');

    if (modalTitle) modalTitle.textContent = 'Thêm địa điểm mới';
    if (form) form.reset();
    if (modal) modal.style.display = 'flex';
=======
// ===== Filter controls =====
function initFilterControls() {
    const cap = document.getElementById('capacityFilter');
    const sta = document.getElementById('statusFilter');
    if (cap) cap.addEventListener('change', applyFilters);
    if (sta) sta.addEventListener('change', applyFilters);
}

// ===== Hàm lọc chính =====
function applyFilters() {
    const keyword = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const activeTab = document.querySelector('.tab-btn.active');
    const tabFilter = activeTab ? activeTab.dataset.filter : 'all';
    const capacityFilter = document.getElementById('capacityFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    filteredLocations = allLocations.filter(loc => {
        // Tìm kiếm từ khóa
        if (keyword) {
            const target = [loc.tenDiaDiem || '', loc.viTri || ''].join(' ').toLowerCase();
            if (!target.includes(keyword)) return false;
        }

        // Lọc theo tab loại
        if (tabFilter !== 'all') {
            if (tabFilter === 'hall' && !isHall(loc)) return false;
            if (tabFilter === 'room' && !isRoom(loc)) return false;
            if (tabFilter === 'outdoor' && !isOutdoor(loc)) return false;
        }

        // Lọc theo sức chứa — ĐÂY LÀ PHẦN BỊ LỖI, ĐÃ FIX
        const cap = loc.sucChua || 0;
        if (capacityFilter === 'small' && cap >= 100) return false;
        if (capacityFilter === 'medium' && (cap < 100 || cap > 300)) return false;
        if (capacityFilter === 'large' && cap <= 300) return false;

        // Lọc theo trạng thái
        if (statusFilter !== 'all') {
            const isActive = loc.trangThaiSuDung === 'Hoạt động';
            if (statusFilter === 'available' && !isActive) return false;
            if (statusFilter === 'maintenance' && isActive) return false;
        }

        return true;
    });

    renderLocationCards(filteredLocations);
}
window.applyFilters = applyFilters;

// ===== Modal thêm/sửa =====
function openAddLocationModal() {
    editingLocationId = null;
    document.getElementById('modalTitle').textContent = 'Thêm địa điểm mới';
    document.getElementById('locationForm').reset();
    document.getElementById('locationModal').style.display = 'flex';
>>>>>>> origin/Nguyen
}
window.openAddLocationModal = openAddLocationModal;

<<<<<<< HEAD
function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) modal.style.display = 'none';
    editingId = null;
}

// ==========================
// VIEW
// ==========================
async function viewLocation(id) {
    const location = allLocations.find(l => l.id === id);
    if (!location) return;

    alert(`Tên: ${location.tenDiaDiem}\nLoại: ${location.loaiDiaDiem || ''}\nSức chứa: ${location.sucChua || 0}\nVị trí: ${location.viTri || ''}\nTrạng thái: ${location.trangThai ? 'Hoạt động' : 'Bảo trì'}`);
}

// ==========================
// EDIT
// ==========================
async function editLocation(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const location = await response.json();

        editingId = id;

        document.getElementById('modalTitle').textContent = 'Chỉnh sửa địa điểm';
        document.getElementById('locationName').value = location.tenDiaDiem || '';
        if (document.getElementById('locationType'))
            document.getElementById('locationType').value = location.loaiDiaDiem || '';
        document.getElementById('locationCapacity').value = location.sucChua || '';
        const posEl = document.getElementById('locationPosition') || document.getElementById('locationAddress');
        if (posEl) posEl.value = location.viTri || '';
        if (document.getElementById('locationDescription'))
            document.getElementById('locationDescription').value = location.moTa || '';
        document.getElementById('locationStatus').value = location.trangThai;

        document.getElementById('locationModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert("Không tải được thông tin địa điểm");
=======
async function openEditModal(locationId) {
    editingLocationId = locationId;
    try {
        const loc = await API.get(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(locationId));
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa địa điểm';
        document.getElementById('locationName').value = loc.tenDiaDiem || '';
        document.getElementById('locationPosition').value = loc.viTri || '';
        document.getElementById('locationCapacity').value = loc.sucChua || '';
        document.getElementById('locationStatus').value =
            loc.trangThaiSuDung === 'Hoạt động' ? 'available' : 'maintenance';
        document.getElementById('locationModal').style.display = 'flex';
    } catch (e) {
        alert('Không thể tải thông tin địa điểm');
>>>>>>> origin/Nguyen
    }
}
window.openEditModal = openEditModal;

<<<<<<< HEAD
// ==========================
// DELETE
// ==========================
async function deleteLocation(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        alert("Xóa địa điểm thành công!");
        loadLocations();

    } catch (error) {
        console.error(error);
        alert("Xóa thất bại. Có thể địa điểm đang được sử dụng.");
    }
=======
function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    editingLocationId = null;
>>>>>>> origin/Nguyen
}
window.closeLocationModal = closeLocationModal;

<<<<<<< HEAD
// ==========================
// SAVE
// ==========================
async function saveLocation() {
    const form = document.getElementById('locationForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const posEl = document.getElementById('locationPosition') || document.getElementById('locationAddress');

    const data = {
        tenDiaDiem: document.getElementById('locationName').value.trim(),
        loaiDiaDiem: document.getElementById('locationType')?.value || '',
        sucChua: parseInt(document.getElementById('locationCapacity').value) || 0,
        viTri: posEl?.value.trim() || '',
        moTa: document.getElementById('locationDescription')?.value.trim() || '',
        trangThai: document.getElementById('locationStatus').value === "true"
    };

    if (!data.tenDiaDiem) {
        alert('Vui lòng nhập tên địa điểm');
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }

        if (editingId) {
            await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('Cập nhật địa điểm thành công!');
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('Thêm địa điểm mới thành công!');
        }

        closeLocationModal();
        loadLocations();

    } catch (error) {
        console.error(error);
        alert('Không thể lưu địa điểm. Vui lòng thử lại.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        }
=======
async function saveLocation() {
    const name = document.getElementById('locationName').value.trim();
    const viTri = document.getElementById('locationPosition').value.trim();
    const sucChua = parseInt(document.getElementById('locationCapacity').value) || 0;
    const statusVal = document.getElementById('locationStatus').value;
    const trangThaiSuDung = statusVal === 'available' ? 'Hoạt động' : 'Bảo trì';

    if (!name) { alert('Vui lòng nhập tên địa điểm'); return; }
    if (sucChua <= 0) { alert('Vui lòng nhập sức chứa hợp lệ'); return; }

    const data = { tenDiaDiem: name, viTri, sucChua, trangThaiSuDung };

    try {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...'; }

        if (editingLocationId) {
            await API.put(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(editingLocationId), data);
            alert('Cập nhật địa điểm thành công!');
        } else {
            await API.post(API_CONFIG.ENDPOINTS.DIADIEM, data);
            alert('Thêm địa điểm mới thành công!');
        }
        await loadLocations();
        applyFilters();
        closeLocationModal();
    } catch (e) {
        alert('Không thể lưu địa điểm. Vui lòng thử lại.');
    } finally {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu'; }
>>>>>>> origin/Nguyen
    }
}
window.saveLocation = saveLocation;

<<<<<<< HEAD
// ==========================
// SEARCH
// ==========================
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        renderLocations(allLocations.filter(location =>
            JSON.stringify(location).toLowerCase().includes(searchTerm)
        ));
    });
=======
async function deleteLocation(locationId) {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;
    try {
        await API.delete(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(locationId));
        alert('Xóa địa điểm thành công!');
        await loadLocations();
        applyFilters();
    } catch (e) {
        alert('Không thể xóa địa điểm. Có thể địa điểm đang được sử dụng.');
    }
>>>>>>> origin/Nguyen
}
window.deleteLocation = deleteLocation;

<<<<<<< HEAD
// ==========================
// EVENT HANDLERS
// ==========================
function initializeEventHandlers() {
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) closeBtn.addEventListener('click', closeLocationModal);

    const cancelBtn = document.querySelector('.btn-cancel-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeLocationModal);

    const saveBtn = document.querySelector('.btn-submit');
    if (saveBtn) saveBtn.addEventListener('click', saveLocation);
=======
function exportLocations() {
    alert('Tính năng xuất danh sách đang được phát triển');
>>>>>>> origin/Nguyen
}
window.exportLocations = exportLocations;

<<<<<<< HEAD
// ==========================
// SHOW ERROR
// ==========================
=======
>>>>>>> origin/Nguyen
function showError(message) {
    const container = document.querySelector('.main-content');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;padding:40px;color:#dc2626;background:#fee2e2;border-radius:8px;margin:20px 0;';
    div.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:40px;display:block;margin-bottom:12px;"></i>
        <h3>Có lỗi xảy ra</h3><p>${message}</p>
        <button onclick="location.reload()" style="margin-top:12px;padding:8px 20px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Thử lại</button>`;
    container.insertBefore(div, container.firstChild);
}

<<<<<<< HEAD
// ==========================
// CLOSE EVENTS
// ==========================
window.addEventListener('click', function (event) {
    const modal = document.getElementById('locationModal');
    if (event.target === modal) closeLocationModal();
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLocationModal();
});

// Make functions global for onclick handlers
window.openAddLocationModal = openAddLocationModal;
window.closeLocationModal = closeLocationModal;
window.viewLocation = viewLocation;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.saveLocation = saveLocation;
window.applyFilters = applyFilters;
window.exportLocations = exportLocations;
=======
// Đóng modal khi click ngoài
document.getElementById('locationModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('locationModal')) closeLocationModal();
});
>>>>>>> origin/Nguyen
