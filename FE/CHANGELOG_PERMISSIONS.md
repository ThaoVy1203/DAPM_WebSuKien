# Changelog - Cập nhật Phân quyền BTC

## Ngày: 2024-12-30

### Thay đổi chính:

#### 1. Thành viên BTC có thể xem Sự kiện
**Trước đây:**
- ❌ Thành viên BTC không thể truy cập tab "Sự kiện của tôi"
- Tab bị khóa hoàn toàn

**Bây giờ:**
- ✅ Thành viên BTC có thể truy cập tab "Sự kiện của tôi"
- ✅ Có thể xem danh sách tất cả sự kiện
- ✅ Có thể xem chi tiết từng sự kiện
- ❌ KHÔNG thể tạo sự kiện mới
- ❌ KHÔNG thể sửa sự kiện
- ❌ KHÔNG thể xóa/hủy sự kiện

**Giao diện:**
- Hiển thị thông báo vàng: "Bạn chỉ có quyền xem danh sách và chi tiết sự kiện. Không thể tạo, sửa hoặc xóa sự kiện."
- Nút "Tạo sự kiện mới" bị ẩn
- Nút "Sửa" và "Xóa" trong các card sự kiện bị ẩn
- Chỉ hiển thị nút "Xem chi tiết"

#### 2. Thay đổi nút trong trang Công việc (Task)
**Trước đây:**
- Nút "Tạo nhiệm vụ mới" hiển thị cho cả Trưởng BTC và Thành viên
- Thành viên không thể tạo task nhưng nút vẫn hiển thị

**Bây giờ:**
- **Trưởng BTC**: Vẫn hiển thị nút "Tạo nhiệm vụ mới" (không đổi)
- **Thành viên BTC**: Nút đổi thành "Cập nhật trạng thái công việc"
  - Click vào sẽ mở modal cập nhật trạng thái
  - Chọn công việc được giao
  - Chọn trạng thái mới (Đang làm, Đang thực hiện, Chờ duyệt, Hoàn thành)
  - Cập nhật tiến độ (%)
  - Thêm ghi chú

**Giao diện:**
- Hiển thị thông báo vàng: "Bạn chỉ có thể xem và cập nhật trạng thái các công việc được giao cho mình."
- Modal cập nhật trạng thái với form đơn giản
- Dropdown chỉ hiển thị các task được giao cho thành viên đó

### Files đã thay đổi:

1. **FE/js/btc-auth.js**
   - Cập nhật `PERMISSIONS[BTC_ROLES.MEMBER].canAccessEvents = true`
   - Thêm `canUpdateTaskStatus: true`
   - Cập nhật hàm `hideRestrictedActions()` với logic đặc biệt cho:
     - Trang sự kiện: Ẩn nút tạo/sửa/xóa, hiển thị notice
     - Trang công việc: Thay đổi nút, hiển thị notice
   - Thêm hàm `showMemberViewNotice()`
   - Thêm hàm `openTaskStatusUpdateModal()`
   - Thêm hàm `closeTaskStatusUpdateModal()`
   - Thêm hàm `submitTaskStatusUpdate()`

2. **FE/css/btc-auth.css**
   - Thêm style cho `.member-view-notice` (màu vàng)
   - Thêm style cho `#taskStatusUpdateModal`
   - Style cho form elements trong modal

3. **FE/pages/btc-role-switcher.html**
   - Cập nhật mô tả vai trò Thành viên BTC
   - Cập nhật danh sách quyền trong `memberPermissions`

4. **FE/BTC_AUTHORIZATION_README.md**
   - Cập nhật phần mô tả quyền của Thành viên BTC

### Cách test:

#### Test 1: Thành viên xem Sự kiện
1. Mở `btc-role-switcher.html`
2. Chọn "Thành viên Ban Tổ chức"
3. Click "Vào Dashboard"
4. Click vào tab "Sự kiện của tôi" trong sidebar
5. Kiểm tra:
   - ✅ Tab có thể click (không bị khóa)
   - ✅ Hiển thị thông báo vàng ở đầu trang
   - ✅ Nút "Tạo sự kiện mới" bị ẩn
   - ✅ Nút "Sửa" và "Xóa" trong card sự kiện bị ẩn
   - ✅ Có thể click "Xem chi tiết" để xem thông tin sự kiện

#### Test 2: Thành viên cập nhật trạng thái Task
1. Mở `btc-role-switcher.html`
2. Chọn "Thành viên Ban Tổ chức"
3. Click "Vào Dashboard"
4. Click vào tab "Công việc (Task)" trong sidebar
5. Kiểm tra:
   - ✅ Hiển thị thông báo vàng ở đầu trang
   - ✅ Nút "Tạo sự kiện mới" đổi thành "Cập nhật trạng thái công việc"
   - ✅ Click nút sẽ mở modal cập nhật trạng thái
   - ✅ Modal có dropdown chọn công việc
   - ✅ Modal có dropdown chọn trạng thái mới
   - ✅ Modal có input tiến độ (%)
   - ✅ Modal có textarea ghi chú
   - ✅ Click "Cập nhật" sẽ submit form

#### Test 3: Trưởng BTC không bị ảnh hưởng
1. Mở `btc-role-switcher.html`
2. Chọn "Trưởng Ban Tổ chức"
3. Click "Vào Dashboard"
4. Kiểm tra:
   - ✅ Tất cả tab có thể truy cập
   - ✅ Trang Sự kiện: Nút "Tạo sự kiện mới" vẫn hiển thị
   - ✅ Trang Công việc: Nút "Tạo nhiệm vụ mới" vẫn hiển thị
   - ✅ Không có thông báo vàng
   - ✅ Tất cả nút Sửa/Xóa vẫn hiển thị

### Lưu ý khi tích hợp Backend:

1. **API lọc sự kiện cho Thành viên:**
   ```
   GET /api/events?userId={userId}&role=member
   ```
   - Nên trả về tất cả sự kiện (hoặc chỉ sự kiện được phân công)
   - Frontend sẽ ẩn các nút hành động

2. **API cập nhật trạng thái task:**
   ```
   PUT /api/tasks/{taskId}/status
   Body: {
     status: "completed",
     progress: 100,
     notes: "Đã hoàn thành công việc"
   }
   ```
   - Backend phải kiểm tra user có quyền cập nhật task này không
   - Chỉ cho phép cập nhật task được giao cho user đó

3. **API lấy danh sách task được giao:**
   ```
   GET /api/tasks/assigned?userId={userId}
   ```
   - Trả về danh sách task được giao cho user
   - Dùng để populate dropdown trong modal cập nhật trạng thái

### Breaking Changes:
- Không có breaking changes
- Tất cả thay đổi đều backward compatible
- Trưởng BTC không bị ảnh hưởng

### Migration Guide:
- Không cần migration
- Chỉ cần clear cache browser để load CSS/JS mới

---

**Version**: 1.1.0  
**Previous Version**: 1.0.0  
**Author**: Development Team
