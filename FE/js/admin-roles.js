// Admin Roles Page

let allRoleUsers = [];   // toàn bộ users từ API
let allVaiTros   = [];   // danh sách vai trò từ API

// ── Khởi tạo ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    await Promise.all([loadVaiTros(), loadRoleUsers()]);
    initRoleFilter();
    initSearch();
    initModalClose();
});

// ── Load vai trò từ API ─────────────────────────────────────────────────────
async function loadVaiTros() {
    try {
        // Dùng endpoint NguoiDung để lấy danh sách, rồi extract vai trò
        // Hoặc gọi trực tiếp nếu có endpoint riêng
        const res = await fetch(`${API_CONFIG.BASE_URL}/NguoiDung`);
        const users = await res.json();
        // Extract tất cả vai trò duy nhất
        const roleSet = new Set(users.flatMap(u => u.vaiTros || []));
        allVaiTros = [...roleSet].sort();
        populateRoleFilter(allVaiTros);
        populateModalRoles(allVaiTros);
    } catch (e) {
        console.warn('Không tải được vai trò:', e);
    }
}

// ── Load users từ API ───────────────────────────────────────────────────────
async function loadRoleUsers() {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/NguoiDung`);
        allRoleUsers = await res.json() || [];
        renderRoleTable(allRoleUsers);
        updateRoleCards(allRoleUsers);
        populateUserSelect(allRoleUsers);
    } catch (e) {
        console.error('Lỗi tải users:', e);
        showFallbackTable();
    }
}

// ── Render bảng phân quyền ──────────────────────────────────────────────────
function renderRoleTable(users) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-user-slash" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                Không tìm thấy người dùng nào
            </td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const bgColor = stringToColor(user.idNguoiDung || '');
        const avatarSrc = user.anhDaiDien ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen||'U')}&background=${bgColor}&color=fff`;
        const badges = (user.vaiTros || []).length > 0
            ? user.vaiTros.map(v => `<span class="badge ${getRoleBadgeClass(v)}">${v}</span>`).join(' ')
            : '<span class="badge badge-info">NguoiThamGia</span>';

        return `
        <tr data-roles="${(user.vaiTros||[]).join(',').toLowerCase()}">
            <td>
                <div class="user-cell">
                    <img src="${avatarSrc}" alt="User" class="user-avatar-small">
                    <div>
                        <div class="user-name-cell">${user.hoTen || '—'}</div>
                        <div class="user-id-cell">${user.idNguoiDung || ''}</div>
                    </div>
                </div>
            </td>
            <td>${user.email || '—'}</td>
            <td>${badges}</td>
            <td>—</td>
            <td>Admin</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="editUserRole('${user.idNguoiDung}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="removeRole('${user.idNguoiDung}')" title="Xóa vai trò">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ── Cập nhật role cards ─────────────────────────────────────────────────────
function updateRoleCards(users) {
    const roleCounts = {};
    users.forEach(u => {
        (u.vaiTros || ['NguoiThamGia']).forEach(v => {
            roleCounts[v] = (roleCounts[v] || 0) + 1;
        });
    });

    document.querySelectorAll('.role-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent?.trim();
        const countEl = card.querySelector('.role-count');
        if (!countEl) return;
        const roleMap = {
            'Admin': 'Admin', 'BGH': 'CanBoPheDuyetCap2',
            'CTSV': 'CanBoPheDuyetCap1', 'BTC': 'TruongBanToChuc',
            'Giảng viên': 'GiangVien', 'Sinh viên': 'NguoiThamGia',
        };
        const key = roleMap[title];
        if (key) countEl.textContent = `${roleCounts[key] || 0} người dùng`;
    });
}

// ── Điền dropdown filter ────────────────────────────────────────────────────
function populateRoleFilter(roles) {
    const sel = document.getElementById('roleFilterTable');
    if (!sel) return;
    // Giữ option "Tất cả"
    const current = sel.innerHTML.split('\n')[0];
    sel.innerHTML = `<option value="all">Tất cả vai trò</option>`;
    const displayMap = {
        Admin:'Admin', CanBoPheDuyetCap2:'BGH', CanBoPheDuyetCap1:'CTSV',
        TruongBanToChuc:'Trưởng BTC', ThanhVienBanToChuc:'Thành viên BTC',
        GiangVien:'Giảng viên', NguoiThamGia:'Sinh viên / Người tham gia',
    };
    roles.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.toLowerCase();
        opt.textContent = displayMap[r] || r;
        sel.appendChild(opt);
    });
}

// ── Điền checkbox vai trò trong modal ──────────────────────────────────────
function populateModalRoles(roles) {
    const container = document.querySelector('.role-checkboxes');
    if (!container || roles.length === 0) return;
    const displayMap = {
        Admin:'Admin', CanBoPheDuyetCap2:'BGH (Duyệt cấp 2)',
        CanBoPheDuyetCap1:'CTSV (Duyệt cấp 1)', TruongBanToChuc:'Trưởng BTC',
        ThanhVienBanToChuc:'Thành viên BTC', GiangVien:'Giảng viên',
        NguoiThamGia:'Sinh viên / Người tham gia',
    };
    container.innerHTML = roles.map(r => `
        <label class="checkbox-label">
            <input type="checkbox" value="${r}">
            <span>${displayMap[r] || r}</span>
        </label>`).join('');
}

// ── Điền select người dùng trong modal ─────────────────────────────────────
function populateUserSelect(users) {
    const sel = document.getElementById('selectUser');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn người dùng --</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.idNguoiDung;
        opt.textContent = `${u.hoTen} (${u.email})`;
        sel.appendChild(opt);
    });
}

// ── Filter theo vai trò ─────────────────────────────────────────────────────
function initRoleFilter() {
    const sel = document.getElementById('roleFilterTable');
    if (!sel) return;
    sel.addEventListener('change', function () {
        const val = this.value.toLowerCase();
        const rows = document.querySelectorAll('.admin-table tbody tr');
        rows.forEach(row => {
            if (val === 'all') {
                row.style.display = '';
            } else {
                const roles = (row.dataset.roles || '').toLowerCase();
                row.style.display = roles.includes(val) ? '' : 'none';
            }
        });
        updateVisibleCount();
    });
}

function updateVisibleCount() {
    const visible = [...document.querySelectorAll('.admin-table tbody tr')]
        .filter(r => r.style.display !== 'none').length;
    let el = document.getElementById('roleResultCount');
    if (!el) {
        el = document.createElement('p');
        el.id = 'roleResultCount';
        el.style.cssText = 'font-size:13px;color:#6B7280;margin:8px 0 4px;';
        document.querySelector('.table-responsive')?.before(el);
    }
    el.textContent = `Hiển thị ${visible} / ${allRoleUsers.length} người dùng`;
}

// ── Tìm kiếm header ─────────────────────────────────────────────────────────
function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const kw = input.value.trim().toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                row.style.display = !kw || row.textContent.toLowerCase().includes(kw) ? '' : 'none';
            });
            updateVisibleCount();
        }, 300);
    });
}

// ── Modal ───────────────────────────────────────────────────────────────────
function openAssignRoleModal() {
    document.getElementById('roleForm')?.reset();
    document.getElementById('roleModal').style.display = 'flex';
}
window.openAssignRoleModal = openAssignRoleModal;

function closeRoleModal() {
    document.getElementById('roleModal').style.display = 'none';
}
window.closeRoleModal = closeRoleModal;

async function editUserRole(userId) {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/NguoiDung/${userId}`);
        const user = await res.json();
        document.getElementById('roleModal').style.display = 'flex';
        // Chọn đúng user trong select
        const sel = document.getElementById('selectUser');
        if (sel) sel.value = userId;
        // Tick đúng vai trò hiện tại
        document.querySelectorAll('.role-checkboxes input[type="checkbox"]').forEach(cb => {
            cb.checked = (user.vaiTros || []).includes(cb.value);
        });
    } catch {
        alert('Không thể tải thông tin người dùng');
    }
}
window.editUserRole = editUserRole;

