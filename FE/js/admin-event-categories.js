const API_URL = "https://localhost:7160/api/DanhMucSuKien";

let categories = [];
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
        categories = await response.json();

        renderCategoryCards(categories);
        renderCategories(categories);
        updateStats(categories);

    } catch (error) {
        console.error("Lỗi load danh mục:", error);
        showError('Không tải được danh mục. Vui lòng kiểm tra Backend đã chạy chưa.');
    }
}

// ======================
// RENDER
// ======================
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
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-icon" style="background: ${gradients[index % gradients.length]};">
                <i class="fas ${icons[index % icons.length]}"></i>
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
                <button class="btn-action edit" onclick="editCategory(${category.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteCategory(${category.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCategories(categories) {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;

    const icons = ['fa-chalkboard-teacher', 'fa-hands-helping', 'fa-music', 'fa-laptop-code', 'fa-flag'];
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];

    tableBody.innerHTML = "";

    categories.forEach((category, index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="category-icon-small" style="background: ${gradients[index % gradients.length]};">
                            <i class="fas ${icons[index % icons.length]}"></i>
                        </div>
                        <strong>${category.tenDanhMuc || ""}</strong>
                    </div>
                </td>
                <td>${category.moTa || ""}</td>
                <td>${category.soSuKien || 0}</td>
                <td><span class="status-badge ${category.trangThai ? 'active' : 'inactive'}">
                    ${category.trangThai ? "Hoạt động" : "Tạm khóa"}
                </span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="editCategory(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function updateStats(categories) {
    const totalElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalElement) totalElement.textContent = categories.length;

    const activeElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (activeElement) activeElement.textContent = categories.filter(c => c.trangThai).length;

    const totalEvents = categories.reduce((sum, c) => sum + (c.soSuKien || 0), 0);
    const eventsElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (eventsElement) eventsElement.textContent = totalEvents;

    const mostPopular = categories.reduce((max, c) =>
        (c.soSuKien || 0) > (max.soSuKien || 0) ? c : max, categories[0] || {});
    const popularElement = document.querySelector('.stat-card:nth-child(4) .stat-number');
    if (popularElement && mostPopular.tenDanhMuc) popularElement.textContent = mostPopular.tenDanhMuc;
}

// ======================
// MODAL
// ======================
function openAddCategoryModal() {
    editingId = null;

    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');

    if (modalTitle) modalTitle.textContent = 'Thêm danh mục mới';
    if (form) form.reset();
    if (modal) modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'none';
    editingId = null;
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
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        alert("Xóa thành công");
        loadCategories();

    } catch (error) {
        console.error(error);
        alert("Xóa thất bại. Có thể danh mục đang được sử dụng.");
    }
}

// ======================
// SAVE
// ======================
async function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        tenDanhMuc: document.getElementById('categoryName').value.trim(),
        moTa: document.getElementById('categoryDescription').value.trim(),
        trangThai: document.getElementById('categoryStatus')?.value === "true"
    };

    if (!data.tenDanhMuc) {
        alert('Vui lòng nhập tên danh mục');
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }

        if (editingId) {
            await fetch(`${API_URL}/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            alert('Cập nhật danh mục thành công!');
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            alert('Thêm danh mục mới thành công!');
        }

        closeCategoryModal();
        loadCategories();

    } catch (error) {
        console.error(error);
        alert('Không thể lưu danh mục. Vui lòng thử lại.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        }
    }
}

// ======================
// SEARCH
// ======================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.admin-table tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
}

// ======================
// SHOW ERROR
// ======================
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

// ======================
// CLOSE EVENTS
// ======================
window.addEventListener('click', function (event) {
    const modal = document.getElementById('categoryModal');
    if (event.target === modal) closeCategoryModal();
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCategoryModal();
});

// Make functions global for onclick handlers
window.openAddCategoryModal = openAddCategoryModal;
window.editCategory = editCategory;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;