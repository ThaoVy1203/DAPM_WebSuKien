const API_URL = "https://localhost:7160/api/DanhMucSuKien";

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