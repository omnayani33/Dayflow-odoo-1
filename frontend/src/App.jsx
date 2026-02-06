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
import Profile from './pages/Profile'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Approvals from './pages/Approvals'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import CreateEmployee from './pages/CreateEmployee'
import AllEmployees from './pages/AllEmployees'

// Route Guards
const ProtectedRoute = ({ children }) => {
  const isAuth = authUtils.isAuthenticated()
  const isFirstLogin = authUtils.isFirstLogin()

  if (!isAuth) {
    return <Navigate to="/login" replace />
  }

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
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const isAuth = authUtils.isAuthenticated()
  const isFirstLogin = authUtils.isFirstLogin()

  if (isAuth && !isFirstLogin) {
    return <Navigate to="/dashboard" replace />
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="payroll" element={<Payroll />} />

        {/* Admin Only Routes */}
        <Route path="approvals" element={
          <AdminRoute>
            <Approvals />
          </AdminRoute>
        } />
        <Route path="reports" element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        } />
        <Route path="employees" element={
          <AdminRoute>
            <AllEmployees />
          </AdminRoute>
        } />
        <Route path="create-employee" element={
          <AdminRoute>
            <CreateEmployee />
          </AdminRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