async function removeRole(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return;
    alert('Tính năng xóa vai trò đang được phát triển.');
}
window.removeRole = removeRole;

async function saveRole() {
    const userId = document.getElementById('selectUser')?.value;
    if (!userId) { alert('Vui lòng chọn người dùng'); return; }

    const checked = [...document.querySelectorAll('.role-checkboxes input:checked')];
    if (checked.length === 0) { alert('Vui lòng chọn ít nhất một vai trò'); return; }

    // Map tên vai trò → idVaiTro
    const roleIdMap = {
        Admin:1, NguoiThamGia:2, TruongBanToChuc:3,
        ThanhVienBanToChuc:4, CanBoPheDuyetCap1:5, CanBoPheDuyetCap2:6, GiangVien:7,
    };

    let success = 0;
    for (const cb of checked) {
        const idVaiTro = roleIdMap[cb.value];
        if (!idVaiTro) continue;
        try {
            await fetch(`${API_CONFIG.BASE_URL}/NguoiDung/${userId}/vai-tro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idVaiTro }),
            });
            success++;
        } catch (e) {
            console.warn(`Gán vai trò ${cb.value} thất bại:`, e);
        }
    }

    alert(success > 0 ? 'Gán vai trò thành công!' : 'Không thể gán vai trò. Vui lòng thử lại.');
    closeRoleModal();
    await loadRoleUsers();
}
window.saveRole = saveRole;

// ── Helpers ─────────────────────────────────────────────────────────────────
function getRoleBadgeClass(role) {
    return {
        Admin:'badge-purple', TruongBanToChuc:'badge-warning',
        ThanhVienBanToChuc:'badge-warning', CanBoPheDuyetCap1:'badge-success',
        CanBoPheDuyetCap2:'badge-danger', NguoiThamGia:'badge-info',
        GiangVien:'badge-purple',
    }[role] || 'badge-info';
}

function stringToColor(str) {
    const p = ['3b82f6','8b5cf6','f59e0b','ec4899','10b981','ef4444','6366f1','14b8a6'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return p[Math.abs(h) % p.length];
}

function showFallbackTable() {
    const tbody = document.querySelector('.admin-table tbody');
    if (tbody) tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:32px;color:#EF4444;">
            <i class="fas fa-exclamation-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            Không thể tải dữ liệu. Vui lòng kiểm tra backend.
        </td></tr>`;
}

function initModalClose() {
    document.getElementById('roleModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('roleModal')) closeRoleModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRoleModal(); });
}
