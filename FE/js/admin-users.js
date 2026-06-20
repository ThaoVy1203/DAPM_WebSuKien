// admin-users.js — Quản lý tài khoản người dùng
const API_BASE = "http://localhost:5103/api";

let allUsers = [];
let editingUserId = null;
let currentPage = 1;
const PAGE_SIZE = 15;
let currentFilter = 'all';
let searchTerm = '';

// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    await loadUsers();
    initTabs();
    initSearch();
    initFilters();
    loadUserInfo();
});

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('userData') || '{}');
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        if (nameEl && user.hoTen) nameEl.textContent = user.hoTen;
        if (roleEl) roleEl.textContent = 'Quản trị viên hệ thống';
    } catch(e) {}
}

// ==========================
// LOAD TỪ API
// ==========================
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/NguoiDung`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allUsers = Array.isArray(data) ? data : (data.Data || data.data || data.items || []);

        updateStats(allUsers);
        renderUsers();

    } catch (error) {
        console.error("Lỗi load users:", error);
        showTableError('Không tải được danh sách tài khoản. Vui lòng kiểm tra backend.');
    }
}

// ==========================
// RENDER BẢNG
// ==========================
function renderUsers() {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    let filtered = allUsers;
    if (currentFilter !== 'all') {
        filtered = filtered.filter(u => {
            const vaiTros = u.vaiTros || u.VaiTros || u.roles || [];
            const loai = getLoaiNguoiDung(vaiTros);
            return loai === currentFilter;
        });
    }
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(u =>
            (u.hoTen || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.idNguoiDung || u.maSoSSO || '').toLowerCase().includes(q)
        );
    }

    updateTabCounts(allUsers);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = filtered.slice(start, start + PAGE_SIZE);

    if (paged.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#9ca3af;">
            <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4;"></i>
            Không tìm thấy tài khoản nào
        </td></tr>`;
        updatePagination(total, filtered.length);
        return;
    }

    tbody.innerHTML = paged.map(user => {
        const id = user.idNguoiDung || user.maSoSSO || user.id || '';
        const hoTen = user.hoTen || user.ten || '—';
        const email = user.email || '—';
        const vaiTros = user.vaiTros || user.VaiTros || user.roles || [];
        const trangThai = user.trangThai || user.TrangThai || 'HoatDong';
        const isActive = trangThai === 'HoatDong' || trangThai === 'active' || trangThai === true;
        const ngayTao = (user.ngayTao || user.createdAt)
            ? new Date(user.ngayTao || user.createdAt).toLocaleDateString('vi-VN')
            : '—';
        const avatar = user.anhDaiDien
            ? user.anhDaiDien
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=6366f1&color=fff&size=36`;

        return `<tr>
            <td><input type="checkbox" class="row-check" value="${escHtml(id)}"></td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${avatar}" alt="${escHtml(hoTen)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=6366f1&color=fff&size=36'">
                    <div>
                        <div style="font-weight:600;color:#1a1a2e;">${escHtml(hoTen)}</div>
                        <div style="font-size:12px;color:#6b7280;">${escHtml(id)}</div>
                    </div>
                </div>
            </td>
            <td>${escHtml(email)}</td>
            <td>${renderRoleBadges(vaiTros)}</td>
            <td><span class="status-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Hoạt động' : 'Tạm khóa'}</span></td>
            <td>${ngayTao}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="openEditUserModal('${escHtml(id)}')" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" onclick="deleteUser('${escHtml(id)}')" title="Xóa"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    updatePagination(total, filtered.length);
}

function renderRoleBadges(vaiTros) {
    if (!vaiTros || !vaiTros.length) return '<span style="color:#9ca3af;font-size:12px;">Chưa có</span>';
    const colors = {
        Admin: '#6366f1', TruongBanToChuc: '#0D5A9C', ThanhVienBanToChuc: '#1976D2',
        CanBoCtSv: '#059669', BanGiamHieu: '#dc2626', NguoiDung: '#6b7280'
    };
    const labels = {
        Admin: 'Admin', TruongBanToChuc: 'Trưởng BTC', ThanhVienBanToChuc: 'TV BTC',
        CanBoCtSv: 'CTSV', BanGiamHieu: 'BGH', NguoiDung: 'Người dùng'
    };
    return vaiTros.slice(0, 2).map(r => {
        const color = colors[r] || '#6b7280';
        const label = labels[r] || r;
        return `<span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:${color}20;color:${color};margin-right:4px;">${label}</span>`;
    }).join('') + (vaiTros.length > 2 ? `<span style="font-size:11px;color:#9ca3af;">+${vaiTros.length-2}</span>` : '');
}

function getLoaiNguoiDung(vaiTros) {
    if (!vaiTros || !vaiTros.length) return 'student';
    const rolesLower = vaiTros.map(r => r.toLowerCase());
    if (rolesLower.includes('giangvien') || rolesLower.includes('teacher')) return 'teacher';
    if (rolesLower.includes('truongbantochuc') || rolesLower.includes('thanhvienbantochuc') ||
        rolesLower.includes('canboctsv') || rolesLower.includes('bangiamhieu') || rolesLower.includes('admin')) {
        return 'staff';
    }
    return 'student';
}

// ==========================
// STATS
// ==========================
function updateStats(users) {
    const total = users.length;
    const active = users.filter(u => {
        const t = u.trangThai || u.TrangThai || 'HoatDong';
        return t === 'HoatDong' || t === 'active' || t === true || t === 1;
    }).length;
    const locked = total - active;

    // Calculate users registered in the current calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = users.filter(u => {
        const dateStr = u.ngayTao || u.createdAt;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= startOfMonth;
    }).length;

    const cards = document.querySelectorAll('.stats-grid .stat-card');
    if (cards[0]) cards[0].querySelector('.stat-number').textContent = total.toLocaleString('vi-VN');
    if (cards[1]) cards[1].querySelector('.stat-number').textContent = active.toLocaleString('vi-VN');
    if (cards[2]) cards[2].querySelector('.stat-number').textContent = locked.toLocaleString('vi-VN');
    if (cards[3]) cards[3].querySelector('.stat-number').textContent = newThisMonth.toLocaleString('vi-VN');
}

