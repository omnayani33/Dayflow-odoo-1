import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'
import { authAPI } from '../api/endpoints'
import Alert from '../components/Alert'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      })

      const { data } = response

      // Store auth data
      authUtils.setAuth(data)

      // Redirect based on first login status
      if (data.is_first_login) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)

      // Extract error message from DRF serializer errors
      let errorMessage = 'Invalid credentials. Please try again.'

      if (err.response?.data) {
        const data = err.response.data
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0]
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.detail) {
          errorMessage = data.detail
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="login-page">
      {/* Background Decorations */}
      <div className="login-bg-decoration">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
      </div>

      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding d-none d-lg-flex">
          <div className="branding-content">
            <div className="brand-logo">
              <i className="bi bi-layers-fill"></i>
            </div>
            <h1>Dayflow</h1>
            <p className="tagline">Human Resource Management System</p>
            <div className="features-list">
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Streamlined HR Operations</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Easy Attendance Tracking</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Seamless Leave Management</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Automated Payroll Processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-wrapper">
          <div className="login-form-card glass-card p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="mobile-logo d-lg-none mb-3">
                <i className="bi bi-layers-fill"></i>
              </div>
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted-light">Sign in to continue to Dayflow</p>
            </div>

            {error && (
              <div className="alert-glass alert-danger mb-4">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
                <button className="alert-close" onClick={() => setError('')}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="form-label-glass">Employee ID or Email</label>
                <div className="input-group-glass">
                  <span className="input-icon">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="glass-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your employee ID or email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label-glass">Password</label>
                <div className="input-group-glass">
                  <span className="input-icon">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="glass-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glass-btn glass-btn-primary w-100 py-3 mb-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted-light mb-0">
                First time setup?
                <Link to="/company-signup" className="text-primary-light fw-semibold ms-1">
                  Create Company
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          position: relative;
          overflow: hidden;
        }

        .login-bg-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }

        .glow-1 {
          width: 400px;
          height: 400px;
          background: rgba(37, 99, 235, 0.3);
          top: -100px;
          left: -100px;
        }

        .glow-2 {
          width: 300px;
          height: 300px;
          background: rgba(16, 185, 129, 0.2);
          bottom: -50px;
          right: -50px;
        }

        .glow-3 {
          width: 200px;
          height: 200px;
          background: rgba(139, 92, 246, 0.2);
          top: 50%;
          left: 30%;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          position: relative;
          z-index: 1;
        }

        .login-branding {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .branding-content {
          max-width: 400px;
          color: white;
          text-align: center;
        }

        .brand-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
        }

        .brand-logo i {
          font-size: 2.5rem;
          color: white;
        }

        .branding-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .tagline {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 3rem;
        }

        .features-list {
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        .feature-item i {
          color: #10b981;
          font-size: 1.1rem;
        }

        .login-form-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-form-card {
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.5s ease-out;
        }

        .mobile-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
        }

        .mobile-logo i {
          font-size: 1.75rem;
          color: white;
        }

        h2 {
          color: white;
          font-size: 1.75rem;
        }

        .text-muted-light {
          color: #94a3b8;
        }

        .text-primary-light {
          color: #60a5fa;
        }

        .text-primary-light:hover {
          color: #3b82f6;
        }

        .form-label-glass {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .input-group-glass {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          z-index: 1;
        }

        .input-group-glass .glass-input {
          padding-left: 2.75rem;
        }

        .alert-glass {
          display: flex;
          align-items: center;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          position: relative;
        }

        .alert-glass.alert-danger {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert-close {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.7;
        }

        .alert-close:hover {
          opacity: 1;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 991px) {
          .login-form-wrapper {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
