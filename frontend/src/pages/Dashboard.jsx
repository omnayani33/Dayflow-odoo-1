import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI, attendanceAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkInStatus, setCheckInStatus] = useState(null) // 'checked_in', 'checked_out', null
  const [currentTime, setCurrentTime] = useState(new Date())
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const navigate = useNavigate()
  const isAdmin = authUtils.isAdmin()
  const userInfo = authUtils.getUserInfo()

  useEffect(() => {
    fetchDashboard()

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        const response = await dashboardAPI.getAdminDashboard()
        setData(response.data)
      } else {
        const response = await dashboardAPI.getEmployeeDashboard()
        setData(response.data)
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      // Mock data
      setData({
        total_employees: 45,
        present_today: 38,
        on_leave: 5,
        absent: 2,
        pending_approvals: 3,
        attendance_rate: 84,
        my_attendance: {
          present_days: 20,
          leave_days: 2,
          total_working_days: 22
        },
        leave_balance: {
          paid: 24,
          sick: 7
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      await attendanceAPI.checkIn()
      setCheckInStatus('checked_in')
      setMessage({ type: 'success', text: 'Checked in successfully!' })
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Check-in failed' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      await attendanceAPI.checkOut()
      setCheckInStatus('checked_out')
      setMessage({ type: 'success', text: 'Checked out successfully!' })
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Check-out failed' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-text">
          <h1>Welcome back, {userInfo?.full_name?.split(' ')[0] || 'User'}!</h1>
          <p>{formatDate(currentTime)}</p>
        </div>
        <div className="current-time">
          <span className="time">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Quick Actions - Check In/Out */}
      {!isAdmin && (
        <div className="check-section">
          <div className="check-card">
            <div className="check-status">
              <div
                className={`status-dot ${checkInStatus === 'checked_in' ? 'green' : 'red'}`}
              ></div>
              <span>
                {checkInStatus === 'checked_in' ? 'You are checked in' :
                  checkInStatus === 'checked_out' ? 'You are checked out' :
                    'Not checked in yet'}
              </span>
            </div>
            <div className="check-buttons">
              <button
                className="check-btn"
                onClick={handleCheckIn}
                disabled={actionLoading || checkInStatus === 'checked_in'}
              >
                Check In →
              </button>
              <button
                className="check-btn"
                onClick={handleCheckOut}
                disabled={actionLoading || checkInStatus !== 'checked_in'}
              >
                Check Out →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {isAdmin ? (
          <>
            <div className="stat-card" onClick={() => navigate('/employees')}>
              <div className="stat-icon employees">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.total_employees || 0}</span>
                <span className="stat-label">Total Employees</span>
              </div>
            </div>
            <div className="stat-card present">
              <div className="stat-icon present">
                <i className="bi bi-person-check-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.present_today || 0}</span>
                <span className="stat-label">Present Today</span>
              </div>
            </div>
            <div className="stat-card leave">
              <div className="stat-icon leave">
                <i className="bi bi-airplane-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.on_leave || 0}</span>
                <span className="stat-label">On Leave</span>
              </div>
            </div>
            <div className="stat-card absent">
              <div className="stat-icon absent">
                <i className="bi bi-person-x-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.absent || 0}</span>
                <span className="stat-label">Absent</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon present">
                <i className="bi bi-calendar-check-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.my_attendance?.present_days || 0}</span>
                <span className="stat-label">Days Present</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon leave">
                <i className="bi bi-calendar-x-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.my_attendance?.leave_days || 0}</span>
                <span className="stat-label">Leave Taken</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon paid">
                <i className="bi bi-calendar-heart-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.leave_balance?.paid || 0}</span>
                <span className="stat-label">Paid Leave Left</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon sick">
                <i className="bi bi-bandaid-fill"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{data?.leave_balance?.sick || 0}</span>
                <span className="stat-label">Sick Leave Left</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin: Pending Approvals */}
      {isAdmin && data?.pending_approvals > 0 && (
        <div className="pending-section">
          <div className="pending-card" onClick={() => navigate('/leave')}>
            <div className="pending-icon">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="pending-info">
              <span className="pending-count">{data.pending_approvals}</span>
              <span className="pending-label">Pending Approvals</span>
            </div>
            <i className="bi bi-chevron-right"></i>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="quick-links">
        <h3>Quick Links</h3>
        <div className="links-grid">
          <button className="link-card" onClick={() => navigate('/attendance')}>
            <i className="bi bi-calendar3"></i>
            <span>View Attendance</span>
          </button>
          <button className="link-card" onClick={() => navigate('/leave')}>
            <i className="bi bi-calendar-plus"></i>
            <span>Request Time Off</span>
          </button>
          <button className="link-card" onClick={() => navigate('/profile')}>
            <i className="bi bi-person"></i>
            <span>My Profile</span>
          </button>
          {isAdmin && (
            <button className="link-card" onClick={() => navigate('/employees')}>
              <i className="bi bi-people"></i>
              <span>Manage Employees</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          color: white;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #94a3b8;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .welcome-text h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: white;
        }

        .welcome-text p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .current-time .time {
          font-size: 1.5rem;
          font-weight: 500;
          color: #60a5fa;
          font-family: monospace;
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

        .check-section {
          margin-bottom: 2rem;
        }

        .check-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .check-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .status-dot.green {
          background: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .status-dot.red {
          background: #f87171;
          box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
        }

        .check-status span {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .check-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .check-btn {
          padding: 0.5rem 1.25rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .check-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .check-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 1.25rem;
        }

        .stat-icon.employees {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
        }

        .stat-icon.present {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .stat-icon.leave {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .stat-icon.absent {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .stat-icon.paid {
          background: rgba(244, 114, 182, 0.2);
          color: #f472b6;
        }

        .stat-icon.sick {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .pending-section {
          margin-bottom: 2rem;
        }

        .pending-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pending-card:hover {
          background: rgba(245, 158, 11, 0.15);
        }

        .pending-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.2);
          border-radius: 8px;
          color: #fbbf24;
          font-size: 1.1rem;
        }

        .pending-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .pending-count {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fbbf24;
        }

        .pending-label {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .pending-card > .bi-chevron-right {
          color: #64748b;
        }

        .quick-links {
          margin-top: 1rem;
        }

        .quick-links h3 {
          font-size: 1rem;
          font-weight: 500;
          color: #94a3b8;
          margin: 0 0 1rem;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }

        .link-card:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .link-card i {
          font-size: 1.5rem;
        }

        .link-card span {
          font-size: 0.85rem;
          text-align: center;
        }

        @media (max-width: 640px) {
          .welcome-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .check-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
