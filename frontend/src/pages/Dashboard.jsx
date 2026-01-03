import { useState, useEffect } from 'react'
import { FiUsers, FiClock, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger">{error}</div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Welcome back, {userInfo.full_name}!</h2>
          <p className="text-muted">{userInfo.employee_id}</p>
        </div>
      </div>

      {!isAdmin && data ? (
        // Employee Dashboard
        <div>
          {/* Attendance Card */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded p-3">
                        <FiClock size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Attendance</h6>
                      <h3 className="mb-0">{data.attendance?.days_present || 0}/{data.attendance?.working_days || 0}</h3>
                    </div>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${data.attendance?.attendance_percentage || 0}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">{data.attendance?.attendance_percentage || 0}% attendance this month</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-success bg-opacity-10 text-success rounded p-3">
                        <FiCalendar size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Paid Leave</h6>
                      <h3 className="mb-0">{data.leaves?.paid_leave_available || 0}/{data.leaves?.paid_leave_total || 0}</h3>
                    </div>
                  </div>
                  <small className="text-muted">Available / Total</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-warning bg-opacity-10 text-warning rounded p-3">
                        <FiAlertCircle size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Sick Leave</h6>
                      <h3 className="mb-0">{data.leaves?.sick_leave_available || 0}/{data.leaves?.sick_leave_total || 0}</h3>
                    </div>
                  </div>
                  <small className="text-muted">Available / Total</small>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Status */}
          {data.attendance?.today && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">Today's Status</h5>
                <div className="d-flex align-items-center">
                  <FiCheckCircle className="text-success me-2" size={24} />
                  <div>
                    <strong className="text-success">{data.attendance.today.status}</strong>
                    {data.attendance.today.check_in && (
                      <p className="mb-0 text-muted">
                        Check In: {data.attendance.today.check_in}
                        {data.attendance.today.check_out && ` | Check Out: ${data.attendance.today.check_out}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isAdmin && data ? (
        // Admin Dashboard
        <div>
          {/* Summary Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded p-3">
                        <FiUsers size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Total Employees</h6>
                      <h3 className="mb-0">{data.summary?.total_employees || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-warning bg-opacity-10 text-warning rounded p-3">
                        <FiAlertCircle size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Pending Leaves</h6>
                      <h3 className="mb-0">{data.summary?.pending_leaves || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <div className="bg-success bg-opacity-10 text-success rounded p-3">
                        <FiCheckCircle size={24} />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-muted mb-0">Today's Present</h6>
                      <h3 className="mb-0">{data.attendance_today?.PRESENT || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Attendance Breakdown */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Today's Attendance Overview</h5>
              <div className="row text-center">
                <div className="col-4">
                  <FiCheckCircle className="text-success mb-2" size={32} />
                  <h4 className="mb-0">{data.attendance_today?.PRESENT || 0}</h4>
                  <small className="text-muted">Present</small>
                </div>
                <div className="col-4">
                  <FiXCircle className="text-danger mb-2" size={32} />
                  <h4 className="mb-0">{data.attendance_today?.ABSENT || 0}</h4>
                  <small className="text-muted">Absent</small>
                </div>
                <div className="col-4">
                  <FiCalendar className="text-warning mb-2" size={32} />
                  <h4 className="mb-0">{data.attendance_today?.LEAVE || 0}</h4>
                  <small className="text-muted">On Leave</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Dashboard
