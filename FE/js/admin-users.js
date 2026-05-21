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
