const API_BASE = "https://localhost:7160/api";

let allUsers = [];
let editingUserId = null;

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    await loadUsers();
    initSearch();
    initRoleFilter();
});

// ==========================
// LOAD USERS
// ==========================
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/NguoiDung`);
        allUsers = await response.json();

        renderUsers(allUsers);
        populateUserSelect(allUsers);

    } catch (error) {
        console.error("Lỗi load users:", error);
        alert("Không tải được danh sách người dùng");
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
                <td>${user.id}</td>
                <td>${user.hoTen || ''}</td>
                <td>${user.email || ''}</td>
                <td>${formatRoles(user.roles)}</td>
                <td>
                    <button onclick="editUserRole(${user.id})">Sửa</button>
                    <button onclick="removeRole(${user.id})">Xóa quyền</button>
                </td>
            </tr>
        `;
    });
}

function formatRoles(roles) {
    if (!roles || roles.length === 0) return "Chưa có";

    return roles.join(", ");
}

// ==========================
// POPULATE SELECT
// ==========================
function populateUserSelect(users) {
    const select = document.getElementById('selectUser');

    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn người dùng --</option>';

    users.forEach(user => {
        select.innerHTML += `
            <option value="${user.id}">
                ${user.hoTen}
            </option>
        `;
    });
}

// ==========================
// MODAL
// ==========================
function openAssignRoleModal() {
    editingUserId = null;

    const modal = document.getElementById('roleModal');
    const form = document.getElementById('roleForm');

    if (modal && form) {
        form.reset();

        document.querySelectorAll('.role-checkboxes input')
            .forEach(cb => cb.checked = false);

        modal.style.display = 'flex';
    }
}

function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) modal.style.display = 'none';
}

// ==========================
// EDIT USER ROLE
// ==========================
async function editUserRole(id) {
    try {
        const response = await fetch(`${API_BASE}/NguoiDung/${id}`);
        const user = await response.json();

        editingUserId = id;

        document.getElementById('selectUser').value = id;

        document.querySelectorAll('.role-checkboxes input')
            .forEach(cb => {
                cb.checked = user.roles?.includes(cb.value);
            });

        document.getElementById('roleModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert("Không tải được quyền người dùng");
    }
}

// ==========================
// REMOVE ROLE
// ==========================
async function removeRole(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ vai trò?')) return;

    try {
        await fetch(`${API_BASE}/PhanQuyen/${id}`, {
            method: 'DELETE'
        });

        alert('Đã xóa vai trò');
        loadUsers();

    } catch (error) {
        console.error(error);
        alert('Xóa thất bại');
    }
}

// ==========================
// SAVE ROLE
// ==========================
async function saveRole() {
    const form = document.getElementById('roleForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const userId = document.getElementById('selectUser').value;

    const checkboxes = document.querySelectorAll(
        '.role-checkboxes input[type="checkbox"]:checked'
    );

    const roles = Array.from(checkboxes).map(cb => cb.value);

    if (roles.length === 0) {
        alert('Vui lòng chọn ít nhất một vai trò!');
        return;
    }

    try {
        await fetch(`${API_BASE}/PhanQuyen`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                roles
            })
        });

        alert('Đã lưu phân quyền');
        closeRoleModal();
        loadUsers();

    } catch (error) {
        console.error(error);
        alert('Lưu thất bại');
    }
}

// ==========================
// ROLE FILTER
// ==========================
function initRoleFilter() {
    const roleFilter = document.getElementById('roleFilterTable');

    if (!roleFilter) return;

    roleFilter.addEventListener('change', function () {
        const filter = this.value;

        if (!filter) {
            renderUsers(allUsers);
            return;
        }

        const filtered = allUsers.filter(user =>
            user.roles?.includes(filter)
        );

        renderUsers(filtered);
    });
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
    const modal = document.getElementById('roleModal');

    if (event.target === modal) {
        closeRoleModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeRoleModal();
    }
});