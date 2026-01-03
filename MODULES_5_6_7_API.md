# 📊 Modules 5, 6, 7 - Complete API Documentation

## Module 5: Attendance Management APIs ✅

### Overview
Complete attendance tracking system with check-in/check-out, status management, and admin oversight.

---

### 1. Check In
**Endpoint:** `POST /api/auth/attendance/checkin` or `POST /api/auth/attendance/check`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "action": "check_in"
}
```

**Response:**
```json
{
  "message": "Checked in successfully",
  "check_in": "09:00:00"
}
```

**Features:**
- Automatically creates attendance record for today
- Records check-in time
- Sets status to PRESENT

---

### 2. Check Out
**Endpoint:** `POST /api/auth/attendance/checkout` or `POST /api/auth/attendance/check`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "action": "check_out"
}
```

**Response:**
```json
{
  "message": "Checked out successfully",
  "check_out": "18:00:00",
  "work_hours": 8.0,
  "extra_hours": 1.0
}
```

**Features:**
- Auto-calculates work hours (standard 8 hours)
- Calculates overtime (extra_hours)
- Updates attendance record

---

### 3. Get My Attendance
**Endpoint:** `GET /api/auth/attendance/my?month=1&year=2026`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `month` (optional): Month number (1-12), defaults to current month
- `year` (optional): Year, defaults to current year

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
      "check_in": "09:00:00",
      "check_out": "18:00:00",
      "work_hours": "8.00",
      "extra_hours": "1.00",
      "status": "PRESENT",
      "notes": ""
    }
  ]
}
```

**Permissions:** Employee sees only their own attendance

---

### 4. Get All Attendance (Admin)
**Endpoint:** `GET /api/auth/attendance?month=1&year=2026&status=PRESENT&employee_id=OIODINJODO20260001`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `month` (optional): Month number (1-12)
- `year` (optional): Year
- `status` (optional): Filter by status (PRESENT, ABSENT, HALF_DAY, LEAVE)
- `employee_id` (optional): Filter by specific employee

**Response:**
```json
{
  "month": 1,
  "year": 2026,
  "summary": {
    "total": 150,
    "present": 120,
    "absent": 10,
    "half_day": 5,
    "on_leave": 15
  },
  "records": [...]
}
```

**Permissions:** Admin/HR only

---

### Attendance Status Values

| Status | Description |
|--------|-------------|
| **PRESENT** | Employee checked in and completed work |
| **ABSENT** | Employee did not check in |
| **HALF_DAY** | Employee worked partial day |
| **LEAVE** | Employee on approved leave |

---

## Module 6: Leave Management APIs ✅

### Overview
Complete leave request and approval system with automatic attendance updates.

---

### 1. Apply for Leave
**Endpoint:** `POST /api/auth/leave/apply` or `POST /api/auth/timeoff/request`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "time_off_type": "PAID",
  "start_date": "2026-05-13",
  "end_date": "2026-05-15",
  "reason": "Family vacation",
  "attachment": "<file upload - optional>"
}
```

**Leave Types:**
- `PAID` - Paid Time Off
- `SICK` - Sick Leave
- `UNPAID` - Unpaid Leave

**Response:**
```json
{
  "message": "Time-off request submitted successfully",
  "request": {
    "id": 1,
    "employee_name": "John Doe",
    "time_off_type": "PAID",
    "start_date": "2026-05-13",
    "end_date": "2026-05-15",
    "total_days": 3,
    "status": "PENDING",
    "reason": "Family vacation",
    "created_at": "2026-01-03T10:00:00Z"
  }
}
```

**Features:**
- Auto-calculates total days
- Checks leave balance
- Creates PENDING request for admin approval

---