function updateTabCounts(users) {
    const students = users.filter(u => getLoaiNguoiDung(u.vaiTros || u.VaiTros || []) === 'student').length;
    const teachers = users.filter(u => getLoaiNguoiDung(u.vaiTros || u.VaiTros || []) === 'teacher').length;
    const staff = users.filter(u => getLoaiNguoiDung(u.vaiTros || u.VaiTros || []) === 'staff').length;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const f = btn.getAttribute('data-filter');
        if (f === 'all') btn.textContent = `Tất cả (${users.length})`;
        if (f === 'student') btn.textContent = `Sinh viên (${students})`;
        if (f === 'teacher') btn.textContent = `Giảng viên (${teachers})`;
        if (f === 'staff') btn.textContent = `Cán bộ (${staff})`;
    });
}

function updatePagination(total, filtered) {
    const infoEl = document.querySelector('.pagination-info');
    if (infoEl) {
        const start = Math.min((currentPage-1)*PAGE_SIZE+1, filtered);
        const end = Math.min(currentPage*PAGE_SIZE, filtered);
        infoEl.textContent = `Hiển thị ${start}-${end} trên ${filtered} tài khoản`;
    }
}

// ==========================
// TABS & SEARCH & FILTER
// ==========================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            currentPage = 1;
            renderUsers();
        });
    });
}

function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (input) {
        input.addEventListener('input', function() {
            searchTerm = this.value.trim();
            currentPage = 1;
            renderUsers();
        });
    }
}

function initFilters() {
    document.getElementById('roleFilter')?.addEventListener('change', () => { currentPage=1; renderUsers(); });
    document.getElementById('statusFilter')?.addEventListener('change', () => { currentPage=1; renderUsers(); });
}

function applyFilters() { currentPage=1; renderUsers(); }

// ==========================
// THÊM / SỬA NGƯỜI DÙNG
// ==========================
function openAddUserModal() {
    editingUserId = null;
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    if (title) title.textContent = 'Thêm người dùng mới';
    if (form) form.reset();
    if (modal) { modal.style.display = 'flex'; modal.classList.add('active'); }
}

