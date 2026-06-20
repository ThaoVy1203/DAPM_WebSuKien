"use strict";
// admin-locations.js — Quản lý địa điểm, lấy dữ liệu từ SQL qua API

const API_URL = "http://localhost:5103/api/DiaDiem";

let editingId = null;
let allLocations = [];

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    await loadLocations();
    initSearch();
    initTabFilter();
    initLogout();
});

// ─── LOAD TỪ API ──────────────────────────────────────────────────────────────
async function loadLocations() {
    showGridLoading(true);
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Chuẩn hóa PascalCase → camelCase
        allLocations = (Array.isArray(data) ? data : []).map(normalizeLocation);
        renderAll(allLocations);
    } catch (e) {
        console.error("Lỗi load địa điểm:", e);
        showGridError("Không tải được dữ liệu. Vui lòng kiểm tra Backend đã chạy chưa.");
    }
}

function normalizeLocation(d) {
    return {
        idDiaDiem:       d.IdDiaDiem       ?? d.idDiaDiem,
        tenDiaDiem:      d.TenDiaDiem      ?? d.tenDiaDiem      ?? "",
        viTri:           d.ViTri           ?? d.viTri           ?? "",
        sucChua:         d.SucChua         ?? d.sucChua         ?? 0,
        trangThaiSuDung: d.TrangThaiSuDung ?? d.trangThaiSuDung ?? "Hoạt động",
    };
}

// ─── ẢNH FALLBACK theo tên ────────────────────────────────────────────────────
function getLocationImage(loc) {
    const name = (loc.tenDiaDiem || "").toLowerCase();
    if (name.includes("hội trường") || name.includes("hall") || name.includes("auditorium"))
        return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80";
    if (name.includes("sân") || name.includes("ngoài trời") || name.includes("outdoor"))
        return "https://images.unsplash.com/photo-1567972526827-9e4d6c2f6dfb?w=600&q=80";
    if (name.includes("phòng họp") || name.includes("meeting"))
        return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80";
    if (name.includes("phòng") || name.includes("room") || name.includes("giảng đường"))
        return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80";
    if (name.includes("thư viện") || name.includes("library"))
        return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80";
    return "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80";
}

// ─── RENDER TẤT CẢ ────────────────────────────────────────────────────────────
function renderAll(locations) {
    updateStats(locations);
    updateTabCounts(locations);
    renderLocationCards(locations);
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function updateStats(locations) {
    const total     = locations.length;
    const active    = locations.filter(l => l.trangThaiSuDung === "Hoạt động").length;
    const inactive  = locations.filter(l => l.trangThaiSuDung !== "Hoạt động").length;
    const totalCap  = locations.reduce((s, l) => s + (l.sucChua || 0), 0);

    setText("statTotal",    total);
    setText("statActive",   active);
    setText("statInactive", inactive);
    setText("statCapacity", totalCap.toLocaleString("vi-VN"));
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ─── TAB COUNTS ───────────────────────────────────────────────────────────────
function updateTabCounts(locations) {
    setText("tabAll",   locations.length);
    setText("tabActive",   locations.filter(l => l.trangThaiSuDung === "Hoạt động").length);
    setText("tabInactive", locations.filter(l => l.trangThaiSuDung !== "Hoạt động").length);
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────
function renderLocationCards(locations) {
    const container = document.querySelector('.locations-grid');
    if (!container) return;

    if (!locations.length) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#666;">
                <i class="fas fa-map-marker-alt" style="font-size:48px;color:#d1d5db;display:block;margin-bottom:16px;"></i>
                <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;">Chưa có địa điểm nào</h3>
                <p>Bấm "+ Thêm địa điểm" để bắt đầu.</p>
            </div>`;
        return;
    }

    container.innerHTML = "";
    locations.forEach(loc => {
        const id = loc.idDiaDiem;
        const isActive = loc.trangThaiSuDung === "Hoạt động";
        const statusClass = isActive ? "available" : "maintenance";
        const statusText  = loc.trangThaiSuDung || "Hoạt động";
        const imgUrl = getLocationImage(loc);

        const card = document.createElement("div");
        card.className = "location-card";
        card.innerHTML = `
            <div class="location-image">
                <img src="${imgUrl}" alt="${escapeHtml(loc.tenDiaDiem)}" loading="lazy"
                     onerror="this.src='https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80'">
                <span class="location-status ${statusClass}">${escapeHtml(statusText)}</span>
            </div>
            <div class="location-info">
                <h3>${escapeHtml(loc.tenDiaDiem)}</h3>
                <div class="location-details">
                    <span><i class="fas fa-users"></i> ${loc.sucChua || 0} người</span>
                    ${loc.viTri ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(loc.viTri)}</span>` : ""}
                </div>
            </div>
            <div class="location-actions">
                <button class="btn-action view"   onclick="viewLocation(${id})"   title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                <button class="btn-action edit"   onclick="editLocation(${id})"   title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-action delete" onclick="deleteLocation(${id})" title="Xóa"><i class="fas fa-trash"></i></button>
            </div>`;
        container.appendChild(card);
    });
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function initSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;
    let timer;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const kw = this.value.trim().toLowerCase();
            const filtered = kw
                ? allLocations.filter(l =>
                    (l.tenDiaDiem || "").toLowerCase().includes(kw) ||
                    (l.viTri     || "").toLowerCase().includes(kw))
                : allLocations;
            renderAll(filtered);
        }, 250);
    });
}

