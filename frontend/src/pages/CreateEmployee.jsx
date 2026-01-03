import { useState } from 'react'
import { FiUser, FiMail, FiPhone, FiUsers, FiKey } from 'react-icons/fi'
import { authAPI } from '../api/endpoints'

function CreateEmployee() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    year_of_joining: new Date().getFullYear()
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [createdEmployee, setCreatedEmployee] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setMessage({ type: 'danger', text: 'Please fill all required fields' })
      return
    }

    try {
      setSubmitting(true)
      const response = await authAPI.createEmployee(formData)
      
      setMessage({ type: 'success', text: 'Employee created successfully!' })
      setCreatedEmployee(response.data)
      
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
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.error || err.response?.data?.email?.[0] || 'Failed to create employee' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div>
      <h2 className="mb-4">Create New Employee</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Success Card with Credentials */}
      {createdEmployee && (
        <div className="card mb-4 border-success">
          <div className="card-header bg-success text-white">
            <FiKey className="me-2" />
            Employee Created Successfully
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Employee ID</small>
                <strong className="text-primary">{createdEmployee.employee.employee_id}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Full Name</small>
                <strong>{createdEmployee.employee.full_name}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Email</small>
                <strong>{createdEmployee.employee.email}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Temporary Password</small>
                <code className="bg-dark text-warning p-2 rounded">
                  {createdEmployee.temporary_password}
                </code>
              </div>
              <div className="col-12">
                <div className="alert alert-warning mb-0">
                  <strong>Important:</strong> {createdEmployee.note}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Form */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FiUser className="me-2" />
                  First Name *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FiUser className="me-2" />
                  Last Name *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FiMail className="me-2" />
                  Email *
                </label>
                <input 
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john.doe@company.com"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FiPhone className="me-2" />
                  Phone
                </label>
                <input 
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FiUsers className="me-2" />
                  Role *
                </label>
                <select 
                  className="form-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR Officer</option>
                </select>
                <small className="text-muted">Admin role can only be set during company signup</small>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Year of Joining *</label>
                <input 
                  type="number"
                  className="form-control"
                  name="year_of_joining"
                  value={formData.year_of_joining}
                  onChange={handleChange}
                  required
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            <div className="alert alert-info">
              <strong>Note:</strong> A temporary password will be auto-generated. The employee must change it on first login.
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Employee'}
            </button>
          </form>
        </div>
      </div>

      {/* Employee ID Format Info */}
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Employee ID Format</h5>
          <p className="mb-2">
            Employee IDs are auto-generated in the format: 
            <code className="ms-2">OI[CompanyCode][NameCode][Year][SerialNum]</code>
          </p>
          <small className="text-muted">
            Example: OIODINJODO20260001
            <ul className="mt-2">
              <li>OI - Prefix (App/Company)</li>
              <li>ODIN - First 2 letters of company name words</li>
              <li>JODO - First 2 letters of employee first and last name</li>
              <li>2026 - Year of joining</li>
              <li>0001 - Serial number</li>
            </ul>
          </small>
        </div>
      </div>
    </div>
  )
}

export default CreateEmployee
