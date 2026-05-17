// Attendance Page JavaScript

const API_BASE = "https://localhost:7160/api";

let participantsData = [];

// ==========================
// LOAD DATA FROM API
// ==========================
async function loadAttendanceData() {
    try {
        const response = await fetch(`${API_BASE}/DiemDanh`);

        if (!response.ok) {
            throw new Error("Không thể tải dữ liệu điểm danh");
        }

        participantsData = await response.json();

        renderParticipantsTable();
        updateStats();

        console.log("Attendance Data:", participantsData);

    } catch (error) {
        console.error("Lỗi load API:", error);
        alert("Không kết nối được backend!");
    }
}

// ==========================
// RENDER TABLE
// ==========================
function renderParticipantsTable() {
    const tbody = document.getElementById('participantsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    participantsData.forEach(participant => {
        const row = document.createElement('tr');

        const statusClass = participant.status === 'present' ? 'present' : 'absent';
        const statusText = participant.status === 'present'
            ? 'Đã có mặt'
            : 'Vắng mặt';

        const avatar = participant.name
            ? participant.name.split(' ').map(n => n[0]).join('').substring(0, 2)
            : 'NA';

        row.innerHTML = `
            <td>
                <div class="participant-info">
                    <div class="participant-avatar blue">${avatar}</div>
                    <div class="participant-details">
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-department">${participant.department}</div>
                    </div>
                </div>
            </td>
            <td>${participant.studentId}</td>
            <td>${participant.checkInTime || '—'}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td>
                <button class="btn-more" onclick="showParticipantMenu(${participant.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ==========================
// PARTICIPANT MENU
// ==========================
function showParticipantMenu(participantId) {
    const participant = participantsData.find(p => p.id === participantId);

    if (participant) {
        alert(`Tùy chọn cho ${participant.name}`);
    }
}

// ==========================
// SEARCH
// ==========================
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();

        const filtered = participantsData.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.studentId.toLowerCase().includes(searchTerm) ||
            p.department.toLowerCase().includes(searchTerm)
        );

        renderFilteredTable(filtered);
    });
}

function renderFilteredTable(data) {
    const tbody = document.getElementById('participantsTableBody');
    tbody.innerHTML = '';

    data.forEach(participant => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.studentId}</td>
            <td>${participant.checkInTime || '—'}</td>
            <td>${participant.status}</td>
        `;

        tbody.appendChild(row);
    });
}

// ==========================
// MANUAL CHECK-IN
// ==========================
async function manualCheckIn() {
    const studentId = prompt('Nhập mã số sinh viên:');

    if (!studentId) return;

    try {
        const response = await fetch(`${API_BASE}/DiemDanh/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId })
        });

        if (!response.ok) {
            throw new Error();
        }

        alert("Điểm danh thành công");

        await loadAttendanceData();

    } catch (error) {
        console.error(error);
        alert("Điểm danh thất bại");
    }
}

// ==========================
// UPDATE STATS
// ==========================
function updateStats() {
    const totalParticipants = participantsData.length;

    const presentCount = participantsData.filter(
        p => p.status === 'present'
    ).length;

    const absentCount = totalParticipants - presentCount;

    const percentage = totalParticipants > 0
        ? ((presentCount / totalParticipants) * 100).toFixed(1)
        : 0;

    const circumference = 2 * Math.PI * 90;
    const progress = totalParticipants > 0
        ? (presentCount / totalParticipants) * circumference
        : 0;

    const circleProgress = document.querySelector('.circle-progress');
    if (circleProgress) {
        circleProgress.style.strokeDasharray = `${progress}, ${circumference}`;
    }

    const circleNumber = document.querySelector('.circle-number');
    if (circleNumber) {
        circleNumber.textContent = presentCount;
    }

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
        statValues[0].textContent = percentage + '%';
        statValues[1].textContent = absentCount;
    }
}

// ==========================
// EXPORT
// ==========================
function exportToExcel() {
    window.open(`${API_BASE}/DiemDanh/export`, '_blank');
}

// ==========================
// AUTO REFRESH
// ==========================
function startActivityFeed() {
    setInterval(async () => {
        await loadAttendanceData();
    }, 10000);
}

// ==========================
// EVENT LISTENERS
// ==========================
function setupEventListeners() {
    document.querySelector('.btn-export')
        ?.addEventListener('click', exportToExcel);

    document.querySelector('.btn-manual-checkin')
        ?.addEventListener('click', manualCheckIn);
}

// ==========================
// INITIALIZE
// ==========================
document.addEventListener('DOMContentLoaded', async function () {

    await loadAttendanceData();

    setupSearch();
    setupEventListeners();
    startActivityFeed();

    const token = localStorage.getItem('token');

    if (!token) {
        console.warn("Chưa đăng nhập");
    }
});

// ==========================
// EXPORT MODULE
// ==========================
window.attendanceModule = {
    loadAttendanceData,
    renderParticipantsTable,
    updateStats,
    exportToExcel,
    manualCheckIn,
    showParticipantMenu
};