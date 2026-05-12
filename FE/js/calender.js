// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Calendar navigation
    const calendarNavBtns = document.querySelectorAll('.btn-nav');
    calendarNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Calendar navigation clicked');
            // Add calendar navigation logic here
        });
    });
    
    // Calendar date selection
    const calendarDates = document.querySelectorAll('.calendar-date:not(.inactive)');
    calendarDates.forEach(date => {
        date.addEventListener('click', function() {
            // Remove active class from all dates
            calendarDates.forEach(d => d.classList.remove('active'));
            // Add active class to clicked date
            this.classList.add('active');
            console.log('Selected date:', this.textContent);
        });
    });
    
    // View event buttons
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const eventItem = this.closest('.event-item');
            const eventTitle = eventItem.querySelector('h4').textContent;
            console.log('Viewing event:', eventTitle);
            // Redirect to event detail page
            window.location.href = 'event-detail.html';
        });
    });
    
    // Help button
    const helpBtn = document.querySelector('.btn-help');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            alert('Chức năng gửi yêu cầu hỗ trợ đang được phát triển.');
        });
    }
    
    // Download report button
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            alert('Đang tải báo cáo hoạt động của bạn...');
            // Add download logic here
        });
    }
    
    // Notification interactions
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Notification clicked');
            // Mark as read or show detail
        });
    });
    
    // View all notifications
    const viewAllLink = document.querySelector('.view-all-link');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('View all notifications');
            // Navigate to notifications page
        });
    }
    
    // Animate progress bar on load
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const targetWidth = progressFill.style.width;
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.width = targetWidth;
        }, 300);
    }
});
