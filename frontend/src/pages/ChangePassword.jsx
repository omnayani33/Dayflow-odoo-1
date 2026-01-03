import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'
import { authUtils } from '../utils/authUtils'
import { authAPI } from '../api/endpoints'
import Alert from '../components/Alert'

function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isFirstLogin = authUtils.isFirstLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const payload = isFirstLogin 
        ? {
            new_password: formData.newPassword,
            confirm_password: formData.confirmPassword,
          }
        : {
            old_password: formData.oldPassword,
            new_password: formData.newPassword,
            confirm_password: formData.confirmPassword,
          }

      await authAPI.changePassword(payload)

      // Mark first login complete
      authUtils.markFirstLoginComplete()

      setSuccess('Password changed successfully! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    } catch (err) {
      console.error('Change password error:', err)
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || 'Password change failed. Please try again.'
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
            <h2 className="fw-bold text-primary">Change Password</h2>
            {isFirstLogin && (
              <div className="alert alert-warning mt-3">
                <strong>First Time Login!</strong>
                <p className="mb-0 small">Please change your password to continue.</p>
              </div>
            )}
          </div>

          <Alert type="danger" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} />

          <form onSubmit={handleSubmit}>
            {!isFirstLogin && (
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiLock />
                </span>
                <input
                  type="password"
                  className="form-control"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password (min 8 characters)"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm New Password</label>
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
                  placeholder="Confirm new password"
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
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
