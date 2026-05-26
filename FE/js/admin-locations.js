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
    } catch (error) {
        console.error('Error loading locations:', error);
        showError('Không thể tải danh sách địa điểm. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// ===== Render cards =====
function renderLocationCards(locs) {
    const container = document.querySelector('.locations-grid');
    if (!container) return;

    container.innerHTML = '';

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
        });
    });
}

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
}
window.openAddLocationModal = openAddLocationModal;

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
    }
}
window.openEditModal = openEditModal;

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    editingLocationId = null;
}
window.closeLocationModal = closeLocationModal;

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
    }
}
window.saveLocation = saveLocation;

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
}
window.deleteLocation = deleteLocation;

function exportLocations() {
    alert('Tính năng xuất danh sách đang được phát triển');
}
window.exportLocations = exportLocations;

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

// Đóng modal khi click ngoài
document.getElementById('locationModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('locationModal')) closeLocationModal();
});
