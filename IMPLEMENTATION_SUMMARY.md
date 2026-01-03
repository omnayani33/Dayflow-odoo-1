# 🎉 Dayflow HRMS Authentication System v2.0

## ✅ Implementation Complete!

Your authentication system has been successfully updated to match the requirements from your design.

---

## 🚀 What's New

### 1. **Company Registration (Sign Up Page)**
- Admin creates company account
- Auto-generates employee ID format: `OI[CompanyCode][NameCode][Year][SerialNum]`
- Example: `OIODINJODO20260001`
- Optional company logo upload

### 2. **Employee Creation (Admin/HR Only)**
- Only admins/HR can create employee accounts
- System auto-generates temporary password
- Employees cannot self-register
- Auto-generated employee IDs for all users

### 3. **Enhanced Login (Sign In Page)**
- Login with **employee_id** OR **email**
- JWT token authentication
- First-time login detection

### 4. **Mandatory Password Change**
- Employees must change temp password on first login
- Secure password validation
- Old password verification for subsequent changes

### 5. **Role-Based Access Control**
- **ADMIN**: Full system access, can create companies
- **HR**: Can create and manage employees
- **EMPLOYEE**: Standard user access

---

## 📋 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/company/signup` | Register company + admin | No |
| `POST` | `/api/auth/employee/create` | Create employee | Yes (Admin/HR) |
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/change-password` | Change password | Yes |
| `GET` | `/api/auth/me` | Get current user | Yes |

---

## 🧪 Testing

### Start the server:
```bash
cd backend
python manage.py runserver
```

### Run automated tests:
```bash
python test_auth.py
```

### Test in browser:
1. Go to: `http://127.0.0.1:8000/api/auth/company/signup`
2. Use the Django REST Framework web interface
3. Fill in the form and test!

---

## 📖 Documentation

