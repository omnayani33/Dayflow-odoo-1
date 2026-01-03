# Dayflow HRMS API Documentation

## 🔐 Authentication System Overview

The authentication system is designed for HRMS with the following features:
- **Auto-generated Employee IDs** in format: `OI[CompanyCode][NameCode][Year][SerialNum]`
- **Company-based registration** (Admin/HR creates the company first)
- **Admin/HR control** over employee creation (employees cannot self-register)
- **Auto-generated temporary passwords** for new employees
- **Mandatory password change** on first login

---

## 📋 API Endpoints

### Base URL
```
http://127.0.0.1:8000
```

---

## 1. Company Signup (Sign Up Page)

Creates a new company and its first admin account.

**Endpoint:** `POST /api/auth/company/signup`

**Request Body:**
```json
{
  "company_name": "Odoo India",
  "first_name": "John",
  "last_name": "Doe",
  "email": "admin@odooindia.com",
  "phone": "9876543210",
  "password": "SecurePass123!",
  "logo": "<file upload - optional>"
}
```

**Response (201 Created):**
```json
{
  "message": "Company and admin account created successfully",
  "company": {
    "id": 1,
    "name": "Odoo India"
  },
  "user": {
    "employee_id": "OIODINJODO20260001",
    "email": "admin@odooindia.com",
    "full_name": "John Doe",
    "role": "ADMIN"
  }
}
```

**Employee ID Breakdown:**
- `OI` - Prefix (Odoo India/App Name)
- `ODIN` - First 2 letters of "Odoo" + "India"
- `JODO` - First 2 letters of "John" + "Doe"
- `2026` - Year of joining
- `0001` - Serial number for that year

---

## 2. Login (Sign In Page)

Login using employee_id or email.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "login_id": "OIODINJODO20260001",
  "password": "SecurePass123!"
}
```

OR

```json
{
  "login_id": "admin@odooindia.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "employee_id": "OIODINJODO20260001",
  "email": "admin@odooindia.com",
  "role": "ADMIN",
  "is_first_login": false,
  "full_name": "John Doe",
  "message": "Login successful"
}
```

**First Login Response:**
```json
{
  "token": "...",
  "is_first_login": true,
  "note": "Please change your password",
  ...
}
```

---

## 3. Create Employee (Admin/HR Only)

Only Admin or HR can create new employees.

**Endpoint:** `POST /api/auth/employee/create`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@odooindia.com",
  "phone": "9876543211",
  "role": "EMPLOYEE",
  "year_of_joining": 2026
}
```

**Response (201 Created):**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "employee_id": "OIODINJASM20260002",
    "email": "jane@odooindia.com",
    "full_name": "Jane Smith",
    "role": "EMPLOYEE",
    "phone": "9876543211"
  },
  "temporary_password": "xY9!kL2@pQ",
  "note": "Please share this password with the employee. They must change it on first login."
}
```

---

## 4. Change Password

Change password (required on first login).

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body (First Time):**
```json
{
  "new_password": "MyNewPass123!",
  "confirm_password": "MyNewPass123!"
}
```

**Request Body (Regular Change):**
```json
{
  "old_password": "MyNewPass123!",
  "new_password": "AnotherPass456!",
  "confirm_password": "AnotherPass456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully",
  "note": "Please login again with your new password"
}
```

---

## 5. Get Current User

Get authenticated user details.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "employee_id": "OIODINJODO20260001",
  "email": "admin@odooindia.com",
  "full_name": "John Doe",
  "role": "ADMIN",
  "phone": "9876543210",
  "is_first_login": false,
  "company": {
    "id": 1,
    "name": "Odoo India"
  }
}
```

---

## 🔒 Authentication Flow

### For Company/Admin (First Time)
1. **Sign Up** → `POST /api/auth/company/signup`
   - Creates company and admin account
   - Auto-generates employee ID
   - Admin sets own password

2. **Login** → `POST /api/auth/login`
   - Use employee_id or email
   - Receive JWT token

3. **Create Employees** → `POST /api/auth/employee/create`
   - Admin/HR creates employee accounts
   - System generates temporary password
   - Share password with employee

### For Employees
1. **Receive Credentials**
   - Employee ID: From Admin/HR
   - Temp Password: From Admin/HR

2. **First Login** → `POST /api/auth/login`
   - Use employee_id and temp password
   - `is_first_login: true` in response

3. **Change Password** → `POST /api/auth/change-password`
   - Mandatory on first login
   - Set permanent password

4. **Subsequent Logins**
   - Use new password
   - Normal workflow

---

## 👥 User Roles

### ADMIN
- Full system access
- Can create companies
- Can create HR and employees
- Manage all users

### HR
- Can create employees
- Manage employee records
- Limited admin access

### EMPLOYEE
- Standard user access
- View own profile
- Change own password

---

## 🔑 Permission Classes

Use in your views:
```python
from authentication.permissions import IsAdmin

class MyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
```

Available permissions:
- `IsAdmin` - Only ADMIN role
- `IsEmployee` - Only EMPLOYEE role
- `IsAdminOrEmployee` - Both roles

---

## 💡 Frontend Integration Examples

### JavaScript/React

```javascript
// 1. Company Signup
const companySignup = async (formData) => {
  const response = await fetch('http://127.0.0.1:8000/api/auth/company/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: formData.company_name,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    })
  });
  return await response.json();
};

// 2. Login
const login = async (loginId, password) => {
  const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: loginId, password: password })
  });
  const data = await response.json();
  
  // Store token
  localStorage.setItem('token', data.token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('employee_id', data.employee_id);
  
  // Check if first login
  if (data.is_first_login) {
    // Redirect to change password page
    window.location.href = '/change-password';
  }
  
  return data;
};

// 3. Create Employee (Admin/HR only)
const createEmployee = async (employeeData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/employee/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(employeeData)
  });
  return await response.json();
};

// 4. Change Password
const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  });
  return await response.json();
};

// 5. Get Current User
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://127.0.0.1:8000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

---

## 🧪 Testing with cURL

```bash
# 1. Company Signup
curl -X POST http://127.0.0.1:8000/api/auth/company/signup \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Odoo India",
    "first_name": "John",
    "last_name": "Doe",
    "email": "admin@odooindia.com",
    "phone": "9876543210",
    "password": "SecurePass123!"
  }'

# 2. Login
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "OIODINJODO20260001",
    "password": "SecurePass123!"
  }'

# 3. Create Employee
curl -X POST http://127.0.0.1:8000/api/auth/employee/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@odooindia.com",
    "phone": "9876543211",
    "role": "EMPLOYEE"
  }'
```

---

## 📝 Notes

1. **Employee ID Format:** `OI[CompanyCode][NameCode][Year][SerialNum]`
   - Example: `OIJODO20220001`
   - Auto-generated by system
   - Unique per employee

2. **Password Security:**
   - Minimum 8 characters
   - Auto-generated for new employees
   - Must be changed on first login
   - Hashed using Django's PBKDF2

3. **JWT Tokens:**
   - Access token expires in 24 hours
   - Refresh token expires in 7 days
   - Include in header: `Authorization: Bearer <token>`

4. **Company Logo:**
   - Optional during signup
   - Stored in `/media/company_logos/`
   - Supported formats: JPG, PNG, GIF

5. **Role Hierarchy:**
   - ADMIN > HR > EMPLOYEE
   - Only ADMIN/HR can create employees
   - Employees cannot self-register
