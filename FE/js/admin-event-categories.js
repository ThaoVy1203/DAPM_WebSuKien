// Admin Event Categories JavaScript

// Open add category modal
function openAddCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = 'Thêm danh mục mới';
        form.reset();
        modal.style.display = 'flex';
    }
}

// Close category modal
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit category
function editCategory(id) {
    console.log('Editing category:', id);
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal && modalTitle) {
        modalTitle.textContent = 'Chỉnh sửa danh mục';
        modal.style.display = 'flex';
        // TODO: Load category data and populate form
    }
}

// Delete category
function deleteCategory(id) {
    console.log('Deleting category:', id);
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này? Các sự kiện thuộc danh mục này sẽ không bị xóa.')) {
        // TODO: Implement API call to delete category
        alert('Đã xóa danh mục!');
        location.reload();
    }
}

// Save category
function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (form && form.checkValidity()) {
        const categoryName = document.getElementById('categoryName').value;
        const categoryDescription = document.getElementById('categoryDescription').value;
        const categoryIcon = document.getElementById('categoryIcon').value;
        const categoryStatus = document.getElementById('categoryStatus').value;
        
        console.log('Saving category:', {
            categoryName,
            categoryDescription,
            categoryIcon,
            categoryStatus
        });
        
        // TODO: Implement API call to save category
        alert('Đã lưu danh mục thành công!');
        closeCategoryModal();
        location.reload();
    } else {
        form.reportValidity();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('categoryModal');
    if (event.target === modal) {
        closeCategoryModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCategoryModal();
    }
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.category-card');
            const rows = document.querySelectorAll('.admin-table tbody tr');
            
            // Filter cards
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Filter table rows
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
