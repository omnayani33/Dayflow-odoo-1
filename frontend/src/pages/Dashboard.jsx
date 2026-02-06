import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const isAdmin = authUtils.isAdmin()
    const userInfo = authUtils.getUserInfo()

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const response = isAdmin
                ? await dashboardAPI.getAdminDashboard()
                : await dashboardAPI.getEmployeeDashboard()
            setData(response.data)
        } catch (err) {
            console.error('Dashboard error:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3" style={{ color: '#94a3b8' }}>Loading dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert-glass alert-danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header mb-4">
                <div>
                    <h1 className="mb-1" style={{ color: 'white', fontSize: '1.75rem' }}>Welcome back, {userInfo?.full_name || 'User'}!</h1>
                    <p style={{ color: '#94a3b8', marginBottom: 0 }}>
                        <i className="bi bi-person-badge me-2"></i>
                        {userInfo?.employee_id} • {userInfo?.role}
                    </p>
                </div>
                <div className="header-actions">
                    <span className="current-date">
                        <i className="bi bi-calendar3 me-2"></i>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {!isAdmin && data ? (
                <div className="employee-dashboard">
                    {/* Quick Actions */}
                    <div className="row g-4 mb-4">
                        <div className="col-6 col-md-3">
                            <Link to="/attendance" className="quick-action-card glass-card">
                                <div className="quick-action-icon bg-primary-glow">
                                    <i className="bi bi-clock-history"></i>
                                </div>
                                <span className="quick-action-title">Attendance</span>
                                <span className="quick-action-subtitle">Check In/Out</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link to="/leave" className="quick-action-card glass-card">
                                <div className="quick-action-icon bg-success-glow">
                                    <i className="bi bi-calendar-plus"></i>
                                </div>
                                <span className="quick-action-title">Leave</span>
                                <span className="quick-action-subtitle">Apply Now</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link to="/payroll" className="quick-action-card glass-card">
                                <div className="quick-action-icon bg-warning-glow">
                                    <i className="bi bi-wallet2"></i>
                                </div>
                                <span className="quick-action-title">Payslip</span>
                                <span className="quick-action-subtitle">View Details</span>
                            </Link>
                        </div>
                        <div className="col-6 col-md-3">
                            <Link to="/profile" className="quick-action-card glass-card">
                                <div className="quick-action-icon bg-purple-glow">
                                    <i className="bi bi-person-circle"></i>
                                </div>
                                <span className="quick-action-title">Profile</span>
                                <span className="quick-action-subtitle">View Profile</span>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-primary">
                                <div className="stat-card-icon bg-primary-glow">
                                    <i className="bi bi-calendar-check"></i>
                                </div>
                                <div className="stat-card-value">{data.attendance?.days_present || 0}/{data.attendance?.working_days || 0}</div>
                                <div className="stat-card-label">Attendance This Month</div>
                                <div className="progress-custom">
                                    <div className="progress-bar progress-bar-primary" style={{ width: `${data.attendance?.attendance_percentage || 0}%` }}></div>
                                </div>
                                <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                                    {data.attendance?.attendance_percentage?.toFixed(1) || 0}% attendance rate
                                </small>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-success">
                                <div className="stat-card-icon bg-success-glow">
                                    <i className="bi bi-calendar-event"></i>
                                </div>
                                <div className="stat-card-value">{data.leaves?.paid_leave_available || 0}</div>
                                <div className="stat-card-label">Paid Leaves Available</div>
                                <div className="progress-custom">
                                    <div className="progress-bar progress-bar-success" style={{ width: `${(data.leaves?.paid_leave_available / data.leaves?.paid_leave_total) * 100 || 0}%` }}></div>
                                </div>
                                <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                                    out of {data.leaves?.paid_leave_total || 24} total days
                                </small>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-warning">
                                <div className="stat-card-icon bg-warning-glow">
                                    <i className="bi bi-bandaid"></i>
                                </div>
                                <div className="stat-card-value">{data.leaves?.sick_leave_available || 0}</div>
                                <div className="stat-card-label">Sick Leaves Available</div>
                                <div className="progress-custom">
                                    <div className="progress-bar progress-bar-warning" style={{ width: `${(data.leaves?.sick_leave_available / data.leaves?.sick_leave_total) * 100 || 0}%` }}></div>
                                </div>
                                <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                                    out of {data.leaves?.sick_leave_total || 7} total days
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            ) : isAdmin && data ? (
                <div className="admin-dashboard">
                    {/* Summary Stats */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3 col-6">
                            <div className="glass-card stat-card glass-card-primary">
                                <div className="stat-card-icon bg-primary-glow">
                                    <i className="bi bi-people-fill"></i>
                                </div>
                                <div className="stat-card-value">{data.summary?.total_employees || 0}</div>
                                <div className="stat-card-label">Total Employees</div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="glass-card stat-card glass-card-success">
                                <div className="stat-card-icon bg-success-glow">
                                    <i className="bi bi-check-circle-fill"></i>
                                </div>
                                <div className="stat-card-value">{data.attendance_today?.PRESENT || 0}</div>
                                <div className="stat-card-label">Present Today</div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="glass-card stat-card glass-card-danger">
                                <div className="stat-card-icon bg-danger-glow">
                                    <i className="bi bi-x-circle-fill"></i>
                                </div>
                                <div className="stat-card-value">{data.attendance_today?.ABSENT || 0}</div>
                                <div className="stat-card-label">Absent Today</div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="glass-card stat-card glass-card-warning">
                                <div className="stat-card-icon bg-warning-glow">
                                    <i className="bi bi-hourglass-split"></i>
                                </div>
                                <div className="stat-card-value">{data.summary?.pending_leaves || 0}</div>
                                <div className="stat-card-label">Pending Approvals</div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Quick Actions */}
                    <div className="glass-card p-4">
                        <h5 style={{ color: 'white', marginBottom: '1rem' }}>
                            <i className="bi bi-lightning me-2"></i>Quick Actions
                        </h5>
                        <div className="admin-actions-grid">
                            <Link to="/create-employee" className="admin-action-btn">
                                <i className="bi bi-person-plus"></i>
                                <span>Add Employee</span>
                            </Link>
                            <Link to="/approvals" className="admin-action-btn">
                                <i className="bi bi-check2-square"></i>
                                <span>Approvals</span>
                                {data.summary?.pending_leaves > 0 && (
                                    <span className="action-badge">{data.summary.pending_leaves}</span>
                                )}
                            </Link>
                            <Link to="/attendance" className="admin-action-btn">
                                <i className="bi bi-calendar-range"></i>
                                <span>Attendance</span>
                            </Link>
                            <Link to="/payroll" className="admin-action-btn">
                                <i className="bi bi-currency-dollar"></i>
                                <span>Payroll</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}

            <style jsx>{`
        .dashboard-page { animation: fadeIn 0.4s ease-out; }
        .dashboard-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .current-date { display: inline-flex; align-items: center; padding: 0.5rem 1rem; background: rgba(255,255,255,0.06); border-radius: 8px; font-size: 0.9rem; color: #cbd5e1; }
        
        .quick-action-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 1rem; text-decoration: none; color: white; }
        .quick-action-card:hover { color: white; }
        .quick-action-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 0.75rem; }
        .bg-primary-glow { background: linear-gradient(135deg, rgba(37,99,235,0.3), rgba(37,99,235,0.1)); color: #60a5fa; }
        .bg-success-glow { background: linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1)); color: #34d399; }
        .bg-warning-glow { background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1)); color: #fbbf24; }
        .bg-danger-glow { background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1)); color: #f87171; }
        .bg-purple-glow { background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1)); color: #a78bfa; }
        .quick-action-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .quick-action-subtitle { font-size: 0.8rem; color: #94a3b8; }
        
        .stat-card { position: relative; overflow: hidden; }
        .stat-card-icon { position: absolute; right: 1rem; top: 1rem; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .stat-card-value { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem; }
        .stat-card-label { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem; }
        
        .admin-actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .admin-action-btn { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.25rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; text-decoration: none; color: #cbd5e1; transition: all 0.2s; position: relative; }
        .admin-action-btn:hover { background: rgba(255,255,255,0.08); color: white; transform: translateY(-2px); }
        .admin-action-btn i { font-size: 1.5rem; color: #3b82f6; }
        .action-badge { position: absolute; top: 0.5rem; right: 0.5rem; background: #ef4444; color: white; font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; }
        
        .alert-glass { display: flex; align-items: center; padding: 1rem 1.25rem; border-radius: 12px; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { .admin-actions-grid { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    )
}

export default Dashboard
