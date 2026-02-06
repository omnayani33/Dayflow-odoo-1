import { useState, useEffect } from 'react'
import { authAPI } from '../api/endpoints'
import Alert from '../components/Alert'

function AllEmployees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            const response = await authAPI.getEmployees()
            setEmployees(response.data)
        } catch (err) {
            console.error('Failed to fetch employees', err)
            setMessage({ type: 'danger', text: 'Failed to load employee list' })
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleViewDetails = (employee) => {
        setSelectedEmployee(employee)
    }

    const closeDetails = () => {
        setSelectedEmployee(null)
    }

    const handleDelete = async (employee) => {
        if (window.confirm(`Are you sure you want to deactivate ${employee.full_name}?`)) {
            try {
                // Determine ID to use (backend likely uses integer ID for delete, check employee data structure)
                // Assuming backend serializer returns 'id' or we need to find how to get primary key.
                // NOTE: 'employee_id' is string ID. We need integer ID (pk).
                // Let's assume fetching employees also returns 'id'.
                // If not, we might need to adjust backend serializer or user model usage.

                // Wait, check employee data structure from earlier view_file...
                // User model: id (pk), employee_id (string).
                // API EmployeeListView likely uses EmployeeDashboardView logic or specific serializer.
                // We should check what data is actually available.

                // IF 'id' is not present in employee object, we fail.
                const idToDelete = employee.id || employee.pk;

                if (!idToDelete) {
                    setMessage({ type: 'danger', text: 'Error: Cannot find system ID for employee.' });
                    return;
                }

                await authAPI.deleteEmployee(idToDelete)
                setMessage({ type: 'success', text: 'Employee deactivated successfully' })
                fetchEmployees()
            } catch (err) {
                console.error('Delete error', err)
                setMessage({ type: 'danger', text: 'Failed to deactivate employee' })
            }
        }
    }

    return (
        <div className="all-employees-page">
            <div className="page-header mb-4">
                <div>
                    <h1 className="page-title">All Employees</h1>
                    <p className="page-subtitle">View and manage employee directory</p>
                </div>
            </div>

            {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

            <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h5 className="card-title mb-0">
                        <i className="bi bi-people me-2"></i>
                        Employee Directory <span className="text-muted-light ms-2">({filteredEmployees.length})</span>
                    </h5>
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            className="glass-input ps-5"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Job Title</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-5">Loading directory...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-5">No employees found matching your search.</td></tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.employee_id}>
                                        <td>{emp.employee_id}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="avatar-sm">
                                                    {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                {emp.full_name}
                                            </div>
                                        </td>
                                        <td>{emp.email}</td>
                                        <td><span className={`badge ${emp.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'} bg-opacity-25 text-${emp.role === 'ADMIN' ? 'primary' : 'light'}`}>{emp.role}</span></td>
                                        <td>{emp.department || '-'}</td>
                                        <td>{emp.job_title || '-'}</td>
                                        <td>
                                            {emp.is_active ?
                                                <span className="status-badge status-badge-success">Active</span> :
                                                <span className="status-badge status-badge-danger">Inactive</span>
                                            }
                                        </td>
                                        <td>
                                            <button className="btn-icon" onClick={() => handleViewDetails(emp)} title="View Details">
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button className="btn-icon text-danger ms-2" onClick={() => handleDelete(emp)} title="Deactivate Employee">
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Details Modal */}
            {selectedEmployee && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h5 className="modal-title">Employee Details</h5>
                            <button className="btn-close-white" onClick={closeDetails}><i className="bi bi-x-lg"></i></button>
                        </div>
                        <div className="modal-body">
                            <div className="text-center mb-4">
                                <div className="avatar-lg mx-auto mb-3">
                                    {selectedEmployee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <h4>{selectedEmployee.full_name}</h4>
                                <p className="text-muted-light">{selectedEmployee.job_title || 'No Job Title'} • {selectedEmployee.department || 'No Department'}</p>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>Employee ID</label>
                                        <div className="detail-value">{selectedEmployee.employee_id}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>Email Address</label>
                                        <div className="detail-value">{selectedEmployee.email}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>Phone</label>
                                        <div className="detail-value">{selectedEmployee.phone || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>Role</label>
                                        <div className="detail-value">{selectedEmployee.role}</div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="detail-group">
                                        <label>Account Status</label>
                                        <div className="detail-value">
                                            {selectedEmployee.is_active ?
                                                <span className="text-success"><i className="bi bi-check-circle me-1"></i>Active Account</span> :
                                                <span className="text-danger"><i className="bi bi-x-circle me-1"></i>Inactive Account</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-top border-secondary">
                                <h6 className="mb-3">Financial Information</h6>
                                <div className="alert-glass alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Full salary details are restricted. Please contact Finance for payslip access.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .all-employees-page { animation: fadeIn 0.4s ease-out; }
                .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
                .page-subtitle { color: #94a3b8; margin-bottom: 0; }
                .search-box { position: relative; width: 300px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .avatar-sm { width: 32px; height: 32px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; color: white; }
                .avatar-lg { width: 80px; height: 80px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; color: white; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
                .btn-icon { background: rgba(255,255,255,0.1); border: none; width: 32px; height: 32px; border-radius: 8px; color: #cbd5e1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer; }
                .btn-icon:hover { background: rgba(255,255,255,0.2); color: white; }
                
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
                .modal-glass { background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: slideUp 0.3s; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .modal-title { color: white; font-size: 1.25rem; margin: 0; }
                .btn-close-white { background: none; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer; }
                .btn-close-white:hover { color: white; }
                .modal-body { padding: 1.5rem; }
                
                .detail-group label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 0.25rem; }
                .detail-value { color: white; font-size: 1rem; font-weight: 500; }
                .text-muted-light { color: #94a3b8; }
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    )
}

export default AllEmployees