async function openEditUserModal(id) {
    editingUserId = id;
    const user = allUsers.find(u => (u.idNguoiDung || u.maSoSSO || u.id) === id);
    if (!user) return;
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Chỉnh sửa người dùng';
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    set('userName', user.hoTen);
    set('userEmail', user.email);
    set('userId', user.idNguoiDung || user.maSoSSO);
    set('userPhone', user.soDienThoai);
    const vaiTros = user.vaiTros || user.VaiTros || user.roles || [];
    const roleEl = document.getElementById('userRole');
    if (roleEl && vaiTros[0]) roleEl.value = vaiTros[0];
    const statusEl = document.getElementById('userStatus');
    if (statusEl) {
        const t = user.trangThai || user.TrangThai || 'HoatDong';
        statusEl.value = (t === 'HoatDong' || t === 'active' || t === true) ? 'active' : 'inactive';
    }
    if (modal) { modal.style.display = 'flex'; modal.classList.add('active'); }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
    editingUserId = null;
}

async function saveUser() {
    const form = document.getElementById('userForm');
    if (form && !form.checkValidity()) { form.reportValidity(); return; }

    const hoTen = document.getElementById('userName')?.value?.trim();
    const email = document.getElementById('userEmail')?.value?.trim();
    const matKhau = document.getElementById('userPassword')?.value;
    const matKhauXN = document.getElementById('userPasswordConfirm')?.value;
    const vaiTro = document.getElementById('userRole')?.value;
    const trangThai = document.getElementById('userStatus')?.value;
    const maSo = document.getElementById('userId')?.value?.trim();
    const soDienThoai = document.getElementById('userPhone')?.value?.trim();

    if (!hoTen || !email) { alert('Vui lòng nhập đầy đủ họ tên và email.'); return; }
    if (!editingUserId && matKhau !== matKhauXN) { alert('Mật khẩu xác nhận không khớp.'); return; }

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

    const payload = {
        hoTen, email, vaiTro,
        trangThai: trangThai === 'active' ? 'HoatDong' : 'TamKhoa',
        soDienThoai,
        ...(maSo ? { maSoSSO: maSo } : {}),
        ...(!editingUserId && matKhau ? { matKhau } : {})
    };

    try {
        const btn = document.querySelector('#userModal .btn-submit');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...'; }

        let res;
        if (editingUserId) {
            res = await fetch(`${API_BASE}/NguoiDung/${editingUserId}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
        } else {
            res = await fetch(`${API_BASE}/Auth/register`, { method: 'POST', headers, body: JSON.stringify(payload) });
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Lỗi ${res.status}`);
        }

        closeUserModal();
        showAdminToast(editingUserId ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản mới thành công!', 'success');
        await loadUsers();

    } catch (err) {
        console.error(err);
        alert('Lỗi: ' + err.message);
    } finally {
        const btn = document.querySelector('#userModal .btn-submit');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu'; }
    }
}

async function deleteUser(id) {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản ${id}?`)) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/NguoiDung/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        showAdminToast('Đã xóa tài khoản thành công.', 'success');
        await loadUsers();
    } catch (err) {
        alert('Xóa thất bại: ' + err.message);
    }
}

// ==========================
// HELPERS
// ==========================
function showTableError(msg) {
    const tbody = document.querySelector('.admin-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
        <p>${escHtml(msg)}</p>
        <button onclick="loadUsers()" style="margin-top:12px;padding:8px 16px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;">Thử lại</button>
    </td></tr>`;
}

function showAdminToast(msg, type='info') {
    const colors = { success:'#059669', error:'#ef4444', warning:'#f59e0b', info:'#6366f1' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${colors[type]||colors.info};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:320px;`;
    t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 3500);
}

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('click', e => { if (e.target === document.getElementById('userModal')) closeUserModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeUserModal(); });

window.openAddUserModal = openAddUserModal;
window.openEditUserModal = openEditUserModal;
window.closeUserModal = closeUserModal;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.applyFilters = applyFilters;
window.loadUsers = loadUsers;
