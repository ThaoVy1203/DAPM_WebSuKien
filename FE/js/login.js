// API Configuration
const API_BASE_URL = 'http://localhost:5103/api';

// Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show Alert Message
function showAlert(type, message) {
    const alertId = type === 'error' ? 'errorAlert' : 'successAlert';
    const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
    const otherAlertId = type === 'error' ? 'successAlert' : 'errorAlert';
    
    // Hide other alert
    document.getElementById(otherAlertId).style.display = 'none';
    
    // Show current alert
    const alert = document.getElementById(alertId);
    const messageElement = document.getElementById(messageId);
    
    messageElement.textContent = message;
    alert.style.display = 'flex';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Hide Alert
function hideAlerts() {
    document.getElementById('errorAlert').style.display = 'none';
    document.getElementById('successAlert').style.display = 'none';
}

// Validate Email or Student ID
function validateInput(input) {
    // Check if it's email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's student ID format (numbers)
    const studentIdRegex = /^\d+$/;
    
    return emailRegex.test(input) || studentIdRegex.test(input);
}

// Handle Login Form Submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    hideAlerts();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const submitButton = document.querySelector('.btn-login');
    
    // Validation
    if (!email || !password) {
        showAlert('error', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
        return;
    }
    
    if (!validateInput(email)) {
        showAlert('error', 'Email hoặc mã số sinh viên không hợp lệ');
        return;
    }
    
    if (password.length < 6) {
        showAlert('error', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
        // Call Login API
        const response = await fetch(`${API_BASE_URL}/NguoiDung/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                maSoSSO: email,
                matKhau: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Login successful
            showAlert('success', 'Đăng nhập thành công! Đang chuyển hướng...');
            
            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(data.nguoiDung));
            localStorage.setItem('token', data.token || '');
            
            if (remember) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedEmail', email);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('savedEmail');
            }
            
            // Redirect to home-user page after 1.5 seconds
            setTimeout(() => {
                const user = data.nguoiDung;
                const vaiTros = user.vaiTros || [];

                if (vaiTros.includes('TruongBanToChuc')) {
                    window.location.href = 'btc-dashboard.html';
                } else if (vaiTros.includes('ThanhVienBanToChuc')) {
                    window.location.href = 'btc-dashboard.html';
                } else if (vaiTros.includes('CanBoPheDuyetCap1')) {
                    window.location.href = 'ctsv-pending-approval.html';
                } else if (vaiTros.includes('CanBoPheDuyetCap2')) {
                    window.location.href = 'bgh-pending-approval.html';
                } else if (vaiTros.includes('Admin')) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'home-user.html';
                }
            }, 1500);
            
        } else {
            // Login failed
            showAlert('error', data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('error', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
        // Remove loading state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
});

// Load saved email if "Remember Me" was checked
window.addEventListener('DOMContentLoaded', function() {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('savedEmail');
    
    if (rememberMe === 'true' && savedEmail) {
        document.getElementById('email').value = savedEmail;
        document.getElementById('remember').checked = true;
    }
    
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
        // Redirect to dashboard if already logged in
        window.location.href = '../index.html';
    }
});

// Handle Enter key press
document.getElementById('email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});

// Clear error on input
document.getElementById('email').addEventListener('input', hideAlerts);
document.getElementById('password').addEventListener('input', hideAlerts);

// Forgot Password (Placeholder)
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showAlert('error', 'Vui lòng liên hệ Phòng Đào tạo để được hỗ trợ khôi phục mật khẩu');
    });
}
