// My Tickets Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // QR Code auto-refresh timer
    let countdown = 45;
    const ticketCodeElement = document.querySelector('.ticket-code strong');
    
    function updateCountdown() {
        if (ticketCodeElement) {
            ticketCodeElement.textContent = `${countdown}s`;
            countdown--;
            
            if (countdown < 0) {
                countdown = 45;
                // Refresh QR code here
                console.log('QR Code refreshed');
            }
        }
    }
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
    
    // Add to Apple Wallet
    const appleWalletBtn = document.querySelector('.btn-wallet.apple');
    if (appleWalletBtn) {
        appleWalletBtn.addEventListener('click', function() {
            alert('Đang thêm vé vào Apple Wallet...');
            // Add Apple Wallet integration here
        });
    }
    
    // Add to Google Pay
    const googlePayBtn = document.querySelector('.btn-wallet.google');
    if (googlePayBtn) {
        googlePayBtn.addEventListener('click', function() {
            alert('Đang thêm vé vào Google Pay...');
            // Add Google Pay integration here
        });
    }
    
    // Share button
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: 'Vé sự kiện UTE',
                    text: 'Hội thảo Công nghệ 4.0 & Tương lai Nghề nghiệp',
                    url: window.location.href
                }).then(() => {
                    console.log('Shared successfully');
                }).catch((error) => {
                    console.log('Error sharing:', error);
                });
            } else {
                alert('Chức năng chia sẻ không được hỗ trợ trên trình duyệt này.');
            }
        });
    }
    
    // Upcoming ticket items
    const upcomingTickets = document.querySelectorAll('.upcoming-ticket-item');
    upcomingTickets.forEach(ticket => {
        ticket.addEventListener('click', function() {
            console.log('Viewing ticket');
            // Navigate to ticket detail or reload with different ticket
        });
    });
    
    // Help button
    const helpBtn = document.querySelector('.btn-help');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            alert('Đang chuyển đến trung tâm hỗ trợ...');
            // Navigate to help center
        });
    }
    
    // View all history link
    const viewAllLink = document.querySelector('.view-all-link');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('View all history');
            // Navigate to full history page
        });
    }
    
    // Verified badge animation
    const verifiedBtn = document.querySelector('.btn-verified');
    if (verifiedBtn) {
        verifiedBtn.addEventListener('click', function() {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    }
});

// Cancel ticket function
function cancelTicket() {
    if (confirm('Bạn có chắc chắn muốn hủy đăng ký sự kiện này?\n\nLưu ý: Sau khi hủy, bạn có thể đăng ký lại nếu sự kiện vẫn còn chỗ.')) {
        alert('Đã hủy đăng ký thành công!\n\nBạn sẽ được chuyển về trang danh sách sự kiện.');
        
        // Redirect to events page after cancellation
        setTimeout(() => {
            window.location.href = 'events.html';
        }, 1500);
    }
}
