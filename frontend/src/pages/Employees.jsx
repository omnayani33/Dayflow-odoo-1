import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'

function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()
    const isAdmin = authUtils.isAdmin()

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            // Mock data - in production this would come from API
            // The backend doesn't have an employee list endpoint for non-admins
            const mockEmployees = [
                { id: 1, full_name: 'John Doe', employee_id: 'EMP001', status: 'present', department: 'Engineering', job_title: 'Developer' },
                { id: 2, full_name: 'Jane Smith', employee_id: 'EMP002', status: 'absent', department: 'HR', job_title: 'HR Manager' },
                { id: 3, full_name: 'Mike Johnson', employee_id: 'EMP003', status: 'leave', department: 'Finance', job_title: 'Accountant' },
                { id: 4, full_name: 'Sarah Williams', employee_id: 'EMP004', status: 'checked_out', department: 'Marketing', job_title: 'Marketing Lead' },
                { id: 5, full_name: 'David Brown', employee_id: 'EMP005', status: 'present', department: 'Engineering', job_title: 'Senior Developer' },
                { id: 6, full_name: 'Emily Davis', employee_id: 'EMP006', status: 'present', department: 'Design', job_title: 'UI Designer' },
                { id: 7, full_name: 'Robert Wilson', employee_id: 'EMP007', status: 'absent', department: 'Sales', job_title: 'Sales Rep' },
                { id: 8, full_name: 'Lisa Anderson', employee_id: 'EMP008', status: 'present', department: 'Engineering', job_title: 'QA Engineer' },
            ]
            setEmployees(mockEmployees)
        } catch (err) {
            console.error('Error fetching employees:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return '#10b981' // Green
            case 'checked_out': return '#ef4444' // Red
            case 'absent': return '#f59e0b' // Yellow
            case 'leave': return '#3b82f6' // Blue (On Leave)
            default: return '#94a3b8'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'present': return 'Present'
            case 'checked_out': return 'Checked Out'
            case 'absent': return 'Absent'
            case 'leave': return 'On Leave'
            default: return 'Unknown'
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCardClick = (employee) => {
        // Navigate to employee profile in view-only mode
        navigate(`/profile/${employee.id}`, { state: { viewOnly: true, employee } })
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary"></div>
                <p>Loading employees...</p>
            </div>
        )
    }

    return (
        <div className="employees-page">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Employees</h1>
                <div className="header-actions">
                    {isAdmin && (
                        <button className="btn-new" onClick={() => navigate('/create-employee')}>
                            NEW
                        </button>
                    )}
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Employee Cards Grid */}
            <div className="employees-grid">
                {filteredEmployees.map((employee) => (
                    <div
                        key={employee.id}
                        className="employee-card"
                        onClick={() => handleCardClick(employee)}
                    >
                        {/* Status Indicator */}
                        <div
                            className="status-dot"
                            style={{ backgroundColor: getStatusColor(employee.status) }}
                            title={getStatusLabel(employee.status)}
                        ></div>

                        {/* Profile Photo */}
                        <div className="employee-photo">
                            <i className="bi bi-person-fill"></i>
                        </div>

                        {/* Employee Name */}
                        <p className="employee-name">{employee.full_name}</p>
                    </div>
                ))}
            </div>

            {/* Settings Link (as shown in wireframe) */}
            <div className="settings-link">
                <span>Settings</span>
            </div>

            <style jsx>{`
        .employees-page {
          padding: 0;
          min-height: 100%;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #94a3b8;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-new {
          padding: 0.5rem 1.25rem;
          background: #8b5cf6;
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-new:hover {
          background: #7c3aed;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 0.5rem 1rem;
        }

        .search-box i {
          color: #94a3b8;
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          width: 150px;
        }

        .search-box input::placeholder {
          color: #64748b;
        }

        .employees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1.25rem;
          max-width: 900px;
        }

        .employee-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .employee-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .status-dot {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .employee-photo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }

        .employee-photo i {
          font-size: 2.5rem;
          color: #64748b;
        }

        .employee-name {
          color: #60a5fa;
          font-size: 0.85rem;
          margin: 0;
          text-align: center;
          font-weight: 500;
        }

        .settings-link {
          position: fixed;
          bottom: 1.5rem;
          left: 280px;
          color: #64748b;
          font-size: 0.9rem;
        }

        @media (max-width: 991px) {
          .settings-link {
            left: 1.5rem;
          }
        }
      `}</style>
        </div>
    )
}

export default Employees