- **Full API Docs**: [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- **README**: [README.md](../README.md)

---

## 🔑 Employee ID Format

```
OI[CompanyCode][NameCode][Year][SerialNum]
  │      │          │       │        │
  │      │          │       │        └─ Sequential number (0001, 0002, ...)
  │      │          │       └────────── Year of joining (2026)
  │      │          └────────────────── First 2 letters of first & last name (JODO)
  │      └───────────────────────────── First 2+2 letters of company name (ODIN)
  └──────────────────────────────────── App prefix (Odoo India)

Example: OIODINJODO20260001
```

---

## 🎯 Complete Workflow

### For Companies (First Time Setup)

1. **Sign Up** 
   ```json
   POST /api/auth/company/signup
   {
     "company_name": "Odoo India",
     "first_name": "John",
     "last_name": "Doe",
     "email": "admin@odooindia.com",
     "phone": "9876543210",
     "password": "Admin@123"
   }
   ```
   ✅ Creates company + admin account
   ✅ Auto-generates employee ID: `OIODINJODO20260001`

2. **Admin Logs In**
   ```json
   POST /api/auth/login
   {
     "login_id": "OIODINJODO20260001",
     "password": "Admin@123"
   }
   ```
   ✅ Receives JWT token

3. **Admin Creates Employee**
   ```json
   POST /api/auth/employee/create
   Headers: Authorization: Bearer <token>
   {
     "first_name": "Jane",
     "last_name": "Smith",
     "email": "jane@odooindia.com",
     "phone": "9876543211",
     "role": "EMPLOYEE"
   }
   ```
   ✅ Auto-generates employee ID: `OIODINJASM20260002`
   ✅ Auto-generates temp password: `xY9!kL2@pQ`
   
4. **Share Credentials**
   - Admin shares employee ID and temp password with Jane

### For Employees (First Login)

1. **Employee First Login**
   ```json
   POST /api/auth/login
   {
     "login_id": "OIODINJASM20260002",
     "password": "xY9!kL2@pQ"
   }
   ```
   ✅ Response includes: `"is_first_login": true`
   ✅ Note: "Please change your password"

2. **Change Password (Mandatory)**
   ```json
   POST /api/auth/change-password
   Headers: Authorization: Bearer <token>
   {
     "new_password": "MyNewPass@123",
     "confirm_password": "MyNewPass@123"
   }
   ```
   ✅ Password changed successfully

3. **Subsequent Logins**
   ```json
   POST /api/auth/login
   {
     "login_id": "jane@odooindia.com",
     "password": "MyNewPass@123"
   }
   ```
   ✅ Normal login with new password

---

## 💻 Frontend Integration

Complete JavaScript examples are in [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

### Quick Example:
```javascript
// Company Signup
const signup = await fetch('/api/auth/company/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_name: 'Odoo India',
    first_name: 'John',
    last_name: 'Doe',
    email: 'admin@odooindia.com',
    password: 'Admin@123'
  })
});

// Login (works with employee_id or email)
const login = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    login_id: 'OIODINJODO20260001',  // or email
    password: 'Admin@123'
  })
});

const data = await login.json();
localStorage.setItem('token', data.token);

// Check if first login
if (data.is_first_login) {
  // Redirect to change password page
  window.location.href = '/change-password';
}
```

---

## 🔒 Security Features

✅ Passwords hashed with Django's PBKDF2
✅ JWT tokens expire after 24 hours
✅ Auto-generated secure temporary passwords
✅ Mandatory password change on first login
✅ Email and employee ID uniqueness enforced
✅ Role-based permission system
✅ Company-isolated user management

---

## 📂 Project Structure

```
backend/
├── authentication/
│   ├── models.py              # User & Company models
│   ├── serializers.py         # API serializers
│   ├── views.py               # API endpoints
│   ├── utils.py               # Helper functions
│   ├── permissions.py         # Role-based permissions
│   └── urls.py                # URL routing
├── dayflow/
│   ├── settings.py            # Django config
│   └── urls.py                # Root URLs
└── media/
    └── company_logos/         # Company logo uploads
```

---

## 🎨 Design Alignment

Your implementation now matches your design wireframe:

| Feature | Design Requirement | ✅ Implemented |
|---------|-------------------|----------------|
| Sign Up Page | Company name, name, email, phone, password | ✅ Yes |
| Upload Logo | Company logo upload | ✅ Yes |
| Auto Employee ID | OI[Company][Name][Year][Serial] | ✅ Yes |
| Sign In Page | Login with employee_id/email | ✅ Yes |
| Admin Control | Only admin creates employees | ✅ Yes |
| Auto Password | System generates temp password | ✅ Yes |
| First Login | Mandatory password change | ✅ Yes |
| Password Toggle | Show/hide (frontend implementation) | Frontend |

---

## 🚀 Next Steps for Your Friend (Frontend)

1. **Clone & Setup**
   ```bash
   git clone https://github.com/omnayani33/Dayflow-odoo-1.git
   cd Dayflow-odoo-1
   git checkout backend-core
   ```

2. **Install & Run**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   cd backend
   python manage.py runserver
   ```

3. **Read Documentation**
   - [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Complete API reference
   - [README.md](../README.md) - Setup guide

4. **Build Frontend**
   - Implement Sign Up page for company registration
   - Implement Sign In page (accept employee_id or email)
   - Admin dashboard to create employees
   - Change password page for first-time users
   - Use provided JavaScript examples

---

## 📞 Support

- **Repository**: https://github.com/omnayani33/Dayflow-odoo-1
- **Branch**: `backend-core`
- **API Base**: `http://127.0.0.1:8000`

---

## ✨ Summary

✅ Complete authentication system matching your design
✅ Auto-generated employee IDs with custom format
✅ Company-based user management
✅ Admin/HR controlled employee creation
✅ Auto-generated temporary passwords
✅ Mandatory first-time password change
✅ Role-based access control (ADMIN/HR/EMPLOYEE)
✅ JWT token authentication
✅ Comprehensive API documentation
✅ Test scripts included
✅ Ready for frontend integration

**Everything is pushed to GitHub and ready for your friend to start frontend development!** 🎉
