<<<<<<< HEAD
// API Configuration
const API_BASE_URL = 'https://localhost:7160/api';
=======
// pages/js/login.js
const API_BASE = "https://localhost:7160/api";
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241

document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra nếu đã có token hợp lệ thì chuyển thẳng
    checkAndRedirectIfLoggedIn();
    
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    
    const togglePasswordBtn = document.querySelector(".toggle-password");
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", togglePassword);
    }
});

async function checkAndRedirectIfLoggedIn() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE}/Auth/verify`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = localStorage.getItem("userData");
            if (userData) {
                const user = JSON.parse(userData);
                const vaiTros = user.vaiTros || [];
                redirectBasedOnRole(vaiTros);
            }
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
        }
    } catch (error) {
        console.log("Lỗi kiểm tra đăng nhập:", error);
    }
}

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.getElementById("toggleIcon");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

// ======================
// HÀM CHUYỂN HƯỚNG THEO VAI TRÒ
// ======================
function redirectBasedOnRole(vaiTros) {
    console.log("Chuyển hướng theo role:", vaiTros);

    // 1. ADMIN - vào admin-dashboard.html
    if (vaiTros.includes("Admin")) {
        window.location.href = "admin-dashboard.html";
    }
    // 2. CÁN BỘ PHÊ DUYỆT CẤP 2 (BGH/P.CTSV) - vào bgh-approval.html
    else if (vaiTros.includes("CanBoPheDuyetCap2")) {
        window.location.href = "bgh-approval.html";
    }
    // 3. CÁN BỘ PHÊ DUYỆT CẤP 1 (CTSV/Khoa/Đoàn) - vào ctsv-pending-approval.html
    else if (vaiTros.includes("CanBoPheDuyetCap1")) {
        window.location.href = "ctsv-pending-approval.html";
    }
    // 4. TRƯỞNG BAN TỔ CHỨC hoặc THÀNH VIÊN BTC
    // → vào btc-dashboard nhưng vẫn có thể truy cập các trang người dùng qua navbar
    else if (vaiTros.includes("TruongBanToChuc") || vaiTros.includes("ThanhVienBanToChuc")) {
        window.location.href = "btc-dashboard.html";
    }
    // 5. SINH VIÊN (NguoiThamGia) - vào trang chủ sinh viên
    else {
        window.location.href = "home-user.html";
    }
}

// ======================
// XỬ LÝ ĐĂNG NHẬP
// ======================
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    const errorAlert = document.getElementById("errorAlert");
    const errorMessage = document.getElementById("errorMessage");
    const submitBtn = document.querySelector(".btn-login");
    
    if (errorAlert) errorAlert.style.display = "none";
    
    if (!username || !password) {
        if (errorMessage) errorMessage.textContent = "Vui lòng nhập đầy đủ tài khoản và mật khẩu";
        if (errorAlert) errorAlert.style.display = "flex";
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Đang xử lý...</span><i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        console.log("Đang gọi API login với username:", username);
        
        const response = await fetch(`${API_BASE}/NguoiDung/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                maSoSSO: username,
                matKhau: password
            })
        });
        
        const data = await response.json();
        console.log("Login response:", data);
        
        if (data.success && data.token) {
            // Lưu token và user data
            localStorage.setItem("token", data.token);
            localStorage.setItem("userData", JSON.stringify(data.nguoiDung));
            
            const vaiTros = data.nguoiDung?.vaiTros || [];
            console.log("Vai trò người dùng:", vaiTros);
            
            // Thông báo thành công
            alert("Đăng nhập thành công!");
            
<<<<<<< HEAD
            // Redirect to home-user page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'home-user.html';
            }, 1500);
=======
            // Chuyển hướng theo vai trò
            redirectBasedOnRole(vaiTros);
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
            
        } else {
            if (errorMessage) errorMessage.textContent = data.message || "Sai tài khoản hoặc mật khẩu";
            if (errorAlert) errorAlert.style.display = "flex";
        }
        
    } catch (error) {
        console.error("Login error:", error);
        if (errorMessage) errorMessage.textContent = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend đã chạy chưa!";
        if (errorAlert) errorAlert.style.display = "flex";
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Đăng nhập</span><i class="fas fa-arrow-right"></i>';
        }
    }
<<<<<<< HEAD
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
=======
}
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
