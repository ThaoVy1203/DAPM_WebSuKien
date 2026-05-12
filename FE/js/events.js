// Toggle password visibility
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

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    // Apply filter button
    const applyFilterBtn = document.querySelector('.btn-apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            console.log('Applying filters...');
            // Add filter logic here
        });
    }

    // Status buttons
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            statusButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Event registration buttons
    const registerButtons = document.querySelectorAll('.btn-primary:not(.disabled)');
    registerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to event detail page
            window.location.href = 'event-detail.html';
        });
    });

    // Event card click - redirect to detail page
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't redirect if clicking on buttons
            if (!e.target.closest('button')) {
                window.location.href = 'event-detail.html';
            }
        });
        
        // Add cursor pointer style
        card.style.cursor = 'pointer';
    });

    // Notify buttons for full events
    const notifyButtons = document.querySelectorAll('.btn-notify');
    notifyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const eventCard = this.closest('.event-card');
            const eventTitle = eventCard.querySelector('h3').textContent;
            alert(`Bạn sẽ nhận được thông báo khi sự kiện "${eventTitle}" có chỗ trống.`);
            this.innerHTML = '<i class="fas fa-check"></i> Đã đăng ký nhận thông báo';
            this.style.backgroundColor = 'var(--success-color)';
            this.style.borderColor = 'var(--success-color)';
            this.style.color = 'var(--white)';
            this.disabled = true;
        });
    });

    // Pagination
    const pageButtons = document.querySelectorAll('.page-btn:not(.active)');
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.querySelector('i')) {
                document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
});
