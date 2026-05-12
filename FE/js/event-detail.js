// Event Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Registration form submission
    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const name = document.querySelector('input[placeholder="Nguyễn Văn Nam"]').value;
            const mssv = document.querySelector('input[placeholder="21115045"]').value;
            const className = document.querySelector('input[placeholder="21TPMSE1"]').value;
            const email = document.querySelector('input[placeholder="nam.nv.21it@ute.udn.vn"]').value;
            
            if (!name || !mssv || !className || !email) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Email không hợp lệ!');
                return;
            }
            
            alert(`Đăng ký thành công!\n\nThông tin:\nHọ tên: ${name}\nMSSV: ${mssv}\nLớp: ${className}\nEmail: ${email}\n\nĐang chuyển đến trang vé của bạn...`);
            
            // Redirect to my-tickets page after successful registration
            setTimeout(() => {
                window.location.href = 'my-tickets.html';
            }, 1500);
        });
    }
    
    // Submit question
    const submitQuestionBtn = document.querySelector('.btn-submit-question');
    if (submitQuestionBtn) {
        submitQuestionBtn.addEventListener('click', function() {
            const textarea = document.querySelector('.qa-content textarea');
            const question = textarea.value.trim();
            
            if (!question) {
                alert('Vui lòng nhập câu hỏi của bạn!');
                return;
            }
            
            alert('Câu hỏi của bạn đã được gửi thành công!');
            textarea.value = '';
        });
    }
    
    // Q&A actions
    const qaButtons = document.querySelectorAll('.qa-btn');
    qaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log(`Action: ${action}`);
        });
    });
    
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
