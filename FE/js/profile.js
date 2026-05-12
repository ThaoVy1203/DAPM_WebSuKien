// Profile Page JavaScript

// Edit Personal Info
document.getElementById('editPersonalInfo')?.addEventListener('click', function() {
    alert('Chức năng chỉnh sửa thông tin cá nhân đang được phát triển');
});

// Edit Interests
document.getElementById('editInterests')?.addEventListener('click', function() {
    const activeInterests = document.querySelectorAll('.interest-tag.active');
    const interests = Array.from(activeInterests).map(tag => tag.textContent.trim());
    
    console.log('Sở thích đã chọn:', interests);
    alert(`Đã lưu ${interests.length} sở thích của bạn!`);
});

// Toggle Interest Tags
document.querySelectorAll('.interest-tag').forEach(tag => {
    tag.addEventListener('click', function() {
        this.classList.toggle('active');
    });
});

// Settings Items Click
document.querySelectorAll('.setting-item').forEach(item => {
    item.addEventListener('click', function(e) {
        // Skip if clicking on toggle switch
        if (e.target.closest('.toggle')) {
            return;
        }

        const settingTitle = this.querySelector('h4').textContent;
        
        if (settingTitle === 'Đăng xuất') {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        } else if (settingTitle === 'Thay đổi mật khẩu') {
            alert('Chức năng thay đổi mật khẩu đang được phát triển');
        } else if (settingTitle === 'Quyền riêng tư') {
            alert('Chức năng cài đặt quyền riêng tư đang được phát triển');
        }
    });
});

// View Details Button
document.querySelector('.btn-view-details')?.addEventListener('click', function() {
    alert('Chức năng xem chi tiết điểm rèn luyện đang được phát triển');
});

// Edit Avatar
document.querySelector('.edit-avatar-btn')?.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.querySelector('.profile-avatar').src = event.target.result;
                alert('Ảnh đại diện đã được cập nhật!');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
});

// User Menu Dropdown
document.querySelector('.user-menu')?.addEventListener('click', function() {
    alert('Menu người dùng đang được phát triển');
});

// Notification Button
document.querySelector('.btn-notification')?.addEventListener('click', function() {
    window.location.href = 'notifications.html';
});

// Load user data from localStorage
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.name) {
        document.querySelector('.profile-name').textContent = user.name;
    }
    
    if (user.email) {
        const emailElement = document.querySelector('.info-item p');
        if (emailElement) {
            emailElement.textContent = user.email;
        }
    }
    
    if (user.studentId) {
        const idElement = document.querySelector('.profile-meta span:first-child');
        if (idElement) {
            idElement.innerHTML = `<i class="fas fa-id-card"></i> ID: ${user.studentId}`;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        // Uncomment to enforce authentication
        // window.location.href = 'login.html';
    }
});

// Export functions
window.profileModule = {
    loadUserData
};
