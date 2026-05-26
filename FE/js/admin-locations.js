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