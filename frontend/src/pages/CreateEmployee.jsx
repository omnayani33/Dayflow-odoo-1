import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/endpoints'
import Alert from '../components/Alert'

function CreateEmployee() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE'
    })
    const [employees, setEmployees] = useState([])
    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [createdUser, setCreatedUser] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            setFetching(true)
            const response = await authAPI.getEmployees()
            setEmployees(response.data)
        } catch (err) {
            console.error('Failed to fetch employees', err)
        } finally {
            setFetching(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (!formData.first_name || !formData.last_name || !formData.email) {
            setMessage({ type: 'danger', text: 'Please fill in all required fields' })
            return
        }

        try {
            setLoading(true)
            const response = await authAPI.createEmployee(formData)
            setCreatedUser(response.data)
            setMessage({ type: 'success', text: 'Employee created successfully!' })
            setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'EMPLOYEE' })
            fetchEmployees() // Refresh list
        } catch (err) {
            const errorMessage = err.response?.data?.email?.[0] || err.response?.data?.message || 'Failed to create employee'
            setMessage({ type: 'danger', text: errorMessage })
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="create-employee-page">
            <div className="page-header mb-4">
                <div>
                    <h1 className="page-title">Employee Management</h1>
                    <p className="page-subtitle">Add new employees and manage existing team members</p>
                </div>
                <button className="glass-btn" onClick={() => navigate('/dashboard')}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                </button>
            </div>

            {message.text && (
                <div className={`alert-glass alert-${message.type} mb-4`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                    {message.text}
                    <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}><i className="bi bi-x"></i></button>
                </div>
            )}

            {createdUser && (
                <div className="glass-card p-4 mb-4 created-user-card">
                    <h5 className="card-title mb-3"><i className="bi bi-person-check me-2 text-success"></i>Employee Created</h5>
                    <div className="user-details">
                        <div className="detail-row">
                            <span className="label">Name:</span>
                            <span className="value">{createdUser.full_name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Employee ID:</span>
                            <span className="value highlight">{createdUser.employee_id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Email:</span>
                            <span className="value">{createdUser.email}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Temporary Password:</span>
                            <span className="value highlight">{createdUser.temp_password}</span>
                        </div>
                    </div>
                    <p className="note mt-3"><i className="bi bi-info-circle me-2"></i>Share these credentials with the employee. They will be required to change password on first login.</p>
                </div>
            )}

            <div className="glass-card p-4 mb-5">
                <h5 className="card-title mb-4"><i className="bi bi-person-plus me-2"></i>Add New Employee</h5>
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label-glass">First Name *</label>
                            <input type="text" className="glass-input" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Enter first name" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-glass">Last Name *</label>
                            <input type="text" className="glass-input" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Enter last name" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-glass">Email *</label>
                            <input type="email" className="glass-input" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-glass">Phone</label>
                            <input type="text" className="glass-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-glass">Role</label>
                            <select className="glass-select w-100" name="role" value={formData.role} onChange={handleChange}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>
                        <div className="col-12 mt-4">
                            <button type="submit" className="glass-btn glass-btn-primary" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : <><i className="bi bi-person-plus me-2"></i>Create Employee</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Employee List Section */}
            <div className="glass-card p-4">
                <h5 className="card-title mb-4"><i className="bi bi-people me-2"></i>Employee Directory ({employees.length})</h5>
                <div className="glass-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fetching ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">Loading employees...</td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4" style={{ color: '#94a3b8' }}>No employees found.</td>
                                </tr>
                            ) : (
                                employees.map(emp => (
                                    <tr key={emp.employee_id}>
                                        <td>{emp.employee_id}</td>
                                        <td>{emp.full_name}</td>
                                        <td>{emp.email}</td>
                                        <td><span className={`badge ${emp.role === 'ADMIN' ? 'bg-primary' : emp.role === 'HR' ? 'bg-info' : 'bg-secondary'} bg-opacity-25 text-${emp.role === 'ADMIN' ? 'primary' : emp.role === 'HR' ? 'info' : 'light'}`}>{emp.role}</span></td>
                                        <td>
                                            {emp.is_active ?
                                                <span className="status-badge status-badge-success">Active</span> :
                                                <span className="status-badge status-badge-danger">Inactive</span>
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <style jsx>{`
        .create-employee-page { animation: fadeIn 0.4s ease-out; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
        .page-subtitle { color: #94a3b8; margin-bottom: 0; }
        .alert-glass { display: flex; align-items: center; padding: 0.875rem 1rem; border-radius: 12px; font-size: 0.9rem; position: relative; }
        .alert-glass.alert-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; }
        .card-title { color: white; display: flex; align-items: center; }
        .form-label-glass { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
        .glass-select { padding: 0.75rem 2.5rem 0.75rem 1rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; font-size: 1rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }
        .glass-select option { background: #1e293b; }
        .created-user-card { border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
        .user-details { display: grid; gap: 0.75rem; }
        .detail-row { display: flex; gap: 1rem; }
        .detail-row .label { color: #64748b; min-width: 140px; }
        .detail-row .value { color: white; font-weight: 500; }
        .detail-row .value.highlight { color: #34d399; font-family: monospace; font-size: 1rem; }
        .note { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
        </div>
    )
}

export default CreateEmployee
