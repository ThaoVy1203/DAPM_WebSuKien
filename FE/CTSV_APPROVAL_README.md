# CTSV Approval System Documentation

## Overview
The CTSV (Phòng Công tác Sinh viên) Approval System is designed for university staff to review and approve event proposals submitted by organizing committees (Ban Tổ chức).

## System Architecture

### Pages
1. **ctsv-pending-approval.html** - Main approval page (Chờ duyệt)
2. **ctsv-approval-history.html** - Approval history page (Lịch sử duyệt)
3. **ctsv-reports.html** - Reports and statistics page (Báo cáo)

### User Role
- **Cán bộ phê duyệt cấp 1** (Level 1 Approval Officer)
  - Name: Nguyễn Thị Mai
  - Responsibilities: Review and approve/reject event proposals

## Features

### 1. Pending Approval Page (ctsv-pending-approval.html)

#### Statistics Dashboard
- **Chờ duyệt** (Pending): 12 items (+3 new)
- **Khẩn cấp** (Urgent): 3 items requiring approval within 24h
- **Đã duyệt** (Approved): 45 items this month
- **Từ chối** (Rejected): 8 items requiring revision

#### Filter System
**Priority Tabs:**
- Tất cả (All) - 12 items
- Khẩn cấp (Urgent) - 3 items
- Bình thường (Normal) - 7 items
- Không khẩn (Low) - 2 items

**Dropdown Filters:**
- Event Type: Hội thảo, Workshop, Thi đấu, Văn nghệ
- Date Range: Today, This week, This month

