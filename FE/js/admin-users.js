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