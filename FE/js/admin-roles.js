// Admin Roles JavaScript

// Open assign role modal
function openAssignRoleModal() {
    const modal = document.getElementById('roleModal');
    const form = document.getElementById('roleForm');
    
    if (modal && form) {
        form.reset();
        modal.style.display = 'flex';
    }
}

// Close role modal
function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit user role
function editUserRole(id) {
    console.log('Editing user role:', id);
    const modal = document.getElementById('roleModal');
    
    if (modal) {
        modal.style.display = 'flex';
        // TODO: Load user roles and populate form
    }
}

// Remove role
function removeRole(id) {
    console.log('Removing role from user:', id);
    if (confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
        // TODO: Implement API call to remove role
        alert('Đã xóa vai trò!');
        location.reload();
    }
}

// Save role
function saveRole() {
    const form = document.getElementById('roleForm');
    if (form && form.checkValidity()) {
        const selectUser = document.getElementById('selectUser').value;
        const checkboxes = document.querySelectorAll('.role-checkboxes input[type="checkbox"]:checked');
        const roles = Array.from(checkboxes).map(cb => cb.value);
        
        if (roles.length === 0) {
            alert('Vui lòng chọn ít nhất một vai trò!');
            return;
        }
        
        console.log('Saving roles:', {
            userId: selectUser,
            roles: roles
        });
        
        // TODO: Implement API call to save roles
        alert('Đã gán vai trò thành công!');
        closeRoleModal();
        location.reload();
    } else {
        form.reportValidity();
    }
}

// Filter by role
document.addEventListener('DOMContentLoaded', function() {
    const roleFilter = document.getElementById('roleFilterTable');
    
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            const filter = this.value;
            console.log('Filter by role:', filter);
            // TODO: Implement filter logic
        });
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('roleModal');
    if (event.target === modal) {
        closeRoleModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRoleModal();
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
