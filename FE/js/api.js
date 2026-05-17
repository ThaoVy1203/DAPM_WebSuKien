// api.js
const API_BASE = "https://localhost:7160/api";

// ======================
// Generic Request Handler
// ======================
async function request(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            if (!window.location.pathname.includes("login")) {
                window.location.href = "pages/login.html";
            }
            throw new Error("Phiên đăng nhập hết hạn");
        }

        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

// ======================
// Auth APIs
// ======================
const AuthAPI = {
    getCurrentUser: () => {
        const userData = localStorage.getItem("userData");
        return userData ? JSON.parse(userData) : null;
    },
    
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        window.location.href = "pages/login.html";
    }
};

// ======================
// User APIs
// ======================
const UserAPI = {
    getAll: () => request("/NguoiDung"),
    getById: (id) => request(`/NguoiDung/${id}`),
    getProfile: () => AuthAPI.getCurrentUser()
};

// ======================
// Task APIs
// ======================
const TaskAPI = {
    getAll: () => request("/tasks"),
    getById: (id) => request(`/tasks/${id}`),
    getBySuKien: (idSuKien) => request(`/tasks/su-kien/${idSuKien}`),
    create: (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/tasks/${id}`, { method: "DELETE" })
};

// ======================
// Report APIs
// ======================
const ReportAPI = {
    getDashboard: () => request("/reports/dashboard"),
    getBudgets: () => request("/reports/budgets") || Promise.resolve([]),
    exportExcel: () => request("/reports/export")
};

// ======================
// Helpers
// ======================
function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert("Lỗi: " + message);
}

// Export
window.API = {
    AuthAPI,
    UserAPI,
    TaskAPI,
    ReportAPI,
    showSuccess,
    showError
};