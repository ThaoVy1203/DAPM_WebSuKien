// Logout chung cho toàn bộ web
function handleLogout(e) {
    if (e) e.preventDefault();
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;

    // Xóa toàn bộ session
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    sessionStorage.clear();

    // Redirect về trang login
    // Tính đường dẫn tương đối từ trang hiện tại
    const path = window.location.pathname;
    const isInPages = path.includes('/pages/');
    window.location.href = isInPages ? 'login.html' : 'pages/login.html';
}
window.handleLogout = handleLogout;

// Gán sự kiện cho tất cả nút đăng xuất khi DOM load xong
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a.nav-item.danger, a[href="#"].danger').forEach(el => {
        if (el.textContent.trim().includes('Đăng xuất')) {
            el.addEventListener('click', handleLogout);
        }
    });
});
