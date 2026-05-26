// Admin Dashboard JavaScript

// Export report
function exportReport() {
    console.log('Exporting report...');
    alert('Đang xuất báo cáo...');
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    initUserGrowthChart();
    initEventStatusChart();
    initDashboardSearch();

    const periodSelect = document.getElementById('timePeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            console.log('Period changed to:', this.value);
        });
    }
});

// ===== Thanh tìm kiếm header Dashboard =====
function initDashboardSearch() {
    const input = document.getElementById('dashboardSearch');
    const clearBtn = document.getElementById('dashboardClearSearch');
    if (!input) return;

    // Hiện/ẩn nút xóa
    input.addEventListener('input', () => {
        if (clearBtn) clearBtn.style.display = input.value ? 'inline-flex' : 'none';
    });

    // Nhấn Enter → tìm kiếm
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') executeDashboardSearch(input.value.trim());
    });

    // Nhấn icon search
    const searchIcon = input.closest('.search-bar')?.querySelector('.fa-search');
    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', () => executeDashboardSearch(input.value.trim()));
    }

    // Nút xóa
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            // Reset bảng sự kiện về toàn bộ
            renderAdminEventTable(adminAllEvents);
            input.focus();
        });
    }
}

function executeDashboardSearch(keyword) {
    if (!keyword) return;

    // Hiển thị dropdown gợi ý kết quả
    showSearchSuggestions(keyword);
}

function showSearchSuggestions(keyword) {
    // Xóa dropdown cũ nếu có
    document.getElementById('dashboardSearchDropdown')?.remove();

    const kw = keyword.toLowerCase();
    const results = [];

    // Tìm trong sự kiện
    adminAllEvents.forEach(e => {
        if ((e.tenSuKien || '').toLowerCase().includes(kw) ||
            (e.tenDiaDiem || '').toLowerCase().includes(kw)) {
            results.push({
                type: 'event',
                icon: 'fa-calendar-alt',
                label: e.tenSuKien,
                sub: e.tenDiaDiem || '',
                action: () => {
                    // Cuộn xuống bảng sự kiện và lọc
                    document.getElementById('adminEventKeyword').value = keyword;
                    applyAdminFilters();
                    document.querySelector('.chart-card:last-of-type')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    document.getElementById('dashboardSearchDropdown')?.remove();
                }
            });
        }
    });

    // Nếu không có kết quả sự kiện → gợi ý tìm người dùng
    if (results.length === 0) {
        results.push({
            type: 'user',
            icon: 'fa-users',
            label: `Tìm người dùng "${keyword}"`,
            sub: 'Chuyển sang trang Tài khoản',
            action: () => {
                window.location.href = `admin-users.html?q=${encodeURIComponent(keyword)}`;
            }
        });
    } else {
        // Thêm option tìm người dùng ở cuối
        results.push({
            type: 'user',
            icon: 'fa-users',
            label: `Tìm người dùng "${keyword}"`,
            sub: 'Chuyển sang trang Tài khoản',
            action: () => {
                window.location.href = `admin-users.html?q=${encodeURIComponent(keyword)}`;
            }
        });
    }

    // Tạo dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'dashboardSearchDropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        z-index: 9999;
        overflow: hidden;
        max-height: 320px;
        overflow-y: auto;
    `;

    results.slice(0, 6).forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex; align-items: center; gap: 12px;
            padding: 12px 16px; cursor: pointer;
            transition: background 0.15s;
            border-bottom: 1px solid #F9FAFB;
        `;
        item.innerHTML = `
            <div style="width:32px;height:32px;border-radius:8px;background:${r.type === 'event' ? '#DBEAFE' : '#D1FAE5'};
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas ${r.icon}" style="color:${r.type === 'event' ? '#1E40AF' : '#065F46'};font-size:13px;"></i>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#111827;
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.label}</div>
                <div style="font-size:12px;color:#6B7280;">${r.sub}</div>
            </div>
            <i class="fas fa-arrow-right" style="color:#D1D5DB;font-size:12px;"></i>
        `;
        item.addEventListener('mouseenter', () => item.style.background = '#F9FAFB');
        item.addEventListener('mouseleave', () => item.style.background = 'white');
        item.addEventListener('click', r.action);
        dropdown.appendChild(item);
    });

    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.style.position = 'relative';
        searchBar.appendChild(dropdown);
    }

    // Đóng khi click ngoài
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.search-bar')) {
                document.getElementById('dashboardSearchDropdown')?.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// User Growth Chart
function initUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T7/2024', 'T8/2024', 'T9/2024', 'T10/2024', 'T11/2024', 'T12/2024'],
            datasets: [
                {
                    label: 'Người dùng mới',
                    data: [35, 42, 38, 45, 48, 45],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

// Event Status Chart
function initEventStatusChart() {
    const ctx = document.getElementById('eventStatusChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đã duyệt', 'Chờ duyệt', 'Từ chối', 'Đang diễn ra'],
            datasets: [{
                data: [85, 12, 8, 15],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#3b82f6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== Quản lý sự kiện (Admin) =====

let adminAllEvents = [];
let adminAllDanhMucs = [];

// Khởi tạo phần quản lý sự kiện khi trang load
document.addEventListener('DOMContentLoaded', function () {
    loadAdminDanhMucs().then(() => loadAdminEvents());
    initAdminEventSearch();
});

async function loadAdminDanhMucs() {
    try {
        const data = await API.get(API_CONFIG.ENDPOINTS.DANHMUC);
        adminAllDanhMucs = data || [];
        const sel = document.getElementById('adminFilterDanhMuc');
        if (!sel) return;
        adminAllDanhMucs.forEach(dm => {
            const opt = document.createElement('option');
            opt.value = dm.idDanhMuc;
            opt.textContent = dm.tenDanhMuc;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn('Không tải được danh mục:', e);
    }
}

async function loadAdminEvents() {
    setAdminTableLoading(true);
    try {
        const events = await API.get(API_CONFIG.ENDPOINTS.SUKIEN);
        adminAllEvents = events || [];
        renderAdminEventTable(adminAllEvents);
    } catch (e) {
        console.error('Lỗi tải sự kiện:', e);
        setAdminTableError('Không thể tải danh sách sự kiện.');
    }
}

function renderAdminEventTable(events) {
    const tbody = document.getElementById('adminEventTableBody');
    if (!tbody) return;

    const count = document.getElementById('adminResultCount');
    if (count) count.textContent = `Hiển thị ${events.length} / ${adminAllEvents.length} sự kiện`;

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:32px;color:#9CA3AF;">
                    <i class="fas fa-calendar-times" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    Không tìm thấy sự kiện nào
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = events.map(event => {
        const startDate = new Date(event.thoiGianBatDau);
        const dateStr = `${String(startDate.getDate()).padStart(2,'0')}/${String(startDate.getMonth()+1).padStart(2,'0')}/${startDate.getFullYear()} ${String(startDate.getHours()).padStart(2,'0')}:${String(startDate.getMinutes()).padStart(2,'0')}`;
        const registered = event.soDaDangKy || 0;
        const max = event.soLuongToiDa ? `${registered}/${event.soLuongToiDa}` : `${registered}`;
        const danhMuc = (event.tenDanhMucs && event.tenDanhMucs.length > 0) ? event.tenDanhMucs[0] : '—';
        const badgeClass = getAdminStatusBadge(event.trangThai);

        return `
            <tr>
                <td>
                    <div style="font-weight:600;color:#111827;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${event.tenSuKien}">
                        ${event.tenSuKien}
                    </div>
                    <div style="font-size:12px;color:#6B7280;">${event.tenNguoiTao || ''}</div>
                </td>
                <td style="font-size:13px;">${danhMuc}</td>
                <td style="font-size:13px;">${event.tenDiaDiem || '—'}</td>
                <td style="font-size:13px;white-space:nowrap;">${dateStr}</td>
                <td style="font-size:13px;text-align:center;">${max}</td>
                <td><span class="admin-status-badge ${badgeClass}">${event.trangThai}</span></td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="admin-btn-action" title="Xem chi tiết" onclick="window.location.href='event-detail.html?id=${event.idSuKien}'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="admin-btn-action admin-btn-danger" title="Xóa sự kiện" onclick="adminDeleteEvent(${event.idSuKien}, '${event.tenSuKien.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getAdminStatusBadge(trangThai) {
    const map = {
        'Nháp': 'badge-draft',
        'Chờ duyệt': 'badge-pending',
        'Đã duyệt': 'badge-approved',
        'Đang diễn ra': 'badge-ongoing',
        'Đã kết thúc': 'badge-completed',
        'Đã hủy': 'badge-cancelled',
    };
    return map[trangThai] || 'badge-draft';
}

function initAdminEventSearch() {
    const input = document.getElementById('adminEventKeyword');
    const clearBtn = document.getElementById('adminClearSearch');
    const selDanhMuc = document.getElementById('adminFilterDanhMuc');
    const selTrangThai = document.getElementById('adminFilterTrangThai');
    const tuNgay = document.getElementById('adminFilterTuNgay');
    const denNgay = document.getElementById('adminFilterDenNgay');
    const resetBtn = document.getElementById('adminResetFilter');

    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
        debounce = setTimeout(applyAdminFilters, 300);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(debounce); applyAdminFilters(); } });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            applyAdminFilters();
            input.focus();
        });
    }
    if (selDanhMuc) selDanhMuc.addEventListener('change', applyAdminFilters);
    if (selTrangThai) selTrangThai.addEventListener('change', applyAdminFilters);
    if (tuNgay) tuNgay.addEventListener('change', applyAdminFilters);
    if (denNgay) denNgay.addEventListener('change', applyAdminFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetAdminFilters);
}

function applyAdminFilters() {
    const keyword = (document.getElementById('adminEventKeyword')?.value || '').trim().toLowerCase();
    const idDanhMuc = document.getElementById('adminFilterDanhMuc')?.value || '';
    const trangThai = document.getElementById('adminFilterTrangThai')?.value || '';
    const tuNgay = document.getElementById('adminFilterTuNgay')?.value || '';
    const denNgay = document.getElementById('adminFilterDenNgay')?.value || '';

    const filtered = adminAllEvents.filter(event => {
        if (keyword) {
            const target = [event.tenSuKien || '', event.moTa || '', event.tenDiaDiem || '', event.tenNguoiTao || ''].join(' ').toLowerCase();
            if (!target.includes(keyword)) return false;
        }
        if (idDanhMuc) {
            const ids = event.danhMucIds || [];
            if (!ids.includes(parseInt(idDanhMuc))) return false;
        }
        if (trangThai && event.trangThai !== trangThai) return false;
        if (tuNgay && new Date(event.thoiGianBatDau) < new Date(tuNgay)) return false;
        if (denNgay && new Date(event.thoiGianBatDau) > new Date(denNgay + 'T23:59:59')) return false;
        return true;
    });

    renderAdminEventTable(filtered);
}

function resetAdminFilters() {
    const ids = ['adminEventKeyword', 'adminFilterDanhMuc', 'adminFilterTrangThai', 'adminFilterTuNgay', 'adminFilterDenNgay'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const clearBtn = document.getElementById('adminClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    renderAdminEventTable(adminAllEvents);
}

async function adminDeleteEvent(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa sự kiện "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
        await API.delete(API_CONFIG.ENDPOINTS.SUKIEN_BY_ID(id));
        adminAllEvents = adminAllEvents.filter(e => e.idSuKien !== id);
        applyAdminFilters();
    } catch (e) {
        alert('Không thể xóa sự kiện. Vui lòng thử lại.');
    }
}
window.adminDeleteEvent = adminDeleteEvent;

function setAdminTableLoading(show) {
    const tbody = document.getElementById('adminEventTableBody');
    if (!tbody) return;
    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:32px;color:#9CA3AF;">
                    <i class="fas fa-spinner fa-spin"></i> Đang tải...
                </td>
            </tr>`;
    }
}

function setAdminTableError(msg) {
    const tbody = document.getElementById('adminEventTableBody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:32px;color:#EF4444;">
                <i class="fas fa-exclamation-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                ${msg}
            </td>
        </tr>`;
}
