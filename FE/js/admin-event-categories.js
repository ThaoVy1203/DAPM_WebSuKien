<<<<<<< HEAD
// Admin Event Categories Page - API Integration
let categories = [];
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin event categories page loaded');
    
    // Load categories from API
    await loadCategories();
    
    // Initialize event handlers
    initializeEventHandlers();
});

// Load all categories from API
async function loadCategories() {
    try {
        console.log('Loading categories from API...');
        
        categories = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        console.log('Categories loaded:', categories);
        
        // Render categories
        renderCategoryCards(categories);
        renderCategoryTable(categories);
        updateStats(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Không thể tải danh sách danh mục. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// Render category cards
function renderCategoryCards(categories) {
    const container = document.querySelector('.categories-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const icons = ['fa-chalkboard-teacher', 'fa-hands-helping', 'fa-music', 'fa-laptop-code', 'fa-flag'];
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    categories.forEach((category, index) => {
        const card = createCategoryCard(category, icons[index % icons.length], gradients[index % gradients.length]);
        container.appendChild(card);
    });
}

// Create category card
function createCategoryCard(category, icon, gradient) {
    const card = document.createElement('div');
    card.className = 'category-card';
    
    card.innerHTML = `
        <div class="category-icon" style="background: ${gradient};">
            <i class="fas ${icon}"></i>
        </div>
        <div class="category-info">
            <h3>${category.tenDanhMuc}</h3>
            <p>${category.moTa || 'Không có mô tả'}</p>
            <div class="category-stats">
                <span><i class="fas fa-calendar"></i> ${category.soSuKien || 0} sự kiện</span>
                <span><i class="fas fa-users"></i> 0 người tham gia</span>
            </div>
        </div>
        <div class="category-actions">
            <button class="btn-action edit" onclick="editCategory(${category.idDanhMuc})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete" onclick="deleteCategory(${category.idDanhMuc})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Render category table
function renderCategoryTable(categories) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const icons = ['fa-chalkboard-teacher', 'fa-hands-helping', 'fa-music', 'fa-laptop-code', 'fa-flag'];
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    categories.forEach((category, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="category-icon-small" style="background: ${gradients[index % gradients.length]};">
                        <i class="fas ${icons[index % icons.length]}"></i>
                    </div>
                    <strong>${category.tenDanhMuc}</strong>
                </div>
            </td>
            <td>${category.moTa || 'Không có mô tả'}</td>
            <td>${category.soSuKien || 0}</td>
            <td><span class="status-badge active">Đang sử dụng</span></td>
            <td>01/01/2024</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="editCategory(${category.idDanhMuc})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteCategory(${category.idDanhMuc})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats(categories) {
    // Total categories
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) {
        totalElement.textContent = categories.length;
    }
    
    // Active categories
    const activeElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (activeElement) {
        activeElement.textContent = categories.length;
    }
    
    // Total events
    const totalEvents = categories.reduce((sum, c) => sum + (c.soSuKien || 0), 0);
    const eventsElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (eventsElement) {
        eventsElement.textContent = totalEvents;
    }
    
    // Most popular
    const mostPopular = categories.reduce((max, c) => 
        (c.soSuKien || 0) > (max.soSuKien || 0) ? c : max, categories[0] || {});
    const popularElement = document.querySelector('.stat-card:nth-child(4) .stat-number');
    if (popularElement && mostPopular.tenDanhMuc) {
        popularElement.textContent = mostPopular.tenDanhMuc;
    }
}
=======
const API_URL = "https://localhost:7160/api/DanhMucSuKien";
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241

let editingId = null;

// ======================
// LOAD DATA
// ======================
document.addEventListener("DOMContentLoaded", async function () {
    await loadCategories();

    const searchInput = document.querySelector('.search-bar input');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

async function loadCategories() {
    try {
        const response = await fetch(API_URL);
        const categories = await response.json();

        renderCategories(categories);

    } catch (error) {
        console.error("Lỗi load danh mục:", error);
        alert("Không tải được danh mục");
    }
}

// ======================
// RENDER
// ======================
function renderCategories(categories) {
    const tableBody = document.querySelector('.admin-table tbody');

    if (!tableBody) return;

    tableBody.innerHTML = "";

    categories.forEach(category => {
        tableBody.innerHTML += `
            <tr>
                <td>${category.id}</td>
                <td>${category.tenDanhMuc || ""}</td>
                <td>${category.moTa || ""}</td>
                <td>${category.trangThai ? "Hoạt động" : "Tạm khóa"}</td>
                <td>
                    <button onclick="editCategory(${category.id})">Sửa</button>
                    <button onclick="deleteCategory(${category.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
}

// ======================
// MODAL
// ======================
function openAddCategoryModal() {
<<<<<<< HEAD
    editingCategoryId = null;
    
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    
    if (modalTitle) modalTitle.textContent = 'Thêm danh mục mới';
    if (form) form.reset();
    if (modal) modal.style.display = 'flex';
}

// Edit category
async function editCategory(categoryId) {
    editingCategoryId = categoryId;
    
    try {
        const category = await API.get(API_CONFIG.ENDPOINTS.DANHMUC_BY_ID(categoryId));
        
        const modal = document.getElementById('categoryModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalTitle) modalTitle.textContent = 'Chỉnh sửa danh mục';
        
        // Fill form with category data
        document.getElementById('categoryName').value = category.tenDanhMuc;
        document.getElementById('categoryDescription').value = category.moTa || '';
        
        if (modal) modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading category:', error);
        alert('Không thể tải thông tin danh mục');
    }
}

// Close modal
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'none';
    editingCategoryId = null;
}

// Save category (create or update)
async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    
    if (!name) {
        alert('Vui lòng nhập tên danh mục');
        return;
    }
    
    const categoryData = {
        tenDanhMuc: name,
        moTa: description
    };
    
    try {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }
        
        if (editingCategoryId) {
            // Update existing category
            await API.put(API_CONFIG.ENDPOINTS.DANHMUC_BY_ID(editingCategoryId), categoryData);
            alert('Cập nhật danh mục thành công!');
        } else {
            // Create new category
            await API.post(API_CONFIG.ENDPOINTS.DANHMUC, categoryData);
            alert('Thêm danh mục mới thành công!');
        }
        
        // Reload categories
        await loadCategories();
        
        // Close modal
        closeCategoryModal();
        
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Không thể lưu danh mục. Vui lòng thử lại.');
    } finally {
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        }
    }
}

// Delete category
async function deleteCategory(categoryId) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa danh mục này?');
    if (!confirmed) return;
    
    try {
        await API.delete(API_CONFIG.ENDPOINTS.DANHMUC_BY_ID(categoryId));
        alert('Xóa danh mục thành công!');
        
        // Reload categories
        await loadCategories();
        
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Không thể xóa danh mục. Có thể danh mục đang được sử dụng.');
    }
}