// ─── TAB FILTER ───────────────────────────────────────────────────────────────
function initTabFilter() {
    document.querySelectorAll('.tab-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const f = this.dataset.filter;
            const filtered = f === 'all'      ? allLocations
                : f === 'active'   ? allLocations.filter(l => l.trangThaiSuDung === "Hoạt động")
                : f === 'inactive' ? allLocations.filter(l => l.trangThaiSuDung !== "Hoạt động")
                : allLocations;
            renderLocationCards(filtered);
        });
    });
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
function viewLocation(id) {
    const loc = allLocations.find(l => l.idDiaDiem === id);
    if (!loc) return;
    alert(`📍 ${loc.tenDiaDiem}\n👥 Sức chứa: ${loc.sucChua || 0} người\n📌 Vị trí: ${loc.viTri || "Chưa xác định"}\n✅ Trạng thái: ${loc.trangThaiSuDung}`);
}
window.viewLocation = viewLocation;

// ─── MODAL THÊM / SỬA ────────────────────────────────────────────────────────
function openAddLocationModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Thêm địa điểm mới';
    document.getElementById('locationForm').reset();
    document.getElementById('locationModal').style.display = 'flex';
}
window.openAddLocationModal = openAddLocationModal;

async function editLocation(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const loc = normalizeLocation(raw);

        editingId = id;
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa địa điểm';
        document.getElementById('locationName').value     = loc.tenDiaDiem;
        document.getElementById('locationCapacity').value = loc.sucChua || '';
        document.getElementById('locationPosition').value = loc.viTri   || '';
        document.getElementById('locationStatus').value   = loc.trangThaiSuDung;
        document.getElementById('locationModal').style.display = 'flex';
    } catch (e) {
        console.error(e);
        alert("Không tải được thông tin địa điểm.");
    }
}
window.editLocation = editLocation;

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    editingId = null;
}
window.closeLocationModal = closeLocationModal;

// ─── SAVE ─────────────────────────────────────────────────────────────────────
async function saveLocation() {
    const name   = document.getElementById('locationName').value.trim();
    const cap    = parseInt(document.getElementById('locationCapacity').value) || 0;
    const pos    = document.getElementById('locationPosition').value.trim();
    const status = document.getElementById('locationStatus').value;

    if (!name) { alert('Vui lòng nhập tên địa điểm.'); return; }

    const payload = {
        TenDiaDiem:      name,
        SucChua:         cap,
        ViTri:           pos,
        TrangThaiSuDung: status
    };

    const submitBtn = document.querySelector('#locationModal .btn-submit');
    try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...'; }

        const url    = editingId ? `${API_URL}/${editingId}` : API_URL;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        closeLocationModal();
        showToast(editingId ? '✅ Cập nhật địa điểm thành công!' : '✅ Thêm địa điểm mới thành công!');
        await loadLocations();
    } catch (e) {
        console.error(e);
        alert('Lưu thất bại: ' + e.message);
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu'; }
    }
}
window.saveLocation = saveLocation;

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteLocation(id) {
    const loc = allLocations.find(l => l.idDiaDiem === id);
    if (!confirm(`Xóa địa điểm "${loc?.tenDiaDiem || id}"?\nHành động này không thể hoàn tác.`)) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status}`);
        }
        showToast('🗑️ Đã xóa địa điểm.');
        await loadLocations();
    } catch (e) {
        console.error(e);
        alert('Xóa thất bại: ' + e.message);
    }
}
window.deleteLocation = deleteLocation;

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function exportLocations() {
    if (!allLocations.length) { alert('Không có dữ liệu để xuất.'); return; }
    const rows = [['ID', 'Tên địa điểm', 'Vị trí', 'Sức chứa', 'Trạng thái']];
    allLocations.forEach(l => rows.push([l.idDiaDiem, l.tenDiaDiem, l.viTri, l.sucChua, l.trangThaiSuDung]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
        href: 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv),
        download: 'dia-diem.csv'
    });
    a.click();
}
window.exportLocations = exportLocations;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function showGridLoading(show) {
    const grid = document.querySelector('.locations-grid');
    if (!grid) return;
    if (show) grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:#666;">
            <i class="fas fa-spinner fa-spin" style="font-size:36px;color:#0D5A9C;display:block;margin-bottom:16px;"></i>
            Đang tải dữ liệu...
        </div>`;
}

function showGridError(msg) {
    const grid = document.querySelector('.locations-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:#dc2626;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;display:block;margin-bottom:16px;"></i>
            <strong>${msg}</strong><br>
            <button onclick="loadLocations()" style="margin-top:12px;padding:8px 20px;background:#0D5A9C;color:white;border:none;border-radius:8px;cursor:pointer;">
                <i class="fas fa-redo"></i> Thử lại
            </button>
        </div>`;
}

function showToast(msg) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 20px;
        background:#059669;color:white;border-radius:10px;font-size:14px;font-weight:600;
        box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:360px;`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function initLogout() {
    const btn = document.querySelector('.nav-item.danger');
    if (btn) btn.addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
}
