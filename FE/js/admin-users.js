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
=======
// Admin Users Page

// ── State ──────────────────────────────────────────────────────────────────
let allUsers    = [];   // toàn bộ từ API, không bao giờ bị thay đổi
let filteredUsers = []; // kết quả sau khi lọc
let editingUserId = null;
const PAGE_SIZE = 10;
let currentPage = 1;

// ── Khởi tạo ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    await loadUsers();
    initSearch();
    initFilterTabs();
    initFilterControls();

    // Đọc ?q= từ URL (redirect từ dashboard)
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
        const inp = document.querySelector('.search-bar input');
        if (inp) { inp.value = q; applyFilters(); }
    }
});

// ── Load từ API ─────────────────────────────────────────────────────────────
async function loadUsers() {
    try {
        allUsers = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG) || [];
        updateStats(allUsers);
        updateTabCounts(allUsers);
        applyFilters();
    } catch (err) {
        console.error('loadUsers error:', err);
        showError('Không thể tải danh sách người dùng.');
    }
}

// ── Helpers phân loại ───────────────────────────────────────────────────────
// Các vai trò "cán bộ / quản lý"
const STAFF_ROLES = ['Admin','TruongBanToChuc','ThanhVienBanToChuc',
                     'CanBoPheDuyetCap1','CanBoPheDuyetCap2'];

function getUserType(user) {
    const v = user.vaiTros || [];
    if (v.some(r => STAFF_ROLES.includes(r))) return 'staff';
    if (v.includes('GiangVien'))              return 'teacher';
    // NguoiThamGia hoặc không có vai trò → sinh viên / người tham gia
    return 'student';
}

function isActiveUser(user) {
    // API trả về bool true/false (camelCase: trangThai)
    return user.trangThai !== false;
}

// ── Cập nhật tab counts ─────────────────────────────────────────────────────
function updateTabCounts(users) {
    const counts = {
        all:     users.length,
        student: users.filter(u => getUserType(u) === 'student').length,
        teacher: users.filter(u => getUserType(u) === 'teacher').length,
        staff:   users.filter(u => getUserType(u) === 'staff').length,
    };
    const labels = { all:'Tất cả', student:'Sinh viên', teacher:'Giảng viên', staff:'Cán bộ' };
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const f = btn.dataset.filter;
        if (f in counts) btn.textContent = `${labels[f]} (${counts[f]})`;
    });
}

// ── Cập nhật stats cards ────────────────────────────────────────────────────
function updateStats(users) {
    const active   = users.filter(u =>  isActiveUser(u)).length;
    const inactive = users.filter(u => !isActiveUser(u)).length;
    const els = document.querySelectorAll('.stat-card .stat-number');
    if (els[0]) els[0].textContent = users.length.toLocaleString('vi-VN');
    if (els[1]) els[1].textContent = active.toLocaleString('vi-VN');
    if (els[2]) els[2].textContent = inactive.toLocaleString('vi-VN');
}

// ── Hàm lọc chính ──────────────────────────────────────────────────────────
function applyFilters() {
    const keyword      = (document.querySelector('.search-bar input')?.value || '').trim().toLowerCase();
    const activeTab    = document.querySelector('.tab-btn.active');
    const tabFilter    = activeTab?.dataset.filter || 'all';
    const roleFilter   = document.getElementById('roleFilter')?.value   || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    filteredUsers = allUsers.filter(user => {
        // 1. Tìm kiếm từ khóa (luôn áp dụng)
        if (keyword) {
            const haystack = [
                user.hoTen || '', user.email || '',
                user.idNguoiDung || '', user.maSoSSO || '',
                ...(user.vaiTros || []),
            ].join(' ').toLowerCase();
            if (!haystack.includes(keyword)) return false;
        }

        // 2. Tab loại người dùng
        if (tabFilter !== 'all') {
            if (getUserType(user) !== tabFilter) return false;
            // Khi lọc theo tab loại → KHÔNG áp dụng roleFilter & statusFilter
            // (tab đã đủ để phân loại, không nên bị cắt thêm)
            return true;
        }

        // 3. Dropdown vai trò (chỉ khi tab = 'all')
        if (roleFilter !== 'all') {
            const roleMap = {
                admin:   'Admin',
                btc:     'TruongBanToChuc',
                ctsv:    'CanBoPheDuyetCap1',
                bgh:     'CanBoPheDuyetCap2',
                user:    'NguoiThamGia',
                teacher: 'GiangVien',
            };
            const target = roleMap[roleFilter];
            if (target && !(user.vaiTros || []).includes(target)) return false;
        }

        // 4. Dropdown trạng thái (chỉ khi tab = 'all')
        if (statusFilter !== 'all') {
            const active = isActiveUser(user);
            if (statusFilter === 'active'   && !active) return false;
            if (statusFilter === 'inactive' &&  active) return false;
        }

        return true;
    });

    currentPage = 1;
    renderUsersTable(filteredUsers);
}
window.applyFilters = applyFilters;

// ── Khởi tạo tìm kiếm ──────────────────────────────────────────────────────
function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(applyFilters, 300); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(timer); applyFilters(); } });
}

