const API_URL = "https://localhost:7160/api/PheDuyet";

let currentApprovalId = null;
let uploadedFiles = [];
let approvals = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
    await loadApprovals();

    initializeFilterTabs();
    initializeApprovalTypeChange();
    initializeFileUpload();
    initializeFilterSelect();
});

// ================= LOAD =================
async function loadApprovals() {
    try {
        const response = await fetch(API_URL);
        approvals = await response.json();

        renderApprovals(approvals);

    } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu phê duyệt");
    }
}

// ================= RENDER =================
function renderApprovals(data) {
    const container = document.querySelector(".approval-list");
    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {
        container.innerHTML += `
            <div class="approval-item" data-status="${item.trangThai}">
                <h3>${item.tieuDe}</h3>
                <p>${item.moTa}</p>

                <div>
                    <button onclick="viewApprovalDetail(${item.id})">Chi tiết</button>
                    <button onclick="editApproval(${item.id})">Sửa</button>
                    <button onclick="cancelApproval(${item.id})">Hủy</button>
                </div>
            </div>
        `;
    });
}

// ================= FILTER TABS =================
function initializeFilterTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabButtons.forEach(button => {
        button.addEventListener("click", function () {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const status = this.dataset.status;

            if (status === "all") {
                renderApprovals(approvals);
            } else {
                renderApprovals(
                    approvals.filter(a => a.trangThai === status)
                );
            }
        });
    });
}

// ================= APPROVAL TYPE =================
function initializeApprovalTypeChange() {
    const approvalTypeSelect = document.getElementById("approvalType");
    const budgetSection = document.getElementById("budgetSection");

    if (approvalTypeSelect && budgetSection) {
        approvalTypeSelect.addEventListener("change", function () {
            budgetSection.style.display =
                this.value === "budget" ? "block" : "none";
        });
    }
}

// ================= FILE UPLOAD =================
function initializeFileUpload() {
    const fileInput = document.getElementById("fileInput");

    if (!fileInput) return;

    fileInput.addEventListener("change", function (e) {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.size <= 10 * 1024 * 1024) {
                uploadedFiles.push(file);
                addFileToList(file);
            } else {
                alert(`${file.name} vượt quá 10MB`);
            }
        });

        fileInput.value = "";
    });
}

function addFileToList(file) {
    const fileList = document.getElementById("fileList");

    fileList.innerHTML += `
        <div class="file-item">
            <span>${file.name}</span>
            <button onclick="removeFile('${file.name}')">X</button>
        </div>
    `;
}

function removeFile(filename) {
    uploadedFiles = uploadedFiles.filter(f => f.name !== filename);
    loadFileList();
}

function loadFileList() {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    uploadedFiles.forEach(addFileToList);
}

// ================= MODAL =================
function openCreateApprovalModal() {
    currentApprovalId = null;

    document.getElementById("approvalForm").reset();
    uploadedFiles = [];
    loadFileList();

    document.getElementById("approvalModal").classList.add("active");
}

function closeApprovalModal() {
    document.getElementById("approvalModal").classList.remove("active");
}

function closeApprovalDetailModal() {
    document.getElementById("approvalDetailModal").classList.remove("active");
}

// ================= COLLECT =================
function collectFormData() {
    return {
        loai: document.getElementById("approvalType").value,
        nguoiDuyet: document.getElementById("approver").value,
        tieuDe: document.getElementById("approvalTitle").value,
        moTa: document.getElementById("approvalDescription").value,
        ngayDuKien: document.getElementById("expectedDate").value,
        mucDo: document.getElementById("priority").value,
        tongKinhPhi: document.getElementById("totalBudget")?.value || null,
        ghiChu: document.getElementById("additionalNotes").value
    };
}

// ================= SAVE DRAFT =================
async function saveDraft() {
    const data = collectFormData();
    data.trangThai = "draft";

    await saveApproval(data);

    alert("Đã lưu nháp");
}

// ================= SAVE =================
async function saveApproval(data) {
    try {
        if (currentApprovalId) {
            await fetch(`${API_URL}/${currentApprovalId}`, {
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

        await loadApprovals();
        closeApprovalModal();

    } catch (error) {
        console.error(error);
        alert("Lưu thất bại");
    }
}

// ================= EDIT =================
async function editApproval(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        currentApprovalId = id;

        document.getElementById("approvalType").value = data.loai;
        document.getElementById("approver").value = data.nguoiDuyet;
        document.getElementById("approvalTitle").value = data.tieuDe;
        document.getElementById("approvalDescription").value = data.moTa;
        document.getElementById("expectedDate").value = data.ngayDuKien;
        document.getElementById("priority").value = data.mucDo;

        document.getElementById("approvalModal").classList.add("active");

    } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu");
    }
}

// ================= DETAIL =================
async function viewApprovalDetail(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        document.getElementById("detailTitle").textContent = data.tieuDe;
        document.getElementById("detailDescription").textContent = data.moTa;
        document.getElementById("detailStatus").textContent = data.trangThai;

        document.getElementById("approvalDetailModal").classList.add("active");

    } catch (error) {
        console.error(error);
        alert("Không tải được chi tiết");
    }
}

// ================= CANCEL =================
async function cancelApproval(id) {
    if (!confirm("Hủy yêu cầu này?")) return;

    try {
        await fetch(`${API_URL}/cancel/${id}`, {
            method: "PUT"
        });

        await loadApprovals();

    } catch (error) {
        console.error(error);
    }
}

// ================= DELETE =================
async function deleteApproval(id) {
    if (!confirm("Xóa bản nháp?")) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        await loadApprovals();

    } catch (error) {
        console.error(error);
    }
}

// ================= RESUBMIT =================
function resubmitApproval(id) {
    editApproval(id);
}

// ================= SUBMIT =================
document.getElementById("approvalForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = collectFormData();
    data.trangThai = "pending";

    await saveApproval(data);

    alert("Đã gửi yêu cầu phê duyệt");
});

// ================= FILTER SELECT =================
function initializeFilterSelect() {
    const filterSelect = document.querySelector(".filter-select");

    if (!filterSelect) return;

    filterSelect.addEventListener("change", function () {
        const value = this.value;

        if (value === "all") {
            renderApprovals(approvals);
        } else {
            renderApprovals(
                approvals.filter(a => a.loai === value)
            );
        }
    });
}

// ================= MODAL CLOSE =================
window.addEventListener("click", function (e) {
    if (e.target.id === "approvalModal") closeApprovalModal();
    if (e.target.id === "approvalDetailModal") closeApprovalDetailModal();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeApprovalModal();
        closeApprovalDetailModal();
    }
});