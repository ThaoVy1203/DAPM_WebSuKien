# Hệ thống Phân quyền Ban Tổ chức (BTC)

## Tổng quan

Hệ thống phân quyền cho phép quản lý truy cập của 2 loại người dùng trong Ban Tổ chức:

### 1. Trưởng Ban Tổ chức (truong_btc)
- **Quyền truy cập**: Toàn quyền tất cả các chức năng
- **Chức năng**:
  - ✅ Dashboard - Xem tất cả sự kiện và thống kê
  - ✅ Sự kiện của tôi - Tạo, sửa, xóa sự kiện
  - ✅ Ngân sách - Quản lý ngân sách, tạo, sửa, xóa
  - ✅ Phê duyệt - Duyệt/từ chối yêu cầu
  - ✅ Công việc (Task) - Quản lý tất cả task
  - ✅ Người tham gia - Quản lý người tham gia
  - ✅ Báo cáo - Tạo, xem, xuất báo cáo

### 2. Thành viên Ban Tổ chức (thanh_vien_btc)
- **Quyền truy cập**: Giới hạn, chỉ xem và cập nhật công việc được phân công
- **Chức năng**:
  - ✅ Dashboard - Chỉ xem sự kiện được phân công
  - ✅ Sự kiện của tôi - Xem danh sách và chi tiết (không tạo/sửa/xóa)
  - ❌ Ngân sách - Không truy cập
  - ❌ Phê duyệt - Không truy cập
  - ✅ Công việc (Task) - Xem và cập nhật trạng thái task của mình
  - ❌ Người tham gia - Không truy cập
  - ❌ Báo cáo - Không truy cập

## Cấu trúc File

```
FE/
├── js/
│   └── btc-auth.js          # Logic phân quyền chính
├── css/
│   └── btc-auth.css         # Styles cho phân quyền
└── pages/
    ├── btc-role-switcher.html   # Trang test chuyển đổi vai trò
    ├── btc-dashboard.html       # Đã tích hợp phân quyền
    ├── btc-events.html          # Đã tích hợp phân quyền
    ├── btc-budget.html          # Đã tích hợp phân quyền
    ├── btc-approval.html        # Đã tích hợp phân quyền
    ├── btc-team-tasks.html      # Đã tích hợp phân quyền
    ├── btc-attendance.html      # Đã tích hợp phân quyền
    └── btc-reports.html         # Đã tích hợp phân quyền
```

## Cách sử dụng

### 1. Test hệ thống phân quyền

Mở file `btc-role-switcher.html` để:
- Chọn vai trò (Trưởng BTC hoặc Thành viên BTC)
- Xem danh sách quyền truy cập
- Chuyển đến Dashboard để test

### 2. Tích hợp vào hệ thống thực

Trong file `btc-auth.js`, cập nhật hàm `getCurrentUserRole()`:

```javascript
function getCurrentUserRole() {
    // Lấy thông tin user từ localStorage hoặc API
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    // Hoặc lấy từ API
    // const userInfo = await fetch('/api/user/current').then(r => r.json());
    
    return userInfo.role || BTC_ROLES.MEMBER;
}
```

### 3. Lưu thông tin user sau khi đăng nhập

Trong file `login.js`, sau khi đăng nhập thành công:

```javascript
// Sau khi đăng nhập thành công
const userInfo = {
    id: userData.id,
    name: userData.name,
    role: userData.role, // 'truong_btc' hoặc 'thanh_vien_btc'
    email: userData.email
};

localStorage.setItem('userInfo', JSON.stringify(userInfo));

// Redirect đến dashboard
window.location.href = 'btc-dashboard.html';
```

## Các chức năng chính

### 1. Khởi tạo phân quyền sidebar
```javascript
initializeSidebarPermissions()
```
- Tự động chạy khi load trang
- Disable các tab không có quyền
- Thêm icon khóa và tooltip

### 2. Kiểm tra quyền truy cập trang
```javascript
checkPageAccess()
```
- Kiểm tra xem user có quyền truy cập trang hiện tại không
- Hiển thị trang "Access Denied" nếu không có quyền

### 3. Ẩn các nút hành động
```javascript
hideRestrictedActions()
```
- Ẩn nút Tạo mới, Sửa, Xóa, Phê duyệt
- Dựa trên quyền của user

### 4. Lọc dữ liệu theo vai trò
```javascript
filterDataByRole(data, type)
```
- Trưởng BTC: Xem tất cả
- Thành viên: Chỉ xem dữ liệu được phân công

### 5. Kiểm tra quyền cụ thể
```javascript
hasPermission('canCreate')
hasPermission('canEdit')
hasPermission('canDelete')
hasPermission('canApprove')
```

## Giao diện người dùng