// ── Khởi tạo tabs ──────────────────────────────────────────────────────────
function initFilterTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Reset dropdown khi đổi tab để tránh nhầm lẫn
            const rf = document.getElementById('roleFilter');
            const sf = document.getElementById('statusFilter');
            if (rf) rf.value = 'all';
            if (sf) sf.value = 'all';
            currentPage = 1;
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
// ── Khởi tạo dropdown filter ────────────────────────────────────────────────
function initFilterControls() {
    const rf = document.getElementById('roleFilter');
    const sf = document.getElementById('statusFilter');
    if (rf) rf.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    if (sf) sf.addEventListener('change', () => { currentPage = 1; applyFilters(); });
}

// ── Render bảng ─────────────────────────────────────────────────────────────
function renderUsersTable(users) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    const start    = (currentPage - 1) * PAGE_SIZE;
    const pageData = users.slice(start, start + PAGE_SIZE);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-users-slash" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                Không tìm thấy người dùng nào
            </td></tr>`;
    } else {
        tbody.innerHTML = pageData.map(user => {
            const roleName   = (user.vaiTros?.length > 0) ? user.vaiTros[0] : 'NguoiThamGia';
            const roleClass  = getRoleBadgeClass(roleName);
            const bgColor    = stringToColor(user.idNguoiDung || user.hoTen || '');
            const active     = isActiveUser(user);
            const statusCls  = active ? 'active' : 'inactive';
            const statusTxt  = active ? 'Hoạt động' : 'Tạm khóa';
            const avatarSrc  = user.anhDaiDien ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen||'U')}&background=${bgColor}&color=fff`;

            return `
            <tr>
                <td><input type="checkbox" class="row-checkbox" value="${user.idNguoiDung}"></td>
                <td>
                    <div class="user-cell">
                        <img src="${avatarSrc}" alt="User" class="user-avatar-small">
                        <div>
                            <div class="user-name-cell">${user.hoTen || '—'}</div>
                            <div class="user-id-cell">${user.idNguoiDung || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email || '—'}</td>
                <td><span class="badge ${roleClass}">${roleName}</span></td>
                <td><span class="status-badge ${statusCls}">${statusTxt}</span></td>
                <td>—</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit"   onclick="editUser('${user.idNguoiDung}')"   title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete" onclick="deleteUser('${user.idNguoiDung}')" title="Xóa"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    updateResultCount(users.length);
    renderPagination(users.length);
}

// ── Phân trang ──────────────────────────────────────────────────────────────
function renderPagination(total) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    pagination.innerHTML = '';

    const mkBtn = (html, disabled, onClick) => {
        const b = document.createElement('button');
        b.className = 'page-btn';
        b.innerHTML = html;
        b.disabled  = disabled;
        b.onclick   = onClick;
        return b;
    };

    pagination.appendChild(mkBtn('<i class="fas fa-chevron-left"></i>', currentPage === 1,
        () => { currentPage--; renderUsersTable(filteredUsers); }));

    for (let i = 1; i <= totalPages; i++) {
        const b = mkBtn(String(i), false, () => { currentPage = i; renderUsersTable(filteredUsers); });
        if (i === currentPage) b.classList.add('active');
        pagination.appendChild(b);
    }

    pagination.appendChild(mkBtn('<i class="fas fa-chevron-right"></i>', currentPage === totalPages,
        () => { currentPage++; renderUsersTable(filteredUsers); }));
}

// ── Số kết quả ──────────────────────────────────────────────────────────────
function updateResultCount(count) {
    let el = document.getElementById('userResultCount');
    if (!el) {
        el = document.createElement('p');
        el.id = 'userResultCount';
        el.style.cssText = 'font-size:13px;color:#6B7280;margin:8px 0 4px;padding:0 4px;';
        document.querySelector('.table-responsive')?.before(el);
    }
    const showing = Math.min(count - (currentPage - 1) * PAGE_SIZE, PAGE_SIZE);
    el.textContent = `Hiển thị ${count === 0 ? 0 : showing} / ${count} người dùng`;
}

// ── Modal thêm / sửa ────────────────────────────────────────────────────────
function openAddUserModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Thêm người dùng mới';
    document.getElementById('userForm').reset();
    // Hiện lại các trường chỉ dùng khi tạo mới
    ['userPassword','userPasswordConfirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.closest('.form-group').style.display = '';
    });
    document.getElementById('userModal').style.display = 'flex';
>>>>>>> origin/Nguyen
}
window.openAddUserModal = openAddUserModal;

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
<<<<<<< HEAD
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
        const user = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(userId));
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa người dùng';
        document.getElementById('userName').value  = user.hoTen  || '';
        document.getElementById('userEmail').value = user.email  || '';
        document.getElementById('userId').value    = user.maSoSSO || user.idNguoiDung || '';
        document.getElementById('userPhone').value = user.sDT || user.sdt || '';

        const sf = document.getElementById('userStatus');
        if (sf) sf.value = isActiveUser(user) ? 'active' : 'inactive';

        const rf = document.getElementById('userRole');
        if (rf && user.vaiTros?.length > 0) {
            const map = {
                Admin:'admin', NguoiThamGia:'user', GiangVien:'teacher',
                TruongBanToChuc:'btc', ThanhVienBanToChuc:'btc_member',
                CanBoPheDuyetCap1:'ctsv', CanBoPheDuyetCap2:'bgh',
            };
            rf.value = map[user.vaiTros[0]] || '';
        }

        document.getElementById('userModal').style.display = 'flex';
    } catch {
        alert('Không thể tải thông tin người dùng');
>>>>>>> origin/Nguyen
    }
}
window.editUser = editUser;

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
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    editingUserId = null;
>>>>>>> origin/Nguyen
}
window.closeUserModal = closeUserModal;

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
async function saveUser() {
    const name     = document.getElementById('userName').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const phone    = document.getElementById('userPhone').value.trim();
    const maSo     = document.getElementById('userId').value.trim();
    const password = document.getElementById('userPassword')?.value || '';
    const confirm  = document.getElementById('userPasswordConfirm')?.value || '';

    if (!name || !email) { alert('Vui lòng nhập đầy đủ họ tên và email'); return; }

    if (!editingUserId) {
        // ── Tạo mới ──
        if (!maSo)     { alert('Vui lòng nhập Mã số (MSSV/Mã CB)'); return; }
        if (!password) { alert('Vui lòng nhập mật khẩu'); return; }
        if (password !== confirm) { alert('Mật khẩu xác nhận không khớp'); return; }

        const raw = maSo.replace(/\s/g, '');
        const idNguoiDung = (raw.length >= 5 ? raw.slice(-5) : raw.padStart(5,'0')).toUpperCase();

        if (allUsers.some(u => u.idNguoiDung === idNguoiDung)) {
            alert(`ID "${idNguoiDung}" đã tồn tại. Vui lòng dùng mã số khác.`);
            return;
        }

        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NGUOIDUNG}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNguoiDung, maSoSSO: maSo, hoTen: name, email, sDT: phone||null, matKhauSSO: password }),
            });
            const data = await res.json();
            if (!res.ok) { alert(`Lỗi: ${data?.message || data?.title || JSON.stringify(data)}`); return; }

            // Gán vai trò
            const roleIdMap = { admin:1, user:2, btc:3, btc_member:4, ctsv:5, bgh:6, teacher:7 };
            const idVaiTro  = roleIdMap[document.getElementById('userRole')?.value || ''];
            if (idVaiTro) {
                await fetch(`${API_CONFIG.BASE_URL}/NguoiDung/${idNguoiDung}/vai-tro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idVaiTro }),
                }).catch(e => console.warn('Gán vai trò thất bại:', e));
            }

            alert('Thêm người dùng mới thành công!');
            await loadUsers();
            closeUserModal();
        } catch { alert('Không thể kết nối đến máy chủ.'); }

    } else {
        // ── Cập nhật ──
        const trangThai = document.getElementById('userStatus')?.value !== 'inactive';
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(editingUserId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hoTen: name, email, sDT: phone||null, trangThai }),
            });
            const data = await res.json();
            if (!res.ok) { alert(`Lỗi: ${data?.message || data?.title || JSON.stringify(data)}`); return; }
            alert('Cập nhật người dùng thành công!');
            await loadUsers();
            closeUserModal();
        } catch { alert('Không thể kết nối đến máy chủ.'); }
>>>>>>> origin/Nguyen
    }
}
window.saveUser = saveUser;

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
=======
async function deleteUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
        await API.delete(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(userId));
        alert('Xóa người dùng thành công!');
        await loadUsers();
    } catch { alert('Không thể xóa người dùng.'); }
}
window.deleteUser = deleteUser;

function exportUsers() { alert('Tính năng xuất danh sách đang được phát triển'); }
window.exportUsers = exportUsers;

// ── Helpers ─────────────────────────────────────────────────────────────────
function getRoleBadgeClass(role) {
    return {
        Admin:'badge-purple', TruongBanToChuc:'badge-warning',
        ThanhVienBanToChuc:'badge-warning', CanBoPheDuyetCap1:'badge-success',
        CanBoPheDuyetCap2:'badge-danger', NguoiThamGia:'badge-info',
        GiangVien:'badge-purple',
    }[role] || 'badge-info';
}

function stringToColor(str) {
    const palette = ['3b82f6','8b5cf6','f59e0b','ec4899','10b981','ef4444','6366f1','14b8a6'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
}

function showError(msg) {
    const c = document.querySelector('.main-content');
    if (!c) return;
    const d = document.createElement('div');
    d.style.cssText = 'text-align:center;padding:40px;color:#dc2626;background:#fee2e2;border-radius:8px;margin:20px 0;';
    d.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:40px;display:block;margin-bottom:12px;"></i>
        <h3>Có lỗi xảy ra</h3><p>${msg}</p>
        <button onclick="location.reload()" style="margin-top:12px;padding:8px 20px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Thử lại</button>`;
    c.insertBefore(d, c.firstChild);
}

// Đóng modal khi click ngoài
document.getElementById('userModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('userModal')) closeUserModal();
});
>>>>>>> origin/Nguyen