### 2. Get My Leave Requests
**Endpoint:** `GET /api/auth/leave/my` or `GET /api/auth/timeoff/request`

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
      "time_off_type": "PAID",
      "start_date": "2026-05-13",
      "end_date": "2026-05-15",
      "total_days": 3,
      "status": "PENDING",
      "reason": "Family vacation"
    }
  ],
  "allocation": {
    "paid_leave_available": 21,
    "paid_leave_total": 24,
    "sick_leave_available": 6,
    "sick_leave_total": 7
  }
}
```

---

### 3. Get All Leave Requests (Admin)
**Endpoint:** `GET /api/auth/leave/all?status=PENDING` or `GET /api/auth/timeoff/manage?status=PENDING`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by PENDING, APPROVED, or REJECTED

**Response:**
```json
[
  {
    "id": 1,
    "employee_name": "John Doe",
    "employee_id": "OIODINJODO20260001",
    "time_off_type": "PAID",
    "start_date": "2026-05-13",
    "end_date": "2026-05-15",
    "total_days": 3,
    "status": "PENDING",
    "reason": "Family vacation",
    "created_at": "2026-01-03T10:00:00Z"
  }
]
```

**Permissions:** Admin/HR only

---

### 4. Approve/Reject Leave
**Endpoint:** `POST /api/auth/leave/approve` or `PATCH /api/auth/timeoff/manage/<id>`

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
  "admin_comment": "Insufficient leave balance"
}
```

**Response:**
```json
{
  "message": "Time-off request approved",
  "request": {
    "id": 1,
    "status": "APPROVED",
    "approved_by": "Admin Name",
    "approved_at": "2026-01-03T11:00:00Z"
  }
}
```

**Auto-Update Features:**
- ✅ Approved leave updates leave allocation (deducts days)
- ✅ Automatically creates attendance records with status "LEAVE" for approved dates
- ✅ Updates employee's leave balance
- ✅ Records approver and approval time

**Permissions:** Admin/HR only

---

## Module 7: Reporting APIs 🆕

### Overview
Comprehensive reporting system with JSON and CSV export for attendance, payroll, and leave data.

---

### 1. Attendance Report
**Endpoint:** `GET /api/auth/reports/attendance`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD), defaults to first day of current month
- `end_date` (optional): End date (YYYY-MM-DD), defaults to today
- `employee_id` (optional): Filter by specific employee
- `department` (optional): Filter by department

**Response:**
```json
{
  "report_period": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31"
  },
  "overall_statistics": {
    "total_employees": 45,
    "total_records": 990,
    "total_present": 850,
    "total_absent": 50,
    "total_half_day": 30,
    "total_leave": 60,
    "average_work_hours": 8.2
  },
  "employee_statistics": [
    {
      "employee_id": "OIODINJODO20260001",
      "employee_name": "John Doe",
      "email": "john@odooindia.com",
      "department": "Engineering",
      "total_days": 22,
      "present": 18,
      "absent": 1,
      "half_day": 1,
      "on_leave": 2,
      "total_work_hours": 144.5,
      "total_extra_hours": 12.0,
      "attendance_percentage": 95.45
    }
  ]
}
```

**Features:**
- Date range filtering
- Department-wise filtering
- Employee-wise statistics
- Attendance percentage calculation
- Work hours and overtime tracking

**Permissions:** Admin/HR only

---

### 2. Attendance Report CSV Export
**Endpoint:** `GET /api/auth/reports/attendance/csv`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:** Same as attendance report

**Response:** CSV file download
```csv
Employee ID,Employee Name,Email,Department,Date,Check In,Check Out,Work Hours,Extra Hours,Status,Notes
OIODINJODO20260001,John Doe,john@odooindia.com,Engineering,2026-01-03,09:00:00,18:00:00,8.00,1.00,Present,
```

**File Name:** `attendance_report_2026-01-01_to_2026-01-31.csv`

**Permissions:** Admin/HR only

---

### 3. Payroll Report
**Endpoint:** `GET /api/auth/reports/payroll`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `month` (optional): Month number (1-12), defaults to current month
- `year` (optional): Year, defaults to current year
- `employee_id` (optional): Filter by specific employee
- `department` (optional): Filter by department

