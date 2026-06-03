<<<<<<< HEAD
// Admin Users Page - API Integration
let users = [];
let editingUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin users page loaded');
    await loadUsers();
    initializeEventHandlers();
});

async function loadUsers() {
    try {
        users = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG);
        console.log('Users loaded:', users);
        renderUsersTable(users);
        updateStats(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Không thể tải danh sách người dùng.');
    }
}

function renderUsersTable(users) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const roleClass = user.vaiTros && user.vaiTros.length > 0 ? 'badge-info' : 'badge-default';
        const roleName = user.vaiTros && user.vaiTros.length > 0 ? user.vaiTros[0] : 'Người dùng';
        
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox"></td>
            <td>
                <div class="user-cell">
                    <img src="${user.anhDaiDien || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=3b82f6&color=fff`}" 
                         alt="User" class="user-avatar-small">
                    <div>
                        <div class="user-name-cell">${user.hoTen}</div>
                        <div class="user-id-cell">${user.idNguoiDung}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge ${roleClass}">${roleName}</span></td>
            <td><span class="status-badge active">Hoạt động</span></td>
            <td>-</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="editUser('${user.idNguoiDung}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteUser('${user.idNguoiDung}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats(users) {
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) totalElement.textContent = users.length;
    
    const activeElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (activeElement) activeElement.textContent = users.length;
}

function openAddUserModal() {
    editingUserId = null;
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (modalTitle) modalTitle.textContent = 'Thêm người dùng mới';
    if (form) form.reset();
    if (modal) modal.style.display = 'flex';
}

async function editUser(userId) {
    editingUserId = userId;
    try {
        const user = await API.get(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(userId));
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalTitle) modalTitle.textContent = 'Chỉnh sửa người dùng';
        
        document.getElementById('userName').value = user.hoTen;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userId').value = user.maSoSSO;
        document.getElementById('userPhone').value = user.sdt || '';
        
        if (modal) modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Không thể tải thông tin người dùng');
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'none';
    editingUserId = null;
}

async function saveUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    if (!name || !email) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    const userData = {
        hoTen: name,
        email: email,
        sdt: phone
    };
    
    try {
        if (editingUserId) {
            await API.put(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(editingUserId), userData);
            alert('Cập nhật người dùng thành công!');
        } else {
            const createData = {
                ...userData,
                idNguoiDung: document.getElementById('userId').value.trim(),
                maSoSSO: document.getElementById('userId').value.trim(),
                matKhauSSO: document.getElementById('userPassword').value
            };
            await API.post(API_CONFIG.ENDPOINTS.NGUOIDUNG, createData);
            alert('Thêm người dùng mới thành công!');
        }
        
        await loadUsers();
        closeUserModal();
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Không thể lưu người dùng. Vui lòng thử lại.');
    }
}

async function deleteUser(userId) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa người dùng này?');
    if (!confirmed) return;
    
    try {
        await API.delete(API_CONFIG.ENDPOINTS.NGUOIDUNG_BY_ID(userId));
        alert('Xóa người dùng thành công!');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Không thể xóa người dùng.');
    }
}

function exportUsers() {
    alert('Tính năng xuất danh sách đang được phát triển');
}

function applyFilters() {
    alert('Tính năng lọc đang được phát triển');
}

function initializeEventHandlers() {
    const addBtn = document.querySelector('.btn-primary');
    if (addBtn) addBtn.addEventListener('click', openAddUserModal);
    
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) closeBtn.addEventListener('click', closeUserModal);
    
    const cancelBtn = document.querySelector('.btn-cancel-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeUserModal);
    
    const saveBtn = document.querySelector('.btn-submit');
    if (saveBtn) saveBtn.addEventListener('click', saveUser);
    
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeUserModal();
        });
    }
}

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

window.openAddUserModal = openAddUserModal;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.exportUsers = exportUsers;
window.applyFilters = applyFilters;
=======
const API_URL = "https://localhost:7160/api/NguoiDung";

let allUsers = [];
let editingId = null;

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    await loadUsers();

    initTabs();
    initSearch();
    initSelectAll();
});

// ==========================
// LOAD USERS
// ==========================
async function loadUsers() {
    try {
        const response = await fetch(API_URL);
        allUsers = await response.json();

        renderUsers(allUsers);

    } catch (error) {
        console.error("Lỗi load users:", error);
        alert("Không tải được dữ liệu người dùng");
    }
}

// ==========================
// RENDER TABLE
// ==========================
function renderUsers(users) {
    const tbody = document.querySelector('.admin-table tbody');

    if (!tbody) return;

    tbody.innerHTML = "";

    users.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" class="row-checkbox"></td>
                <td>${user.id}</td>
                <td>${user.hoTen || ""}</td>
                <td>${user.email || ""}</td>
                <td>${user.vaiTro || ""}</td>
                <td>${user.trangThai ? "Hoạt động" : "Khóa"}</td>
                <td>
                    <button onclick="editUser(${user.id})">Sửa</button>
                    <button onclick="deleteUser(${user.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
}

// ==========================
// FILTERS
// ==========================
function applyFilters() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = [...allUsers];

    if (roleFilter) {
        filtered = filtered.filter(user => user.vaiTro === roleFilter);
    }

    if (statusFilter !== "") {
        filtered = filtered.filter(user =>
            String(user.trangThai) === statusFilter
        );
    }

    renderUsers(filtered);
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

            if (filter === "all") {
                renderUsers(allUsers);
            } else {
                const filtered = allUsers.filter(user =>
                    user.vaiTro === filter
                );

                renderUsers(filtered);
            }
        });
    });
}

// ==========================
// SELECT ALL
// ==========================
function initSelectAll() {
    const selectAll = document.getElementById('selectAll');

    if (!selectAll) return;

    selectAll.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });
}

// ==========================
// EXPORT
// ==========================
function exportUsers() {
    alert('Đang xuất danh sách người dùng...');
}

// ==========================
// MODAL
// ==========================
function openAddUserModal() {
    editingId = null;

    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');

    modalTitle.textContent = 'Thêm người dùng mới';
    form.reset();
    modal.style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

// ==========================
// EDIT
// ==========================
async function editUser(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const user = await response.json();

        editingId = id;

        document.getElementById('modalTitle').textContent = 'Chỉnh sửa người dùng';

        document.getElementById('userName').value = user.hoTen || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.vaiTro || '';
        document.getElementById('userStatus').value = user.trangThai;

        document.getElementById('userModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu");
    }
}

// ==========================
// DELETE
// ==========================
async function deleteUser(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        alert('Đã xóa người dùng');
        loadUsers();

    } catch (error) {
        console.error(error);
        alert('Xóa thất bại');
    }
}

// ==========================
// SAVE
// ==========================
async function saveUser() {
    const form = document.getElementById('userForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const password = document.getElementById('userPassword').value;
    const passwordConfirm = document.getElementById('userPasswordConfirm').value;

    if (password !== passwordConfirm) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }

    const data = {
        hoTen: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        matKhau: password,
        vaiTro: document.getElementById('userRole').value,
        trangThai: document.getElementById('userStatus').value === "true"
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

        alert('Lưu thành công');
        closeUserModal();
        loadUsers();

    } catch (error) {
        console.error(error);
        alert('Lưu thất bại');
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

        const filtered = allUsers.filter(user =>
            JSON.stringify(user).toLowerCase().includes(searchTerm)
        );

        renderUsers(filtered);
    });
}

// ==========================
// CLOSE EVENTS
// ==========================
window.addEventListener('click', function (event) {
    const modal = document.getElementById('userModal');

    if (event.target === modal) {
        closeUserModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeUserModal();
    }
});
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
