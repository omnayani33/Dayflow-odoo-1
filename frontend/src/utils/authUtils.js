// Auth utility functions for managing authentication state

const AUTH_KEYS = {
  TOKEN: 'token',
  REFRESH: 'refresh',
  ROLE: 'role',
  EMAIL: 'email',
  EMPLOYEE_ID: 'employee_id',
  FULL_NAME: 'full_name',
  IS_FIRST_LOGIN: 'is_first_login',
}

export const authUtils = {
  // Set auth data from login response
  setAuth: (data) => {
    if (data.token) localStorage.setItem(AUTH_KEYS.TOKEN, data.token)
    if (data.refresh) localStorage.setItem(AUTH_KEYS.REFRESH, data.refresh)
    if (data.role) localStorage.setItem(AUTH_KEYS.ROLE, data.role)
    if (data.email) localStorage.setItem(AUTH_KEYS.EMAIL, data.email)
    if (data.employee_id) localStorage.setItem(AUTH_KEYS.EMPLOYEE_ID, data.employee_id)
    if (data.full_name) localStorage.setItem(AUTH_KEYS.FULL_NAME, data.full_name)
    if (data.is_first_login !== undefined) {
      localStorage.setItem(AUTH_KEYS.IS_FIRST_LOGIN, data.is_first_login.toString())
    }
  },

  // Get auth data
  getAuth: () => {
    return {
      token: localStorage.getItem(AUTH_KEYS.TOKEN),
      refresh: localStorage.getItem(AUTH_KEYS.REFRESH),
      role: localStorage.getItem(AUTH_KEYS.ROLE),
      email: localStorage.getItem(AUTH_KEYS.EMAIL),
      employee_id: localStorage.getItem(AUTH_KEYS.EMPLOYEE_ID),
      full_name: localStorage.getItem(AUTH_KEYS.FULL_NAME),
      is_first_login: localStorage.getItem(AUTH_KEYS.IS_FIRST_LOGIN) === 'true',
    }
  },

  // Clear auth data
  clearAuth: () => {
    Object.values(AUTH_KEYS).forEach(key => localStorage.removeItem(key))
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN)
    return !!token
  },

  // Get current user role
  getRole: () => {
    return localStorage.getItem(AUTH_KEYS.ROLE)
  },

  // Check if user is admin or HR
  isAdmin: () => {
    const role = localStorage.getItem(AUTH_KEYS.ROLE)
    return role === 'ADMIN' || role === 'HR'
  },

  // Check if user is employee
  isEmployee: () => {
    return localStorage.getItem(AUTH_KEYS.ROLE) === 'EMPLOYEE'
  },

  // Check if first login
  isFirstLogin: () => {
    return localStorage.getItem(AUTH_KEYS.IS_FIRST_LOGIN) === 'true'
  },

  // Mark first login complete
  markFirstLoginComplete: () => {
    localStorage.setItem(AUTH_KEYS.IS_FIRST_LOGIN, 'false')
  },

  // Validate auth state
  validateAuth: () => {
    const auth = authUtils.getAuth()

    // Check if all required fields exist
    if (!auth.token || !auth.role || !auth.email) {
      return false
    }

    return true
  },

  // Get user display info
  getUserInfo: () => {
    const auth = authUtils.getAuth()
    return {
      email: auth.email || 'Guest',
      role: auth.role || 'N/A',
      full_name: auth.full_name || 'User',
      employee_id: auth.employee_id || 'N/A',
    }
  },

  // Get auth header for API requests
  getAuthHeader: () => {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN)
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}
