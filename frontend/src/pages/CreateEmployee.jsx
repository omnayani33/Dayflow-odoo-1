import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/endpoints'

function CreateEmployee() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [createdEmployee, setCreatedEmployee] = useState(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    year_of_joining: new Date().getFullYear()
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setMessage({ type: 'danger', text: 'Please fill all required fields' })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      const response = await authAPI.createEmployee(formData)

      setCreatedEmployee({
        ...response.data.employee,
        temp_password: response.data.temporary_password
      })

      setMessage({ type: 'success', text: 'Employee created successfully!' })

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        year_of_joining: new Date().getFullYear()
      })
    } catch (err) {
      console.error('Create employee error:', err)
      const errorMsg = err.response?.data?.email?.[0] ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create employee'
      setMessage({ type: 'danger', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-employee-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/employees')}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h1>Create Employee</h1>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Created Employee Info */}
      {createdEmployee && (
        <div className="created-info">
          <h3>Employee Created Successfully!</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Employee ID</label>
              <span className="highlight">{createdEmployee.employee_id}</span>
            </div>
            <div className="info-item">
              <label>Name</label>
              <span>{createdEmployee.full_name}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{createdEmployee.email}</span>
            </div>
            <div className="info-item">
              <label>Temporary Password</label>
              <span className="highlight password">{createdEmployee.temp_password}</span>
            </div>
          </div>
          <p className="note">
            <i className="bi bi-info-circle"></i>
            Share these credentials with the employee. They must change the password on first login.
          </p>
          <button className="btn-primary" onClick={() => setCreatedEmployee(null)}>
            Create Another Employee
          </button>
        </div>
      )}

      {/* Create Form */}
      {!createdEmployee && (
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Joining</label>
              <input
                type="number"
                name="year_of_joining"
                value={formData.year_of_joining}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/employees')}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-lg me-2"></i>
                  Create Employee
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .create-employee-page {
          max-width: 700px;
          color: white;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .back-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .page-header h1 {
          font-size: 1.5rem;
          margin: 0;
        }

        .alert-box {
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 6px;
        }

        .alert-box.alert-success {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.5);
          color: #34d399;
        }

        .alert-box.alert-danger {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #f87171;
        }

        .alert-box button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .created-info {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .created-info h3 {
          color: #34d399;
          margin: 0 0 1.5rem;
          font-size: 1.1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
        }

        .info-item span {
          font-size: 0.95rem;
          color: white;
        }

        .info-item .highlight {
          color: #34d399;
          font-weight: 600;
        }

        .info-item .password {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
        }

        .note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 1rem 0;
        }

        .btn-primary {
          background: #8b5cf6;
          border: none;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #7c3aed;
        }

        .create-form {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          color: white;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #8b5cf6;
        }

        .form-group input::placeholder {
          color: #64748b;
        }

        .form-group select option {
          background: #1e293b;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .btn-submit {
          background: #8b5cf6;
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 0.95rem;
          transition: background 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #7c3aed;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default CreateEmployee