// Initialize event handlers
function initializeEventHandlers() {
    // Add category button
    const addBtn = document.querySelector('.btn-primary');
    if (addBtn) {
        addBtn.addEventListener('click', openAddCategoryModal);
    }
    
    // Close modal button
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCategoryModal);
    }
    
    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel-modal');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCategoryModal);
    }
    
    // Save button
    const saveBtn = document.querySelector('.btn-submit');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCategory);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCategoryModal();
            }
        });
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.main-content');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'text-align: center; padding: 40px; color: #dc2626; background: #fee2e2; border-radius: 8px; margin: 20px 0;';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3>Có lỗi xảy ra</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="location.reload()" style="margin-top: 16px;">Thử lại</button>
        `;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// Make functions global for onclick handlers
window.openAddCategoryModal = openAddCategoryModal;
window.editCategory = editCategory;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
=======
    editingId = null;

    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');

    modalTitle.textContent = 'Thêm danh mục mới';
    form.reset();
    modal.style.display = 'flex';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// ======================
// EDIT
// ======================
async function editCategory(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const category = await response.json();

        editingId = id;

        document.getElementById('modalTitle').textContent = 'Chỉnh sửa danh mục';
        document.getElementById('categoryName').value = category.tenDanhMuc || '';
        document.getElementById('categoryDescription').value = category.moTa || '';
        document.getElementById('categoryStatus').value = category.trangThai;

        document.getElementById('categoryModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu");
    }
}

// ======================
// DELETE
// ======================
async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        alert("Xóa thành công");
        loadCategories();

    } catch (error) {
        console.error(error);
        alert("Xóa thất bại");
    }
}

// ======================
// SAVE
// ======================
async function saveCategory() {
    const form = document.getElementById('categoryForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        tenDanhMuc: document.getElementById('categoryName').value,
        moTa: document.getElementById('categoryDescription').value,
        trangThai: document.getElementById('categoryStatus').value === "true"
    };

    try {
        if (editingId) {
            await fetch(`${API_URL}/${editingId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        }

        alert("Lưu thành công");
        closeCategoryModal();
        loadCategories();

    } catch (error) {
        console.error(error);
        alert("Lưu thất bại");
    }
}

// ======================
// SEARCH
// ======================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.admin-table tbody tr');

    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(searchTerm)
            ? ''
            : 'none';
    });
}

// ======================
// CLOSE EVENTS
// ======================
window.addEventListener('click', function (event) {
    const modal = document.getElementById('categoryModal');
    if (event.target === modal) {
        closeCategoryModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeCategoryModal();
    }
});
>>>>>>> 3675e6bf9c1604e0af65330f5fd5998454919241
