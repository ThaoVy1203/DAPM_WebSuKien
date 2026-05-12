// Admin Locations JavaScript

// Filter functionality
function applyFilters() {
    const capacityFilter = document.getElementById('capacityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    console.log('Applying filters:', { capacityFilter, statusFilter });
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
});

// Export locations
function exportLocations() {
    console.log('Exporting locations...');
    alert('Đang xuất danh sách địa điểm...');
    // TODO: Implement export functionality
}

// Open add location modal
function openAddLocationModal() {
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('locationForm');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = 'Thêm địa điểm mới';
        form.reset();
        modal.style.display = 'flex';
    }
}

// Close location modal
function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// View location
function viewLocation(id) {
    console.log('Viewing location:', id);
    // TODO: Open detail modal or navigate to detail page
    alert('Xem chi tiết địa điểm #' + id);
}

// Edit location
function editLocation(id) {
    console.log('Editing location:', id);
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal && modalTitle) {
        modalTitle.textContent = 'Chỉnh sửa địa điểm';
        modal.style.display = 'flex';
        // TODO: Load location data and populate form
    }
}

// Delete location
function deleteLocation(id) {
    console.log('Deleting location:', id);
    if (confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) {
        // TODO: Implement API call to delete location
        alert('Đã xóa địa điểm!');
        location.reload();
    }
}

// Save location
function saveLocation() {
    const form = document.getElementById('locationForm');
    if (form && form.checkValidity()) {
        const locationName = document.getElementById('locationName').value;
        const locationType = document.getElementById('locationType').value;
        const locationCapacity = document.getElementById('locationCapacity').value;
        const locationPosition = document.getElementById('locationPosition').value;
        const locationDescription = document.getElementById('locationDescription').value;
        const locationStatus = document.getElementById('locationStatus').value;
        
        // Get selected facilities
        const facilityCheckboxes = document.querySelectorAll('.role-checkboxes input[type="checkbox"]:checked');
        const facilities = Array.from(facilityCheckboxes).map(cb => cb.value);
        
        console.log('Saving location:', {
            locationName,
            locationType,
            locationCapacity,
            locationPosition,
            locationDescription,
            locationStatus,
            facilities
        });
        
        // TODO: Implement API call to save location
        alert('Đã lưu địa điểm thành công!');
        closeLocationModal();
        location.reload();
    } else {
        form.reportValidity();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('locationModal');
    if (event.target === modal) {
        closeLocationModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeLocationModal();
    }
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.location-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
