import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiLock } from 'react-icons/fi'
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
        login_id: formData.email,
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
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.response?.data?.detail
        || 'Invalid credentials. Please try again.'
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-primary bg-gradient">
      <div className="card shadow-lg border-0" style={{ width: '450px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Dayflow HRMS</h2>
            <p className="text-muted">Sign in to your account</p>
          </div>

          <Alert type="danger" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Employee ID or Email</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiMail />
                </span>
                <input
                  type="text"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter employee ID or email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiLock />
                </span>
                <input
                  type="password"
                  className="form-control"
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
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-3">
            <small className="text-muted">
              First time setup? <Link to="/company-signup" className="text-primary fw-bold">Create Company</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
