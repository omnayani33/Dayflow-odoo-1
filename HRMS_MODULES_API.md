# 📊 HRMS Module API Documentation

## Employee Profile & Dashboard Management

---

## 🔐 Profile Management APIs

### 1. Get My Profile
**Endpoint:** `GET /api/auth/profile/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 1,
  "employee_id": "OIODINJODO20260001",
  "full_name": "John Doe",
  "email": "john@odooindia.com",
  "role": "EMPLOYEE",
  "avatar": "/media/avatars/profile.jpg",
  "phone": "9876543210",
  "residential_address": "123 Main St, City",
  "date_of_birth": "1990-01-15",
  "gender": "Male",
  "marital_status": "Single",
  "department": "Engineering",
  "job_title": "Software Developer",
  "location": "Bangalore",
  "about": "Experienced software developer...",
  "skills": ["Python", "Django", "React"],
  "certifications": ["AWS Certified", "Python Expert"]
}
```

**Note:** 
- Employees can only see personal and job info (NO salary/bank details)
- Admins can see ALL fields including salary and bank details

---

### 2. Update Profile
**Endpoint:** `PUT /api/auth/profile/update`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body (Employee):**
```json
{
  "phone": "9876543211",
  "residential_address": "456 New Address",
  "about": "Updated bio...",
  "skills": ["Python", "Django", "React", "PostgreSQL"]
}
```

**Request Body (Admin - Can Update Everything):**
```json
{
  "phone": "9876543211",
  "department": "Engineering",
  "job_title": "Senior Developer",
  "monthly_wage": 75000,
  "bank_name": "HDFC Bank",
  "account_number": "1234567890",
  "ifsc_code": "HDFC0001234"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

**Permissions:**
- **Employee:** Can edit `phone`, `residential_address`, `about`, `skills`, `certifications`
- **Admin/HR:** Can edit ALL fields including salary, bank details, job info

---

## 📈 Dashboard APIs

### 3. Employee Dashboard
**Endpoint:** `GET /api/auth/dashboard/employee`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "employee": {
    "name": "John Doe",
    "employee_id": "OIODINJODO20260001",
    "email": "john@odooindia.com",
    "role": "EMPLOYEE"
  },
  "attendance": {
    "days_present": 18,
    "working_days": 22,
    "attendance_percentage": 81.82,
    "today": {
      "checked_in": true,
      "check_in": "10:00:00",
      "check_out": "19:00:00",
      "status": "PRESENT"
    }
  },
  "leaves": {
    "paid_leave_available": 22,
    "paid_leave_total": 24,
    "sick_leave_available": 6,
    "sick_leave_total": 7,
    "pending_requests": 1
  }
}
```

**Features:**
- Current month attendance summary
- Today's check-in/out status
- Leave balance
- Pending leave requests count

---

### 4. Admin Dashboard
**Endpoint:** `GET /api/auth/dashboard/admin`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "summary": {
    "total_employees": 45,
    "pending_leaves": 3,
    "monthly_attendance_count": 810
  },
  "employees_by_role": [
    {"role": "ADMIN", "count": 2},
    {"role": "HR", "count": 3},
    {"role": "EMPLOYEE", "count": 40}
  ],
  "attendance_today": {
    "PRESENT": 38,
    "ABSENT": 5,
    "LEAVE": 2
  },
  "employee_cards": [
    {
      "employee_id": "OIODINJODO20260001",
      "name": "John Doe",
      "email": "john@odooindia.com",
      "job_title": "Software Developer",
      "avatar": "http://localhost:8000/media/avatars/profile.jpg",
      "status": "PRESENT"
    }
  ]
}
```

**Features:**
- Total employee count
- Pending leaves summary
- Today's attendance overview (Present/Absent/Leave)
- Employee cards with real-time status
- Monthly attendance statistics

**Permissions:** Admin/HR only

---

## ⏰ Attendance Management

### 5. Check In/Out
**Endpoint:** `POST /api/auth/attendance/check`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Check In Request:**
```json
{
  "action": "check_in"
}
```

**Check In Response:**
```json
{
  "message": "Checked in successfully",
  "check_in": "10:00:00"
}
```

**Check Out Request:**
```json
{
  "action": "check_out"
}
```

**Check Out Response:**
```json
{
  "message": "Checked out successfully",
  "check_out": "19:00:00",
  "work_hours": 8.0,
  "extra_hours": 1.0
}
```

**Features:**
- Auto-calculates work hours
- Detects overtime (extra hours)
- One check-in per day
- Status automatically set to PRESENT

**Status Indicators:**
- 🟢 Green: Present (checked in)
- 🔴 Red: Absent
- 🟡 Yellow: On Leave

---

### 6. My Attendance Records
**Endpoint:** `GET /api/auth/attendance/my?month=1&year=2026`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `month`: Month number (1-12)
- `year`: Year (e.g., 2026)

**Response:**
```json
{
  "month": 1,
  "year": 2026,
  "records": [
    {
      "id": 1,
      "employee_name": "John Doe",
      "employee_id": "OIODINJODO20260001",
      "date": "2026-01-03",
      "check_in": "10:00:00",
      "check_out": "19:00:00",
      "work_hours": "8.00",
      "extra_hours": "1.00",
      "status": "PRESENT"
    }
  ]
}
```

---

## 🏖️ Time Off Management

### 7. Request Time Off
**Endpoint:** `GET /api/auth/timeoff/request` (View own requests)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "time_off_requests": [
    {
      "id": 1,
      "employee_name": "John Doe",
      "employee_id": "OIODINJODO20260001",
      "time_off_type": "PAID",
      "start_date": "2026-05-13",
      "end_date": "2026-05-14",
      "total_days": 2,
      "reason": "Personal work",
      "status": "PENDING",
      "approved_by_name": null,
      "created_at": "2026-01-03T10:00:00Z"
    }
  ],
  "allocation": {
    "paid_leave_available": 22,
    "paid_leave_total": 24,
    "sick_leave_available": 6,
    "sick_leave_total": 7
  }
}
```

