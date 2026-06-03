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

    } catch (error) {
        console.error("Lỗi load địa điểm:", error);
        showError('Không tải được dữ liệu địa điểm. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// ==========================
// RENDER CARDS (grid view)
// ==========================
function renderLocationCards(locations) {
    const container = document.querySelector('.locations-grid');
    if (!container) return;

    container.innerHTML = '';

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
        });
    });
}

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
}

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
    }
}

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
}

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
    }
}

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
}

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
}

// ==========================
// SHOW ERROR
// ==========================
function showError(message) {
    const container = document.querySelector('.main-content');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'text-align: center; padding: 40px; color: #dc2626; background: #fee2e2; border-radius: 8px; margin: 20px 0;';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3>Có lỗi xảy ra</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="location.reload()" style="margin-top: 16px;">Thử lại</button>
        `;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

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