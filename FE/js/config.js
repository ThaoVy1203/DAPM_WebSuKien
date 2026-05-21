// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://localhost:7160/api',
    ENDPOINTS: {
        // Sự kiện
        SUKIEN: '/SuKien',
        SUKIEN_BY_ID: (id) => `/SuKien/${id}`,
        
        // Địa điểm
        DIADIEM: '/DiaDiem',
        DIADIEM_BY_ID: (id) => `/DiaDiem/${id}`,
        
        // Đăng ký
        DANGKY: '/DangKy',
        DANGKY_REGISTER: '/DangKy/dang-ky',
        DANGKY_CANCEL: '/DangKy/huy-dang-ky',
        DANGKY_CHECKIN: '/DangKy/check-in',
        DANGKY_BY_SUKIEN: (idSuKien) => `/DangKy/su-kien/${idSuKien}`,
        DANGKY_BY_NGUOIDUNG: (idNguoiDung) => `/DangKy/nguoi-dung/${idNguoiDung}`,
        
        // Người dùng
        NGUOIDUNG: '/NguoiDung',
        NGUOIDUNG_BY_ID: (id) => `/NguoiDung/${id}`,
        
        // Danh mục
        DANHMUC: '/DanhMuc',
        DANHMUC_BY_ID: (id) => `/DanhMuc/${id}`,
    }
};

// API Helper Functions
const API = {
    // GET request
    async get(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    // POST request
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    // PUT request
    async put(endpoint, data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    
    // DELETE request
    async delete(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, API };
}
