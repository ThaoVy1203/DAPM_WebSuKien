# Cập nhật Phân quyền BTC - Version 2

## Ngày: 2024-12-30 (Cập nhật lần 2)

### 🎯 Các thay đổi mới:

#### 1. **Dashboard - Khóa nút và card cho Thành viên BTC**

**Đã khóa:**
- ❌ Nút "Gửi báo cáo" (header-actions)
- ❌ Nút "Gửi phê duyệt ngân sách" (header-actions)
- ❌ Toàn bộ card "Yêu cầu cần Phê duyệt" (approval-card)

**Kết quả:**
- Thành viên BTC chỉ xem được thống kê và danh sách công việc
- Không thể gửi báo cáo hoặc yêu cầu phê duyệt
- Card phê duyệt bị ẩn hoàn toàn

---

#### 2. **Trang Sự kiện - Khóa nút Hủy**

**Đã khóa:**
- ❌ Nút "Hủy sự kiện" / "Cancel Event"
- ❌ Nút "Xóa sự kiện" / "Delete Event"
- ❌ Tất cả nút có class `.btn-cancel-event`

**Kết quả:**
- Thành viên BTC chỉ có thể xem danh sách và chi tiết
- Không thể hủy hoặc xóa sự kiện
- Chỉ hiển thị nút "Xem chi tiết"

---

#### 3. **Trang Công việc (Task) - Thay đổi lớn**

##### 3.1. Khóa nút "Thêm Nhiệm vụ Mới"
**Đã khóa:**
- ❌ Nút "Thêm Nhiệm vụ Mới" trong page header
- ❌ Tất cả nút tạo task khác

**Kết quả:**
- Thành viên không thể tạo task mới
- Chỉ có thể xem và cập nhật task được giao

##### 3.2. Thay nút "Chỉnh sửa" thành "Cập nhật trạng thái"
**Trước:**
- Nút "Chỉnh sửa" trong task card

**Sau:**
- Nút "Cập nhật trạng thái" với icon sync
- Click vào mở modal cập nhật trạng thái cho task cụ thể
- Không mở modal chỉnh sửa đầy đủ

##### 3.3. Khóa các trường trong modal Chỉnh sửa
**Khi Thành viên BTC mở modal chỉnh sửa task:**

**Bị khóa (disabled):**
- ❌ Tiêu đề nhiệm vụ (input text)
- ❌ Mô tả (textarea - trừ ghi chú)
- ❌ Người phụ trách (select)
- ❌ Hạn chót (input date)
- ❌ Độ ưu tiên (select)
- ❌ Tất cả các trường khác

**Được phép chỉnh sửa:**
- ✅ Trạng thái (select/combobox)
- ✅ Tiến độ (%) (input number)
- ✅ Ghi chú (textarea)

