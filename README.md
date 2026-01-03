# Dayflow HRMS - Django REST API
odoo X Gcet hackathon

## 🚀 Backend Authentication System

Django REST Framework authentication for HRMS with JWT token-based auth.

### Features
- ✅ Custom User model with email authentication
- ✅ JWT token-based authentication
- ✅ Role-based access control (ADMIN/EMPLOYEE)
- ✅ Secure password hashing
- ✅ REST API endpoints for signup and login

### Tech Stack
- Django 6.0
- Django REST Framework
- Simple JWT
- SQLite Database

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.13+
- pip

### Setup Instructions

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Dayflow-odoo-1
```

2. **Create virtual environment**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run migrations**
```bash
cd backend
python manage.py migrate
```

5. **Create superuser (optional)**
```bash
python manage.py createsuperuser
```
Or use default admin:
- Email: `admin@dayflow.com`
- Password: `admin123`

6. **Run the development server**
```bash
python manage.py runserver
```

Server will start at: `http://127.0.0.1:8000/`

---

## 🔐 API Endpoints

### Base URL
```
http://127.0.0.1:8000
```

### Authentication Endpoints

#### 1. Signup (Register New User)
```http
POST /api/auth/signup
Content-Type: application/json

{
  "employee_id": "EMP001",
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "EMPLOYEE"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "email": "user@example.com",
  "role": "EMPLOYEE"
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "EMPLOYEE"
}
```

#### 3. Using JWT Token
For protected endpoints, add the token to headers:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📝 Frontend Integration Guide

### For Frontend Developers

#### API Base URL
```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

#### Signup Example (JavaScript)
```javascript
const signup = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await response.json();
};
```

#### Login Example (JavaScript)
```javascript
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  // Store token
  localStorage.setItem('token', data.token);
  localStorage.setItem('role', data.role);
  
  return data;
};
```

#### Protected Request Example
```javascript
const makeAuthRequest = async (endpoint) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

---

## 📁 Project Structure

```
Dayflow-odoo-1/
├── backend/
│   ├── authentication/          # Authentication app
│   │   ├── models.py           # Custom User model
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # API views
│   │   ├── permissions.py      # Role-based permissions
│   │   └── urls.py             # Auth URL routing
│   ├── dayflow/                # Main project settings
│   │   ├── settings.py         # Django settings
│   │   └── urls.py             # Root URL config
│   └── manage.py
├── requirements.txt            # Python dependencies
└── README.md
```

---

## 👥 User Roles

- **ADMIN**: Full system access
- **EMPLOYEE**: Standard user access

---

## 🔒 Security Features

- ✅ Passwords hashed using Django's PBKDF2 algorithm
- ✅ JWT tokens expire after 24 hours
- ✅ Email-based authentication
- ✅ Role-based permission system

---

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request
