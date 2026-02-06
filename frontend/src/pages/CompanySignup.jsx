import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiBriefcase, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi'
import { authUtils } from '../utils/authUtils'
import { authAPI } from '../api/endpoints'
import Alert from '../components/Alert'

function CompanySignup() {
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.company_name || !formData.first_name || !formData.last_name ||
      !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.companySignup({
        company_name: formData.company_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })

      const { data } = response

      // Store auth data if backend returns it
      if (data.user) {
        authUtils.setAuth({
          token: data.token || '',
          role: 'ADMIN',
          email: data.user.email,
          employee_id: data.user.employee_id,
          full_name: data.user.full_name,
          is_first_login: false,
        })
        navigate('/dashboard', { replace: true })
      } else {
        // Redirect to login
        navigate('/login', {
          state: { message: 'Company created successfully! Please sign in.' }
        })
      }
    } catch (err) {
      console.error('Signup error:', err)

      let errorMessage = 'Signup failed. Please try again.'

      if (err.response?.data) {
        const data = err.response.data
        if (data.company_name) errorMessage = data.company_name[0]
        else if (data.email) errorMessage = data.email[0]
        else if (data.password) errorMessage = data.password[0]
        else if (data.phone) errorMessage = data.phone[0]
        else if (data.message) errorMessage = data.message
        else if (data.error) errorMessage = data.error
        else {
          // Fallback for other validation errors
          errorMessage = Object.values(data).flat().join(', ')
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-primary bg-gradient py-5">
      <div className="card shadow-lg border-0" style={{ width: '550px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Create Your Company</h2>
            <p className="text-muted">Setup your HRMS and create admin account</p>
          </div>

          <Alert type="danger" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit}>
            {/* Company Info */}
            <div className="mb-3">
              <label className="form-label fw-bold">Company Name</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiBriefcase />
                </span>
                <input
                  type="text"
                  className="form-control"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., Odoo India"
                  required
                />
              </div>
            </div>

            {/* Admin Info */}
            <div className="mb-3">
              <label className="form-label fw-bold">Admin Details</label>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                  />
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <input
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FiMail />
                </span>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Admin Email"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FiPhone />
                </span>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
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
                  placeholder="Password (min 8 characters)"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FiLock />
                </span>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? 'Creating Company...' : 'Create Company & Admin Account'}
            </button>
          </form>

          <div className="text-center mt-3">
            <small className="text-muted">
              Already have an account? <Link to="/login" className="text-primary fw-bold">Sign In</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanySignup
