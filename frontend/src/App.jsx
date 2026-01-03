import { Routes, Route, Navigate } from 'react-router-dom'
import { authUtils } from './utils/authUtils'

// Layout
import Layout from './components/Layout'

// Auth Pages
import Login from './pages/Login'
import CompanySignup from './pages/CompanySignup'
import ChangePassword from './pages/ChangePassword'

// Main Pages
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Profile from './pages/Profile'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import CreateEmployee from './pages/CreateEmployee'

// Route Guards
const ProtectedRoute = ({ children }) => {
  const isAuth = authUtils.isAuthenticated()
  const isFirstLogin = authUtils.isFirstLogin()

  if (!isAuth) {
    return <Navigate to="/login" replace />
  }

  // Redirect to change password if first login
  if (isFirstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (!authUtils.validateAuth()) {
    authUtils.clearAuth()
    return <Navigate to="/login" replace />
  }

  return children
}

const AdminRoute = ({ children }) => {
  const isAuth = authUtils.isAuthenticated()
  const isAdmin = authUtils.isAdmin()

  if (!isAuth) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/employees" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const isAuth = authUtils.isAuthenticated()
  const isFirstLogin = authUtils.isFirstLogin()

  // After login → redirect to Employee List page (per wireframe)
  if (isAuth && !isFirstLogin) {
    return <Navigate to="/employees" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      <Route path="/company-signup" element={
        <PublicRoute>
          <CompanySignup />
        </PublicRoute>
      } />

      {/* First Login - Password Change Required */}
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />

      {/* Protected Routes with Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Default redirect to Employees (wireframe: landing page after login) */}
        <Route index element={<Navigate to="/employees" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />

        {/* Admin Only Routes */}
        <Route path="create-employee" element={
          <AdminRoute>
            <CreateEmployee />
          </AdminRoute>
        } />
      </Route>

      {/* 404 - Redirect to Employees */}
      <Route path="*" element={<Navigate to="/employees" replace />} />
    </Routes>
  )
}

export default App