---

### 8. Submit Time Off Request
**Endpoint:** `POST /api/auth/timeoff/request`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "time_off_type": "PAID",
  "start_date": "2026-05-13",
  "end_date": "2026-05-14",
  "reason": "Family function",
  "attachment": "<file upload - optional>"
}
```

**Time Off Types:**
- `PAID` - Paid Time Off
- `SICK` - Sick Leave
- `UNPAID` - Unpaid Leave

**Response:**
```json
{
  "message": "Time-off request submitted successfully",
  "request": { ... }
}
```

---

### 9. Manage Time Off (Admin/HR)
**Endpoint:** `GET /api/auth/timeoff/manage?status=PENDING`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status`: PENDING, APPROVED, REJECTED (optional)

**Response:**
```json
[
  {
    "id": 1,
    "employee_name": "John Doe",
    "employee_id": "OIODINJODO20260001",
    "time_off_type": "PAID",
    "start_date": "2026-05-13",
    "end_date": "2026-05-14",
    "total_days": 2,
    "status": "PENDING"
  }
]
```

**Permissions:** Admin/HR only

---

### 10. Approve/Reject Time Off
**Endpoint:** `PATCH /api/auth/timeoff/manage/<id>`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Approve Request:**
```json
{
  "action": "approve"
}
```

**Reject Request:**
```json
{
  "action": "reject",
  "reason": "Insufficient leave balance"
}
```

**Response:**
```json
{
  "message": "Time-off request approved",
  "request": { ... }
}
```

**Features:**
- Auto-updates leave allocation
- Records approver and approval time
- Deducts from leave balance on approval

**Permissions:** Admin/HR only

---

## 📊 Salary Information (Admin Only)

The profile includes comprehensive salary management:

### Salary Components (Auto-calculated):
- **Basic Salary**: 50% of monthly wage
- **HRA**: 50% of basic salary
- **Standard Allowance**: 16.67% of monthly wage
- **Performance Bonus**: 8.33% of monthly wage
- **Leave Travel Allowance**: 8.33% of monthly wage
- **Fixed Allowance**: 11.67% of monthly wage

### Tax Deductions:
- **Professional Tax**: ₹200/month
- **PF Employee Contribution**: 12% of basic salary
- **PF Employer Contribution**: 12% of basic salary

### Example:
If Monthly Wage = ₹50,000:
- Basic Salary = ₹25,000
- HRA = ₹12,500
- Standard Allowance = ₹8,335
- Performance Bonus = ₹4,165
- LTA = ₹4,165
- Fixed Allowance = ₹5,835

---

## 🎯 Profile Tabs (Based on Wireframe)

### 1. Resume Tab
- About section
- Skills list
- Certifications list
- Editable by employee

### 2. Private Info Tab
- Personal details (DOB, gender, marital status)
- Contact information
- Bank details (Admin only)
- Editable fields vary by role

### 3. Salary Info Tab (Admin Only)
- Monthly/Yearly wage
- Salary components breakdown
- PF contributions
- Tax deductions
- Working hours configuration

### 4. Security Tab
- Change password functionality
- Already implemented in auth module

---

## 🔒 Role-Based Access Summary

| Feature | Employee | Admin/HR |
|---------|----------|----------|
| View own profile | ✅ | ✅ |
| Edit phone/address | ✅ | ✅ |
| View salary details | ❌ | ✅ |
| Edit salary | ❌ | ✅ |
| View bank details | ❌ | ✅ |
| Employee dashboard | ✅ | ✅ |
| Admin dashboard | ❌ | ✅ |
| Check in/out | ✅ | ✅ |
| View own attendance | ✅ | ✅ |
| Request time off | ✅ | ✅ |
| Approve/reject leaves | ❌ | ✅ |
| View all employees | ❌ | ✅ |

---

## 💻 Frontend Integration Examples

### Get Employee Dashboard
```javascript
const getEmployeeDashboard = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/dashboard/employee', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Check In
```javascript
const checkIn = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/attendance/check', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'check_in' })
  });
  return await response.json();
};
```

### Request Time Off
```javascript
const requestTimeOff = async (data) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/timeoff/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      time_off_type: data.type,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason
    })
  });
  return await response.json();
};
```

---

## 📝 Complete API Endpoint List

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/profile/me` | Get my profile | Yes |
| PUT | `/api/auth/profile/update` | Update profile | Yes |
| GET | `/api/auth/dashboard/employee` | Employee dashboard | Yes |
| GET | `/api/auth/dashboard/admin` | Admin dashboard | Admin |
| POST | `/api/auth/attendance/check` | Check in/out | Yes |
| GET | `/api/auth/attendance/my` | My attendance | Yes |
| GET | `/api/auth/timeoff/request` | My time-off requests | Yes |
| POST | `/api/auth/timeoff/request` | Submit time-off | Yes |
| GET | `/api/auth/timeoff/manage` | All time-off requests | Admin |
| PATCH | `/api/auth/timeoff/manage/<id>` | Approve/reject | Admin |

---

## 🎨 Status Indicators (From Wireframe)

- 🟢 **Green Dot**: Employee is present (checked in)
- 🟡 **Yellow Dot**: Employee is on leave
- 🔴 **Red Dot**: Employee is absent (not checked in/applied time off)

---

✅ All modules are now complete and ready for frontend integration!