**Giao diện:**
- Các trường bị khóa có background màu xám (#F3F4F6)
- Cursor: not-allowed
- Opacity: 0.6
- Thông báo vàng ở đầu modal: "Bạn chỉ có thể cập nhật trạng thái và ghi chú"

##### 3.4. Modal title thay đổi
**Trước:** "Chỉnh sửa nhiệm vụ"  
**Sau:** "Cập nhật Trạng thái Nhiệm vụ"

##### 3.5. Nút trong modal footer
**Bị ẩn:**
- ❌ Nút "Xóa" / "Delete"

**Thay đổi text:**
- "Lưu" → "Cập nhật trạng thái"

---

### 📋 Tóm tắt quyền Thành viên BTC:

| Trang | Xem | Tạo | Sửa | Xóa | Hủy | Ghi chú |
|-------|-----|-----|-----|-----|-----|---------|
| Dashboard | ✅ | ❌ | ❌ | ❌ | ❌ | Không gửi báo cáo/phê duyệt |
| Sự kiện | ✅ | ❌ | ❌ | ❌ | ❌ | Chỉ xem danh sách và chi tiết |
| Công việc | ✅ | ❌ | ⚠️ | ❌ | ❌ | Chỉ cập nhật trạng thái & ghi chú |
| Ngân sách | ❌ | ❌ | ❌ | ❌ | ❌ | Không truy cập |
| Phê duyệt | ❌ | ❌ | ❌ | ❌ | ❌ | Không truy cập |
| Người tham gia | ❌ | ❌ | ❌ | ❌ | ❌ | Không truy cập |
| Báo cáo | ❌ | ❌ | ❌ | ❌ | ❌ | Không truy cập |

⚠️ = Chỉ cập nhật trạng thái và ghi chú, không sửa thông tin khác

---

### 🔧 Thay đổi kỹ thuật:

#### Files đã cập nhật:

1. **FE/js/btc-auth.js**
   - Cập nhật `hideRestrictedActions()`:
     - Thêm logic cho Dashboard (ẩn nút header, ẩn approval card)
     - Thêm logic cho Events (ẩn nút hủy)
     - Cập nhật logic cho Tasks (thay nút chỉnh sửa, ẩn nút thêm)
   - Thêm hàm `interceptTaskEditModal()`:
     - Sử dụng MutationObserver để theo dõi modal
     - Tự động khóa các trường khi modal mở
   - Thêm hàm `lockTaskModalFields(modal)`:
     - Khóa tất cả input/select/textarea trừ status và notes
     - Thay đổi modal title
     - Ẩn nút xóa
     - Thêm notice vàng
   - Thêm hàm `openTaskStatusUpdateModalForTask(taskId)`:
     - Mở modal cập nhật cho task cụ thể
     - Không cần chọn task từ dropdown

2. **FE/css/btc-auth.css**
   - Thêm style `.member-edit-notice` (notice trong modal)
   - Thêm style cho disabled fields
   - Thêm style `.btn-update-status`

---

### 🧪 Test Cases:

#### Test 1: Dashboard - Thành viên BTC
1. Login với vai trò Thành viên BTC
2. Vào Dashboard
3. Kiểm tra:
   - ✅ Nút "Gửi báo cáo" bị ẩn
   - ✅ Nút "Gửi phê duyệt ngân sách" bị ẩn
   - ✅ Card "Yêu cầu cần Phê duyệt" bị ẩn
   - ✅ Vẫn xem được stats và task list

#### Test 2: Sự kiện - Thành viên BTC
1. Login với vai trò Thành viên BTC
2. Vào trang "Sự kiện của tôi"
3. Kiểm tra:
   - ✅ Thông báo vàng hiển thị
   - ✅ Nút "Tạo sự kiện mới" bị ẩn
   - ✅ Nút "Sửa" trong card bị ẩn
   - ✅ Nút "Hủy" trong card bị ẩn
   - ✅ Nút "Xem chi tiết" vẫn hiển thị

#### Test 3: Công việc - Thành viên BTC
1. Login với vai trò Thành viên BTC
2. Vào trang "Công việc (Task)"
3. Kiểm tra:
   - ✅ Thông báo vàng hiển thị
   - ✅ Nút "Thêm Nhiệm vụ Mới" (header) bị ẩn
   - ✅ Nút sidebar đổi thành "Cập nhật trạng thái công việc"
   - ✅ Nút "Chỉnh sửa" trong card đổi thành "Cập nhật trạng thái"

#### Test 4: Modal Cập nhật Task - Thành viên BTC
1. Login với vai trò Thành viên BTC
2. Vào trang "Công việc (Task)"
3. Click nút "Cập nhật trạng thái" trong task card
4. Kiểm tra modal:
   - ✅ Title: "Cập nhật Trạng thái Nhiệm vụ"
   - ✅ Thông báo vàng ở đầu modal
   - ✅ Tiêu đề task bị khóa (disabled)
   - ✅ Mô tả bị khóa
   - ✅ Người phụ trách bị khóa
   - ✅ Hạn chót bị khóa
   - ✅ Độ ưu tiên bị khóa
   - ✅ Trạng thái KHÔNG bị khóa (có thể chọn)
   - ✅ Tiến độ KHÔNG bị khóa (có thể nhập)
   - ✅ Ghi chú KHÔNG bị khóa (có thể nhập)
   - ✅ Nút "Xóa" bị ẩn
   - ✅ Nút "Lưu" đổi thành "Cập nhật trạng thái"

#### Test 5: Trưởng BTC không bị ảnh hưởng
1. Login với vai trò Trưởng BTC
2. Kiểm tra tất cả trang:
   - ✅ Dashboard: Tất cả nút và card hiển thị
   - ✅ Sự kiện: Tất cả nút hiển thị
   - ✅ Công việc: Nút "Tạo nhiệm vụ mới" hiển thị
   - ✅ Modal chỉnh sửa: Tất cả trường có thể chỉnh sửa
   - ✅ Không có thông báo vàng

---

### 🔐 Backend Requirements:

#### 1. API kiểm tra quyền cập nhật task
```
PUT /api/tasks/{taskId}/status
Headers: Authorization: Bearer {token}
Body: {
  status: "completed",
  progress: 100,
  notes: "Đã hoàn thành"
}

Response:
- 200: Success
- 403: Forbidden (không phải task của user)
- 404: Task not found
```

Backend phải:
- Kiểm tra user có quyền cập nhật task này không
- Chỉ cho phép cập nhật status, progress, notes
- Không cho phép cập nhật title, description, assignee, deadline, priority

#### 2. API validation
```javascript
// Backend validation
if (userRole === 'thanh_vien_btc') {
  // Only allow updating these fields
  const allowedFields = ['status', 'progress', 'notes'];
  
  // Check if task is assigned to this user
  if (task.assignedTo !== userId) {
    return 403; // Forbidden
  }
  
  // Only update allowed fields
  task.status = body.status;
  task.progress = body.progress;
  task.notes = body.notes;
  // Ignore other fields
}
```

---

### 📝 Migration Notes:

- Không có breaking changes
- Tất cả thay đổi đều backward compatible
- Clear browser cache để load JS/CSS mới
- Không cần thay đổi database

---

### 🐛 Known Issues:

1. **MutationObserver có thể miss modal nếu load quá nhanh**
   - Solution: Thêm setTimeout để check existing modals

2. **Nếu modal được tạo bằng cách khác (không append vào body)**
   - Solution: Observer cũng watch subtree

3. **Disabled fields vẫn có thể submit qua console**
   - Solution: Backend PHẢI validate quyền

---

### ✅ Checklist hoàn thành:

- [x] Dashboard: Khóa nút "Gửi báo cáo"
- [x] Dashboard: Khóa nút "Gửi phê duyệt ngân sách"
- [x] Dashboard: Ẩn card "Yêu cầu cần Phê duyệt"
- [x] Sự kiện: Khóa nút "Hủy"
- [x] Công việc: Khóa nút "Thêm Nhiệm vụ Mới"
- [x] Công việc: Thay nút "Chỉnh sửa" thành "Cập nhật trạng thái"
- [x] Modal: Khóa tất cả textbox trừ ghi chú
- [x] Modal: Chỉ cho phép chọn trạng thái
- [x] Modal: Thêm thông báo vàng
- [x] CSS: Style cho disabled fields
- [x] Testing: Tất cả test cases pass

---

**Version**: 1.2.0  
**Previous Version**: 1.1.0  
**Author**: Development Team  
**Date**: 2024-12-30