### 1. Sidebar bị khóa
- Các tab không có quyền sẽ có:
  - Opacity giảm (50%)
  - Icon khóa bên phải
  - Tooltip khi hover
  - Không thể click

### 2. Toast thông báo
- Hiển thị khi user cố truy cập chức năng bị khóa
- Tự động ẩn sau 3 giây
- Màu đỏ với icon khóa

### 3. Trang Access Denied
- Hiển thị khi user truy cập trang không có quyền
- Icon khóa lớn
- Nút quay về Dashboard

### 4. Role Badge
- Hiển thị vai trò trong header
- Trưởng BTC: Badge vàng với icon vương miện
- Thành viên: Badge xanh với icon user

## Tùy chỉnh

### Thêm quyền mới

Trong `btc-auth.js`, cập nhật object `PERMISSIONS`:

```javascript
const PERMISSIONS = {
    [BTC_ROLES.LEADER]: {
        canAccessDashboard: true,
        canAccessEvents: true,
        // Thêm quyền mới
        canAccessNewFeature: true
    },
    [BTC_ROLES.MEMBER]: {
        canAccessDashboard: true,
        canAccessEvents: false,
        // Thêm quyền mới
        canAccessNewFeature: false
    }
};
```

### Thêm vai trò mới

```javascript
const BTC_ROLES = {
    LEADER: 'truong_btc',
    MEMBER: 'thanh_vien_btc',
    // Thêm vai trò mới
    DEPUTY: 'pho_truong_btc'
};

const PERMISSIONS = {
    // ... existing roles
    [BTC_ROLES.DEPUTY]: {
        canAccessDashboard: true,
        canAccessEvents: true,
        // ... define permissions
    }
};
```

## API Integration

### Backend cần cung cấp

1. **API lấy thông tin user hiện tại**
```
GET /api/user/current
Response: {
    id: 1,
    name: "Nguyễn Văn A",
    role: "truong_btc",
    email: "nguyenvana@example.com"
}
```

2. **API kiểm tra quyền**
```
GET /api/user/permissions
Response: {
    canAccessDashboard: true,
    canAccessEvents: true,
    canCreate: true,
    canEdit: true,
    canDelete: true
}
```

3. **API lọc dữ liệu theo user**
```
GET /api/events?userId=1
GET /api/tasks?assignedTo=1
```

## Testing

### Test Case 1: Trưởng BTC
1. Mở `btc-role-switcher.html`
2. Chọn "Trưởng Ban Tổ chức"
3. Click "Vào Dashboard"
4. Kiểm tra:
   - ✅ Tất cả tab sidebar có thể click
   - ✅ Tất cả nút hành động hiển thị
   - ✅ Role badge hiển thị "Trưởng ban"

### Test Case 2: Thành viên BTC
1. Mở `btc-role-switcher.html`
2. Chọn "Thành viên BTC"
3. Click "Vào Dashboard"
4. Kiểm tra:
   - ✅ Chỉ Dashboard và Công việc (Task) có thể truy cập
   - ✅ Các tab khác bị khóa với icon khóa
   - ✅ Click vào tab bị khóa hiển thị toast thông báo
   - ✅ Nút Tạo mới, Sửa, Xóa bị ẩn
   - ✅ Role badge hiển thị "Thành viên"

### Test Case 3: Truy cập trực tiếp URL
1. Đăng nhập với vai trò Thành viên
2. Truy cập trực tiếp: `btc-events.html`
3. Kiểm tra:
   - ✅ Hiển thị trang "Access Denied"
   - ✅ Có nút quay về Dashboard

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG**: Phân quyền frontend chỉ là UI/UX, KHÔNG phải bảo mật thực sự!

Backend PHẢI:
1. ✅ Kiểm tra quyền trên mỗi API request
2. ✅ Validate user role từ session/token
3. ✅ Không tin tưởng dữ liệu từ client
4. ✅ Implement proper authentication & authorization

## Troubleshooting

### Vấn đề: Sidebar không bị khóa
- Kiểm tra `btc-auth.js` đã được load chưa
- Kiểm tra `btc-auth.css` đã được load chưa
- Mở Console kiểm tra lỗi JavaScript

### Vấn đề: Role không được lưu
- Kiểm tra localStorage có hoạt động không
- Kiểm tra format JSON trong localStorage
- Clear cache và thử lại

### Vấn đề: Toast không hiển thị
- Kiểm tra `btc-auth.css` đã được load
- Kiểm tra z-index của các element khác
- Kiểm tra Console có lỗi không

## Support

Nếu có vấn đề, kiểm tra:
1. Console log trong browser (F12)
2. Network tab để xem API calls
3. localStorage để xem user info
4. CSS styles được apply đúng chưa

---

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Author**: Development Team
