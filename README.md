<div align="center">

# 🌊 Dayflow HRMS

**Modern Human Resource Management System**

[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green. svg? style=flat)](LICENSE)

**Developed for Odoo X GCET Hackathon 2026**

[Features](#-features) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**Dayflow HRMS** is a comprehensive Human Resource Management System designed to streamline employee management, attendance tracking, leave management, and workforce analytics. Built with modern web technologies, it offers a robust REST API backend powered by Django and an intuitive React-based frontend interface.

### ✨ Key Highlights

- 🔐 **Secure Authentication** - JWT token-based authentication with role-based access control
- 👥 **Employee Management** - Complete employee lifecycle management
- 📊 **Analytics Dashboard** - Real-time workforce insights with Chart.js visualizations
- 📱 **Responsive Design** - Mobile-friendly interface built with Bootstrap 5
- 🔔 **Notifications** - Email and WhatsApp notifications via Twilio integration
- 🚀 **RESTful API** - Well-documented API endpoints for easy integration

---

## 🎯 Features

### Authentication & Authorization
- ✅ Email-based authentication system
- ✅ JWT token management (access & refresh tokens)
- ✅ Role-based access control (Admin/Employee)
- ✅ Secure password hashing with Django's PBKDF2
- ✅ Custom user model with extended profile fields

### Employee Management
- ✅ Employee registration and profile management
- ✅ Department and role assignment
- ✅ Employee directory with search and filters
- ✅ Profile photo upload support

### Attendance & Leave
- ✅ Attendance tracking system
- ✅ Leave request management
- ✅ Leave balance tracking
- ✅ Approval workflow for managers

### Notifications
- ✅ Email notifications for important events
- ✅ WhatsApp notifications via Twilio
- ✅ Real-time notification system

### Analytics & Reporting
- ✅ Interactive charts and graphs
- ✅ Workforce analytics dashboard
- ✅ Attendance reports
- ✅ Leave analytics

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed: 

- **Python** 3.13 or higher
- **Node.js** 16. x or higher
- **npm** or **yarn**
- **Git**

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/omnayani33/Dayflow-odoo-1.git
cd Dayflow-odoo-1
```

#### 2️⃣ Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Navigate to backend directory
cd backend

# Create .env file from example
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/macOS

# Configure your . env file with actual values
# Edit .env and add your SECRET_KEY, email, and Twilio credentials

# Run database migrations
python manage.py migrate

# Create test user (optional)
python create_test_user.py

# Create superuser for admin access
python manage.py createsuperuser

# Start development server
python manage. py runserver
```

Backend will be available at:  **http://127.0.0.1:8000**

#### 3️⃣ Frontend Setup (React)

Open a new terminal window: 

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

Frontend will be available at: **http://localhost:5173**

---

## 🔐 API Documentation

### Base URL
```
http://127.0.0.1:8000/api
```

### Authentication Endpoints

#### Register New User

```http
POST /api/auth/signup
Content-Type: application/json

{
  "employee_id": "EMP001",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "EMPLOYEE"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "employee_id": "EMP001"
}
```

#### User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example. com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access":  "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc.. .",
  "role": "EMPLOYEE",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "employee_id": "EMP001"
  }
}
```

#### Using Authentication

For protected endpoints, include the JWT token in the Authorization header: 

```http
Authorization: Bearer <access_token>
```

### Example API Request with Authentication

```javascript
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user_role', data.role);
  
  return data;
};

// Make authenticated request
const fetchProtectedData = async (endpoint) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

---

## 🏗️ Tech Stack

### Backend
- **Django 6.0** - High-level Python web framework
- **Django REST Framework 3.15** - Powerful toolkit for building Web APIs
- **Simple JWT 5.4** - JSON Web Token authentication
- **Pillow 11.0** - Image processing for profile photos
- **Twilio 9.9+** - WhatsApp and SMS notifications
- **Python Decouple 3.8** - Environment variable management
- **SQLite** - Database (development)