**Response:**
```json
{
  "report_period": {
    "month": 1,
    "year": 2026
  },
  "summary": {
    "total_employees": 45,
    "total_payroll_cost": 3750000.00
  },
  "payroll_data": [
    {
      "employee_id": "OIODINJODO20260001",
      "employee_name": "John Doe",
      "email": "john@odooindia.com",
      "department": "Engineering",
      "job_title": "Software Developer",
      "attendance": {
        "present_days": 18,
        "half_days": 1,
        "leave_days": 2,
        "absent_days": 1,
        "working_days": 20.5,
        "total_working_days": 22
      },
      "salary_details": {
        "monthly_wage": 75000.00,
        "per_day_salary": 3409.09,
        "gross_salary": 69886.36,
        "basic_salary": 37500.00,
        "hra": 18750.00,
        "standard_allowance": 12502.50,
        "performance_bonus": 6247.50,
        "lta": 6247.50,
        "fixed_allowance": 8752.50
      },
      "deductions": {
        "professional_tax": 200.00,
        "pf_employee": 4500.00,
        "total_deductions": 4700.00
      },
      "net_salary": 65186.36,
      "employer_contribution": {
        "pf_employer": 4500.00,
        "total_employer_cost": 74386.36
      }
    }
  ]
}
```

**Features:**
- Attendance-based salary calculation
- Automatic pro-rata calculation for absents
- All salary components breakdown
- Deductions (PF, Professional Tax)
- Employer cost calculation
- Department-wise filtering

**Permissions:** Admin/HR only

---

### 4. Payroll Report CSV Export
**Endpoint:** `GET /api/auth/reports/payroll/csv`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:** Same as payroll report

**Response:** CSV file download
```csv
Employee ID,Employee Name,Email,Department,Job Title,Present Days,Half Days,Leave Days,Absent Days,Working Days,Monthly Wage,Gross Salary,Basic Salary,HRA,Standard Allowance,Performance Bonus,LTA,Fixed Allowance,Professional Tax,PF Employee,Total Deductions,Net Salary,PF Employer,Total Employer Cost
OIODINJODO20260001,John Doe,john@odooindia.com,Engineering,Software Developer,18,1,2,1,20.5,75000.00,69886.36,37500.00,18750.00,12502.50,6247.50,6247.50,8752.50,200.00,4500.00,4700.00,65186.36,4500.00,74386.36
```

**File Name:** `payroll_report_1_2026.csv`

**Permissions:** Admin/HR only

---

### 5. Leave Report
**Endpoint:** `GET /api/auth/reports/leave`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `year` (optional): Year, defaults to current year
- `employee_id` (optional): Filter by specific employee
- `status` (optional): Filter by PENDING, APPROVED, REJECTED

**Response:**
```json
{
  "report_year": 2026,
  "total_employees": 45,
  "leave_report": [
    {
      "employee_id": "OIODINJODO20260001",
      "employee_name": "John Doe",
      "email": "john@odooindia.com",
      "department": "Engineering",
      "leave_allocation": {
        "paid_leave_total": 24,
        "paid_leave_used": 3,
        "paid_leave_available": 21,
        "sick_leave_total": 7,
        "sick_leave_used": 1,
        "sick_leave_available": 6
      },
      "leave_requests": {
        "total_paid_requests": 2,
        "total_sick_requests": 1,
        "total_unpaid_requests": 0,
        "approved_paid_days": 3,
        "approved_sick_days": 1,
        "pending_requests": 0
      }
    }
  ]
}
```

**Features:**
- Year-wise leave allocation tracking
- Leave balance (available vs used)
- Request statistics by type
- Pending request count

**Permissions:** Admin/HR only

---

### 6. Leave Report CSV Export
**Endpoint:** `GET /api/auth/reports/leave/csv`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:** Same as leave report

**Response:** CSV file download
```csv
Employee ID,Employee Name,Email,Department,Paid Leave Total,Paid Leave Used,Paid Leave Available,Sick Leave Total,Sick Leave Used,Sick Leave Available,Total Requests,Pending Requests,Approved Requests
OIODINJODO20260001,John Doe,john@odooindia.com,Engineering,24,3,21,7,1,6,3,0,3
```

**File Name:** `leave_report_2026.csv`

**Permissions:** Admin/HR only

---

## 🔐 Role-Based Access Control

