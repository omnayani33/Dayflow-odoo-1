import api from './axios'

// Auth APIs - Matching backend structure
export const authAPI = {
  // Company signup (first-time setup - creates company and admin)
  companySignup: (data) => api.post('/auth/company/signup', data),

  // Login with employee_id or email
  login: (credentials) => api.post('/auth/login', {
    login_id: credentials.email || credentials.employee_id,
    password: credentials.password,
  }),

  // Create employee (Admin/HR only)
  createEmployee: (data) => api.post('/auth/employee/create', data),

  // Get all employees (Admin/HR only)
  getEmployees: () => api.get('/auth/employee/all'),

  // Delete employee (Admin/HR only)
  deleteEmployee: (id) => api.delete(`/auth/employee/${id}/delete`),

  // Change password
  changePassword: (data) => api.post('/auth/change-password', data),

  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
}

// Profile APIs
export const profileAPI = {
  // Get my profile
  getMyProfile: () => api.get('/auth/profile/me'),

  // Update profile
  updateProfile: (data) => api.put('/auth/profile/update', data),

  // Upload avatar
  uploadAvatar: (formData) => api.post('/auth/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Document management
  getMyDocuments: () => api.get('/auth/profile/documents'),
  uploadDocument: (formData) => api.post('/auth/profile/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadDocument: (id) => api.get(`/auth/profile/documents/${id}/download`, {
    responseType: 'blob'
  }),
  deleteDocument: (id) => api.delete(`/auth/profile/documents/${id}`),
}

// Dashboard APIs
export const dashboardAPI = {
  // Employee dashboard
  getEmployeeDashboard: () => api.get('/auth/dashboard/employee'),

  // Admin dashboard
  getAdminDashboard: () => api.get('/auth/dashboard/admin'),
}

// Attendance APIs
export const attendanceAPI = {
  // Check in with location
  checkIn: (locationData = {}) => api.post('/auth/attendance/check', {
    action: 'check_in',
    ...locationData
  }),

  // Check out with location
  checkOut: (locationData = {}) => api.post('/auth/attendance/check', {
    action: 'check_out',
    ...locationData
  }),

  // Get my attendance records
  getMyAttendance: (month, year) => api.get(`/auth/attendance/my?month=${month}&year=${year}`),
}

// Leave/Time Off APIs
export const leaveAPI = {
  // Get my leave requests
  getMyRequests: () => api.get('/auth/timeoff/request'),

  // Submit leave request
  submitRequest: (data) => api.post('/auth/timeoff/request', data),

  // Get all requests (Admin/HR only) - for manage page
  manageTimeOff: (status) => api.get(`/auth/timeoff/manage${status ? `?status=${status}` : ''}`),

  // Approve/Reject request (Admin/HR only)
  approveReject: (id, action, reason) => api.patch(`/auth/timeoff/manage/${id}`, {
    action,
    ...(reason && { reason })
  }),
}

// Payroll APIs (Using profile endpoint for salary info)
export const payrollAPI = {
  // Get my salary (included in profile)
  getMySalary: () => api.get('/auth/profile/me'),

  // Update salary (Admin only, via profile update)
  updateSalary: (data) => api.put('/auth/profile/update', data),
}

// Reports APIs
export const reportsAPI = {
  getAttendanceReport: (month, year) => api.get(`/auth/reports/attendance?month=${month}&year=${year}`),
  getLeaveReport: (year) => api.get(`/auth/reports/leave?year=${year}`),
  getPayrollReport: (month, year) => api.get(`/auth/reports/payroll?month=${month}&year=${year}`),
  downloadAttendanceCSV: (month, year) => api.get(`/auth/reports/attendance/csv?month=${month}&year=${year}`, { responseType: 'blob' }),
  downloadLeaveCSV: (year) => api.get(`/auth/reports/leave/csv?year=${year}`, { responseType: 'blob' }),
  downloadPayrollCSV: (month, year) => api.get(`/auth/reports/payroll/csv?month=${month}&year=${year}`, { responseType: 'blob' }),
}

// Notification APIs
export const notificationsAPI = {
  getMyNotifications: (params) => api.get('/auth/notifications', { params }),
  markAsRead: (id) => api.patch(`/auth/notifications/${id}/read`),
  markAllAsRead: () => api.post('/auth/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/auth/notifications/${id}/delete`),
  clearAll: () => api.delete('/auth/notifications/clear'),
}