### Frontend
- **React 18.2** - JavaScript library for building user interfaces
- **React Router DOM 6.20** - Declarative routing for React
- **Vite 5.0** - Next-generation frontend build tool
- **Bootstrap 5.3** - CSS framework for responsive design
- **Axios 1.6** - Promise-based HTTP client
- **Chart.js 4.4** - JavaScript charting library
- **React Chart. js 2 5.2** - React wrapper for Chart.js
- **React Icons 4.12** - Popular icon library

---

## 📁 Project Structure

```
Dayflow-odoo-1/
│
├── backend/                      # Django Backend
│   ├── accounts/                 # Accounts app
│   ├── authentication/           # Authentication app
│   │   ├── models.py            # Custom User model
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # API views
│   │   ├── permissions.py       # Role-based permissions
│   │   └── urls.py              # Auth routing
│   ├── dayflow/                 # Main project settings
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # Root URL configuration
│   │   └── wsgi.py              # WSGI configuration
│   ├── . env.example             # Environment variables template
│   ├── create_test_user.py      # Test user creation script
│   ├── test_hrms. py             # API testing script
│   ├── manage.py                # Django management script
│   └── db.sqlite3               # SQLite database
│
├── frontend/                     # React Frontend
│   ├── src/                     # Source files
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── utils/               # Utility functions
│   │   └── App.jsx              # Root component
│   ├── index.html               # HTML template
│   ├── package.json             # NPM dependencies
│   └── vite.config.js           # Vite configuration
│
├── requirements.txt              # Python dependencies
├── . gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

---

## 🔒 Security Features

- 🔐 **Password Security** - PBKDF2 algorithm with SHA256 hash
- 🎫 **JWT Tokens** - Secure token-based authentication
- ⏱️ **Token Expiration** - Access tokens expire after 24 hours
- 🔄 **Refresh Tokens** - 7-day validity for seamless re-authentication
- 👮 **Role-Based Access** - Granular permission system
- 🛡️ **CORS Protection** - Cross-Origin Resource Sharing configuration
- 🔑 **Environment Variables** - Sensitive data stored securely

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory using `.env.example` as a template:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp: +14155238886

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME_DAYS=1
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

### Default Test Credentials

```
Email: admin@dayflow.com
Password: admin123
Role: ADMIN
```

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
python manage.py test
```

### Test API Endpoints

```bash
python test_hrms.py
```

---

## 📱 User Roles & Permissions

| Role     | Permissions                                                     |
|----------|-----------------------------------------------------------------|
| **ADMIN** | Full system access, user management, reports, configurations   |
| **EMPLOYEE** | View own profile, submit leave requests, view attendance      |

---

## 🚢 Deployment

### Backend Deployment (Django)

1. Set `DEBUG=False` in production
2. Configure production database (PostgreSQL recommended)
3. Set up static file serving
4. Configure ALLOWED_HOSTS
5. Use environment variables for sensitive data
6. Set up HTTPS/SSL certificates

### Frontend Deployment (React)

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to your hosting service (Netlify, Vercel, etc.)

---

## 🤝 Contributing

We welcome contributions!  Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Developed with ❤️ for **Odoo X GCET Hackathon 2026**

**Project Maintainer:** [@omnayani33](https://github.com/omnayani33)

---

## 📞 Support

For questions, issues, or suggestions:

- 🐛 **Issues:** [GitHub Issues](https://github.com/omnayani33/Dayflow-odoo-1/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/omnayani33/Dayflow-odoo-1/discussions)

---

## 🙏 Acknowledgments

- **Odoo** - For organizing the hackathon
- **GCET** - For hosting and support
- **Django & React Communities** - For excellent documentation and support
- **Open Source Contributors** - For the amazing libraries used in this project

---

<div align="center">

**⭐ Star this repository if you find it helpful! **

Made with ❤️ using Django & React

</div>
