<<<<<<< HEAD
// Admin Locations Page - API Integration
let locations = [];
let editingLocationId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin locations page loaded');
    
    // Load locations from API
    await loadLocations();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load all locations from API
async function loadLocations() {
    try {
        console.log('Loading locations from API...');
        
        locations = await API.get(API_CONFIG.ENDPOINTS.DIADIEM);
        console.log('Locations loaded:', locations);
        
        // Render locations
        renderLocationCards(locations);
        renderLocationTable(locations);
        updateStats(locations);
        
    } catch (error) {
        console.error('Error loading locations:', error);
        showError('Không thể tải danh sách địa điểm. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render location cards
function renderLocationCards(locations) {
    const container = document.querySelector('.locations-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    locations.slice(0, 6).forEach(location => {
        const card = createLocationCard(location);
        container.appendChild(card);
    });
}

// Create location card
function createLocationCard(location) {
    const card = document.createElement('div');
    card.className = 'location-card';
    
    const statusClass = location.trangThaiSuDung === 'Hoạt động' ? 'available' : 'maintenance';
    const statusText = location.trangThaiSuDung || 'Hoạt động';
    
    card.innerHTML = `
        <div class="location-image">
            <img src="../images/location${location.idDiaDiem}.jpg" alt="${location.tenDiaDiem}" 
                 onerror="this.src='https://via.placeholder.com/400x250/0D5A9C/FFFFFF?text=${encodeURIComponent(location.tenDiaDiem)}'">
            <span class="location-status ${statusClass}">${statusText}</span>
        </div>
        <div class="location-info">
            <h3>${location.tenDiaDiem}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${location.viTri || 'Chưa xác định'}</p>
            <div class="location-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>${location.sucChua || 0} người</span>
                </div>
                <div class="stat">
                    <i class="fas fa-calendar-check"></i>
                    <span>0 sự kiện</span>
                </div>
            </div>
            <div class="location-actions">
                <button class="btn-action edit" onclick="openEditModal(${location.idDiaDiem})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteLocation(${location.idDiaDiem})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Render location table
function renderLocationTable(locations) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    locations.forEach((location, index) => {
        const row = document.createElement('tr');
        
        const statusClass = location.trangThaiSuDung === 'Hoạt động' ? 'active' : 'inactive';
        const statusText = location.trangThaiSuDung || 'Hoạt động';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${location.tenDiaDiem}</strong></td>
            <td>${location.viTri || 'Chưa xác định'}</td>
            <td>${location.sucChua || 0}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>0</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="openEditModal(${location.idDiaDiem})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteLocation(${location.idDiaDiem})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats(locations) {
    // Total locations
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) {
        totalElement.textContent = locations.length;
    }
    
    // Available locations
    const availableCount = locations.filter(l => l.trangThaiSuDung === 'Hoạt động').length;
    const availableElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (availableElement) {
        availableElement.textContent = availableCount;
    }
    
    // Total capacity
    const totalCapacity = locations.reduce((sum, l) => sum + (l.sucChua || 0), 0);
    const capacityElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (capacityElement) {
        capacityElement.textContent = totalCapacity.toLocaleString();
    }
}

// Open add location modal
function openAddModal() {
    editingLocationId = null;
    
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('locationForm');
    
    if (modalTitle) modalTitle.textContent = 'Thêm địa điểm mới';
    if (form) form.reset();
    if (modal) modal.style.display = 'flex';
}

// Open edit location modal
async function openEditModal(locationId) {
    editingLocationId = locationId;
    
    try {
        const location = await API.get(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(locationId));
        
        const modal = document.getElementById('locationModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalTitle) modalTitle.textContent = 'Chỉnh sửa địa điểm';
        
        // Fill form with location data
        document.getElementById('locationName').value = location.tenDiaDiem;
        document.getElementById('locationAddress').value = location.viTri || '';
        document.getElementById('locationCapacity').value = location.sucChua || '';
        document.getElementById('locationStatus').value = location.trangThaiSuDung || 'Hoạt động';
        
        if (modal) modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading location:', error);
        alert('Không thể tải thông tin địa điểm');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('locationModal');
    if (modal) modal.style.display = 'none';
    editingLocationId = null;
}

// Save location (create or update)
async function saveLocation() {
    const name = document.getElementById('locationName').value.trim();
    const address = document.getElementById('locationAddress').value.trim();
    const capacity = parseInt(document.getElementById('locationCapacity').value) || 0;
    const status = document.getElementById('locationStatus').value;
    
    if (!name) {
        alert('Vui lòng nhập tên địa điểm');
        return;
    }
    
    const locationData = {
        tenDiaDiem: name,
        viTri: address,
        sucChua: capacity,
        trangThaiSuDung: status
    };
    
    try {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }
        
        if (editingLocationId) {
            // Update existing location
            await API.put(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(editingLocationId), locationData);
            alert('Cập nhật địa điểm thành công!');
        } else {
            // Create new location
            await API.post(API_CONFIG.ENDPOINTS.DIADIEM, locationData);
            alert('Thêm địa điểm mới thành công!');
        }
        
        // Reload locations
        await loadLocations();
        
        // Close modal
        closeModal();
        
    } catch (error) {
        console.error('Error saving location:', error);
        alert('Không thể lưu địa điểm. Vui lòng thử lại.');
    } finally {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        }
    }
}

// Delete location
async function deleteLocation(locationId) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa địa điểm này?');
    if (!confirmed) return;
    
    try {
        await API.delete(API_CONFIG.ENDPOINTS.DIADIEM_BY_ID(locationId));
        alert('Xóa địa điểm thành công!');
        
        // Reload locations
        await loadLocations();
        
    } catch (error) {
        console.error('Error deleting location:', error);
        alert('Không thể xóa địa điểm. Có thể địa điểm đang được sử dụng.');
    }
}

// Initialize event handlers
function initializeEventHandlers() {
    // Add location button
    const addBtn = document.querySelector('.btn-primary');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    // Close modal button
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel-modal');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Save button
    const saveBtn = document.querySelector('.btn-submit');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveLocation);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Show error message
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

// Make functions global for onclick handlers
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.saveLocation = saveLocation;
window.deleteLocation = deleteLocation;
=======
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
});

// ==========================
// LOAD
// ==========================
async function loadLocations() {
    try {
        const response = await fetch(API_URL);
        allLocations = await response.json();

        renderLocations(allLocations);

    } catch (error) {
        console.error("Lỗi load địa điểm:", error);
        alert("Không tải được dữ liệu địa điểm");
    }
}

// ==========================
// RENDER
// ==========================
function renderLocations(locations) {
    const container = document.querySelector('.locations-grid');

    if (!container) return;

    container.innerHTML = "";

    locations.forEach(location => {
        container.innerHTML += `
            <div class="location-card">
                <h3>${location.tenDiaDiem || ''}</h3>
                <p>Loại: ${location.loaiDiaDiem || ''}</p>
                <p>Sức chứa: ${location.sucChua || 0}</p>
                <p>Vị trí: ${location.viTri || ''}</p>
                <p>Trạng thái: ${location.trangThai ? 'Hoạt động' : 'Bảo trì'}</p>

                <div class="card-actions">
                    <button onclick="viewLocation(${location.id})">Xem</button>
                    <button onclick="editLocation(${location.id})">Sửa</button>
                    <button onclick="deleteLocation(${location.id})">Xóa</button>
                </div>
            </div>
        `;
    });
}

// ==========================
// FILTER
// ==========================
function applyFilters() {
    const capacityFilter = document.getElementById('capacityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = [...allLocations];

    if (capacityFilter) {
        filtered = filtered.filter(loc => loc.sucChua >= parseInt(capacityFilter));
    }

    if (statusFilter !== "") {
        filtered = filtered.filter(loc =>
            String(loc.trangThai) === statusFilter
        );
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
                const filtered = allLocations.filter(loc =>
                    loc.loaiDiaDiem === filter
                );

                renderLocations(filtered);
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

    document.getElementById('modalTitle').textContent = 'Thêm địa điểm mới';
    document.getElementById('locationForm').reset();
    document.getElementById('locationModal').style.display = 'flex';
}

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
}

// ==========================
// VIEW
// ==========================
async function viewLocation(id) {
    const location = allLocations.find(l => l.id === id);

    if (!location) return;

    alert(`
Tên: ${location.tenDiaDiem}
Loại: ${location.loaiDiaDiem}
Sức chứa: ${location.sucChua}
Vị trí: ${location.viTri}
    `);
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
        document.getElementById('locationType').value = location.loaiDiaDiem || '';
        document.getElementById('locationCapacity').value = location.sucChua || '';
        document.getElementById('locationPosition').value = location.viTri || '';
        document.getElementById('locationDescription').value = location.moTa || '';
        document.getElementById('locationStatus').value = location.trangThai;

        document.getElementById('locationModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu");
    }
}

// ==========================
// DELETE
// ==========================
async function deleteLocation(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        alert("Đã xóa");
        loadLocations();

    } catch (error) {
        console.error(error);
        alert("Xóa thất bại");
    }
}

// ==========================
// SAVE
// ==========================
async function saveLocation() {
    const form = document.getElementById('locationForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        tenDiaDiem: document.getElementById('locationName').value,
        loaiDiaDiem: document.getElementById('locationType').value,
        sucChua: parseInt(document.getElementById('locationCapacity').value),
        viTri: document.getElementById('locationPosition').value,
        moTa: document.getElementById('locationDescription').value,
        trangThai: document.getElementById('locationStatus').value === "true"
    };

    try {
        if (editingId) {
            await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }

        alert("Lưu thành công");
        closeLocationModal();
        loadLocations();

    } catch (error) {
        console.error(error);
        alert("Lưu thất bại");
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

        const filtered = allLocations.filter(location =>
            JSON.stringify(location).toLowerCase().includes(searchTerm)
        );

        renderLocations(filtered);
    });
}

// ==========================
// CLOSE EVENTS
// ==========================
window.addEventListener('click', function (event) {
    const modal = document.getElementById('locationModal');
    if (event.target === modal) {
        closeLocationModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeLocationModal();
    }
});
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
