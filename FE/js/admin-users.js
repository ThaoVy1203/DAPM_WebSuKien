// Admin Users JavaScript

// Filter functionality
function applyFilters() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    console.log('Applying filters:', { roleFilter, statusFilter });
    // TODO: Implement filter logic with API
}

// Tab filtering
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            console.log('Filter by:', filter);
            // TODO: Implement filter logic
        });
    });

    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
});

// Export users
function exportUsers() {
    console.log('Exporting users...');
    alert('Đang xuất danh sách người dùng...');
    // TODO: Implement export functionality
}

// Open add user modal
function openAddUserModal() {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = 'Thêm người dùng mới';
        form.reset();
        modal.style.display = 'flex';
    }
}

// Close user modal
function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit user
function editUser(id) {
    console.log('Editing user:', id);
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal && modalTitle) {
        modalTitle.textContent = 'Chỉnh sửa người dùng';
        modal.style.display = 'flex';
        // TODO: Load user data and populate form
    }
}

// Delete user
function deleteUser(id) {
    console.log('Deleting user:', id);
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        // TODO: Implement API call to delete user
        alert('Đã xóa người dùng!');
        location.reload();
    }
}

// Save user
function saveUser() {
    const form = document.getElementById('userForm');
    if (form && form.checkValidity()) {
        const userName = document.getElementById('userName').value;
        const userEmail = document.getElementById('userEmail').value;
        const userPassword = document.getElementById('userPassword').value;
        const userPasswordConfirm = document.getElementById('userPasswordConfirm').value;
        const userRole = document.getElementById('userRole').value;
        const userStatus = document.getElementById('userStatus').value;
        
        if (userPassword !== userPasswordConfirm) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        
        console.log('Saving user:', {
            userName,
            userEmail,
            userRole,
            userStatus
        });
        
        // TODO: Implement API call to save user
        alert('Đã lưu người dùng thành công!');
        closeUserModal();
        location.reload();
    } else {
        form.reportValidity();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeUserModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeUserModal();
    }
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