| Feature | Employee | Admin/HR |
|---------|----------|----------|
| Check In/Out | ✅ | ✅ |
| View Own Attendance | ✅ | ✅ |
| View All Attendance | ❌ | ✅ |
| Apply for Leave | ✅ | ✅ |
| View Own Leaves | ✅ | ✅ |
| View All Leaves | ❌ | ✅ |
| Approve/Reject Leave | ❌ | ✅ |
| Attendance Reports | ❌ | ✅ |
| Payroll Reports | ❌ | ✅ |
| Leave Reports | ❌ | ✅ |
| CSV Export | ❌ | ✅ |

---

## 📊 Complete API Endpoint List

### Module 5: Attendance Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/attendance/checkin` | Check in | Yes |
| POST | `/api/auth/attendance/checkout` | Check out | Yes |
| POST | `/api/auth/attendance/check` | Unified check in/out | Yes |
| GET | `/api/auth/attendance/my` | My attendance | Yes |
| GET | `/api/auth/attendance` | All attendance (Admin) | Admin |

### Module 6: Leave Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/leave/apply` | Apply for leave | Yes |
| GET | `/api/auth/leave/my` | My leave requests | Yes |
| GET | `/api/auth/leave/all` | All leave requests | Admin |
| POST | `/api/auth/leave/approve` | Approve/reject | Admin |

### Module 7: Reporting APIs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/auth/reports/attendance` | Attendance report JSON | Admin |
| GET | `/api/auth/reports/attendance/csv` | Attendance report CSV | Admin |
| GET | `/api/auth/reports/payroll` | Payroll report JSON | Admin |
| GET | `/api/auth/reports/payroll/csv` | Payroll report CSV | Admin |
| GET | `/api/auth/reports/leave` | Leave report JSON | Admin |
| GET | `/api/auth/reports/leave/csv` | Leave report CSV | Admin |

---

## 💻 Frontend Integration Examples

### Check In Example
```javascript
const checkIn = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/attendance/checkin', {
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

### Apply for Leave Example
```javascript
const applyLeave = async (leaveData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/leave/apply', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      time_off_type: 'PAID',
      start_date: '2026-05-13',
      end_date: '2026-05-15',
      reason: 'Family vacation'
    })
  });
  return await response.json();
};
```

### Download CSV Report Example
```javascript
const downloadAttendanceCSV = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    'http://127.0.0.1:8000/api/auth/reports/attendance/csv?month=1&year=2026',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance_report.csv';
  a.click();
};
```

### Get Payroll Report Example
```javascript
const getPayrollReport = async (month, year) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `http://127.0.0.1:8000/api/auth/reports/payroll?month=${month}&year=${year}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};
```

---

## ✅ Implementation Summary

### Module 5: Attendance Management
- ✅ Check-in/Check-out API with auto time calculation
- ✅ Work hours and overtime tracking
- ✅ Employee view own attendance
- ✅ Admin view all attendance with filters
- ✅ Status: Present, Absent, Half-day, Leave
- ✅ Date range and status filtering

### Module 6: Leave Management
- ✅ Leave request submission (PAID/SICK/UNPAID)
- ✅ Auto-calculation of leave days
- ✅ Leave balance checking
- ✅ Admin approval/rejection workflow
- ✅ Auto-update attendance status on approval
- ✅ Leave allocation tracking

### Module 7: Reporting APIs
- ✅ Attendance report with statistics
- ✅ Payroll report with salary breakdown
- ✅ Leave report with balance tracking
- ✅ CSV export for all reports
- ✅ Advanced filtering (date, employee, department, status)
- ✅ Role-based access control

---

## 🎯 Key Features

1. **Automated Calculations**
   - Work hours from check-in/check-out
   - Overtime detection
   - Leave days calculation
   - Pro-rata salary based on attendance

2. **Data Integrity**
   - Unique attendance per employee per day
   - Leave balance validation
   - Automatic status updates

3. **Comprehensive Reports**
   - JSON format for dashboards
   - CSV export for Excel/analysis
   - Date range filtering
   - Multi-level statistics

4. **Security**
   - JWT authentication required
   - Role-based permissions
   - Employee data isolation
   - Admin-only reporting access

---

✅ **All modules implemented and ready for production use!**