#### Approval Items
Each approval item displays:
- Priority badge (Urgent/Normal/Low)
- Approval ID (e.g., #HS2024-001)
- Submission date and time
- Deadline countdown
- Event name
- Sender information (Name and role)
- Event date
- Scale (number of participants)
- Budget amount
- Description
- Attached documents (PDF, Excel, Word)

**Action Buttons:**
- **Xem chi tiết** (View Detail) - Opens detailed view modal
- **Từ chối** (Reject) - Opens rejection modal
- **Phê duyệt** (Approve) - Opens approval modal

#### View Detail Modal
Displays complete event information:
- Event name and priority badge
- Approval ID
- Sender information
- Submission date
- Event date
- Approval deadline
- Scale (participants)
- Budget
- Location
- Event type
- Event description
- Objectives (bullet points)
- Schedule (timeline)
- Attached documents with download buttons

**Modal Actions:**
- **Đóng** (Close) - Close modal
- **Từ chối** (Reject) - Reject from detail view
- **Phê duyệt** (Approve) - Approve from detail view

#### Approve Modal
Features:
- Success icon and confirmation message
- Event name display
- Optional approval comment textarea
- Checkbox: "Gửi thông báo cho Ban Tổ chức" (Notify organizer)
- Cancel and Confirm buttons

#### Reject Modal
Features:
- Error icon and confirmation message
- Event name display
- **Required** rejection reason textarea
- Optional revision suggestions textarea
- Checkbox: "Cho phép gửi lại hồ sơ sau khi chỉnh sửa" (Allow resubmission)
- Cancel and Confirm buttons

#### Header Actions
- **Xuất danh sách** (Export List) - Export pending approvals
- **Duyệt hàng loạt** (Bulk Approve) - Approve multiple items

### 2. Approval History Page (ctsv-approval-history.html)
- Status: Coming soon
- Will display all approved and rejected items
- Export functionality for reports

### 3. Reports Page (ctsv-reports.html)
- Status: Coming soon
- Will display statistics and analytics
- Generate PDF reports

## Design System

### Color Scheme
- **Primary Color**: #059669 (Green)
- **Success**: #10B981
- **Danger**: #EF4444
- **Warning**: #F59E0B
- **Info**: #3B82F6
- **Gray Scale**: #1A1A1A, #6B7280, #9CA3AF, #E5E7EB, #F3F4F6

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Components

#### Stat Cards
- Grid layout: 4 columns
- Responsive: 2 columns on tablet, 1 column on mobile
- Icons with color coding
- Number display with labels
- Description text

#### Approval Items
- White background with shadow
- Left border color indicates priority
- Hover effect: lift and shadow
- Urgent items have red gradient background

#### Badges
- Rounded pill shape
- Color coded by priority:
  - Urgent: Red (#FEE2E2 bg, #DC2626 text)
  - Normal: Blue (#DBEAFE bg, #1E40AF text)
  - Low: Gray (#F3F4F6 bg, #6B7280 text)

#### Buttons
- **Primary**: Green background, white text
- **Secondary**: White background, gray border
- **Danger**: Red background/border
- **View**: Gray background
- Hover effects: color change, lift, shadow

#### Modals
- Centered overlay with backdrop
- Slide-in animation
- Max width: 600px (standard), 900px (large)
- Scrollable content
- Close on backdrop click or ESC key

## JavaScript Functions

### Core Functions
```javascript
// Filter and display
initializeFilterTabs()
initializeFilters()
applyFilters()

// Export and bulk actions
exportPendingList()
openBulkApprovalModal()

// View detail
viewApprovalDetail(approvalId)
closeViewDetailModal()
getDetailApprovalInfo(approvalId)

// Approve workflow
openApproveModal(approvalId)
closeApproveModal()
confirmApprove()
approveFromDetail()

// Reject workflow
openRejectModal(approvalId)
closeRejectModal()
confirmReject()
rejectFromDetail()

// Utility
getApprovalInfo(approvalId)
removeApprovalItem(approvalId)
updateStats()
```

### Event Handlers
- Tab button clicks for filtering
- Dropdown change events
- Modal backdrop clicks
- ESC key for closing modals
- Form submissions with validation

## Mock Data

### Sample Approval Items
1. **Hội thảo Công nghệ AI và Ứng dụng 2024**
   - Priority: Urgent
   - ID: #HS2024-001
   - Budget: 150,000,000 đ
   - Scale: 500 people
   - Deadline: 8 hours

2. **Workshop Khởi nghiệp cho Sinh viên**
   - Priority: Normal
   - ID: #HS2024-002
   - Budget: 50,000,000 đ
   - Scale: 200 people
   - Deadline: 2 days

3. **Giải Bóng đá Sinh viên Khoa CNTT**
   - Priority: Urgent
   - ID: #HS2024-003
   - Budget: 30,000,000 đ
   - Scale: 16 teams
   - Deadline: 12 hours

4. **Đêm Nhạc Acoustic "Thanh Xuân"**
   - Priority: Normal
   - ID: #HS2024-004
   - Budget: 40,000,000 đ
   - Scale: 300 people
   - Deadline: 3 days

## Responsive Design

### Breakpoints
- **Desktop**: > 1200px (4 stat cards)
- **Tablet**: 768px - 1200px (2 stat cards)
- **Mobile**: < 768px (1 stat card, stacked layout)

### Mobile Optimizations
- Stacked approval items
- Full-width buttons
- Simplified meta information
- Collapsible sections

## Integration Points

### Backend API Endpoints (To be implemented)
```
GET  /api/ctsv/approvals/pending      - Get pending approvals
GET  /api/ctsv/approvals/:id          - Get approval detail
POST /api/ctsv/approvals/:id/approve  - Approve an item
POST /api/ctsv/approvals/:id/reject   - Reject an item
GET  /api/ctsv/approvals/history      - Get approval history
GET  /api/ctsv/approvals/stats        - Get statistics
POST /api/ctsv/approvals/export       - Export list
POST /api/ctsv/approvals/bulk-approve - Bulk approve
```

### Request/Response Format
```json
// Approve Request
{
  "approvalId": "HS2024-001",
  "comment": "Approved with conditions",
  "notifyOrganizer": true
}

// Reject Request
{
  "approvalId": "HS2024-001",
  "reason": "Budget exceeds limit",
  "suggestion": "Please revise budget to 100M",
  "allowResubmit": true
}

// Response
{
  "success": true,
  "message": "Approval processed successfully",
  "data": {
    "approvalId": "HS2024-001",
    "status": "approved",
    "processedAt": "2024-12-30T10:30:00Z"
  }
}
```

## File Structure
```
FE/
├── pages/
│   ├── ctsv-pending-approval.html
│   ├── ctsv-approval-history.html
│   └── ctsv-reports.html
├── css/
│   ├── btc-dashboard.css (shared)
│   └── ctsv-approval.css
├── js/
│   └── ctsv-approval.js
└── images/
    ├── logo.png
    ├── avatar-ctsv.jpg
    └── map.png
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility
- Semantic HTML5 elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Future Enhancements
1. Real-time notifications for new approvals
2. Advanced filtering and search
3. Approval workflow with multiple levels
4. Document preview in modal
5. Approval history timeline
6. Email notifications
7. Mobile app integration
8. Analytics dashboard
9. Automated approval rules
10. Integration with calendar system

## Testing Checklist
- [ ] Filter tabs work correctly
- [ ] Dropdown filters apply properly
- [ ] View detail modal displays all information
- [ ] Approve modal validates and submits
- [ ] Reject modal requires reason field
- [ ] Modals close on backdrop click
- [ ] ESC key closes modals
- [ ] Stats update after approval/rejection
- [ ] Items removed from list after processing
- [ ] Export functionality works
- [ ] Responsive design on all devices
- [ ] All buttons have proper hover states
- [ ] Documents can be downloaded
- [ ] Pagination works correctly

## Notes
- All frontend permissions are UI/UX only
- Backend MUST validate all permissions and actions
- Mock data is used for demonstration
- API integration required for production
- Document upload/download needs backend implementation
- Notification system needs backend support

## Version History
- **v1.0** (2024-12-30): Initial release with pending approval page
  - View detail modal
  - Approve/reject functionality
  - Filter system
  - Statistics dashboard
  - Responsive design
