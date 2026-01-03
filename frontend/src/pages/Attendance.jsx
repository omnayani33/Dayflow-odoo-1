import { useState, useEffect } from 'react'
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { attendanceAPI } from '../api/endpoints'

function Attendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  
  const today = new Date()
  const month = today.getMonth() + 1
  const year = today.getFullYear()

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await attendanceAPI.getMyAttendance(month, year)
      setRecords(response.data.records || [])
    } catch (err) {
      console.error('Attendance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setChecking(true)
      await attendanceAPI.checkInOut('check_in')
      setMessage('Checked in successfully!')
      fetchAttendance()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-in failed')
    } finally {
      setChecking(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setChecking(true)
      await attendanceAPI.checkInOut('check_out')
      setMessage('Checked out successfully!')
      fetchAttendance()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-out failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4">Attendance Management</h2>

      {message && (
        <div className="alert alert-info alert-dismissible">
          {message}
          <button className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Check In/Out Card */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Today's Attendance</h5>
          <div className="d-flex gap-3">
            <button 
              className="btn btn-success" 
              onClick={handleCheckIn}
              disabled={checking}
            >
              <FiClock className="me-2" />
              Check In
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleCheckOut}
              disabled={checking}
            >
              <FiClock className="me-2" />
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Attendance History</h5>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.check_in || '-'}</td>
                      <td>{record.check_out || '-'}</td>
                      <td>{record.work_hours || '-'}</td>
                      <td>
                        <span className={`badge bg-${record.status === 'PRESENT' ? 'success' : 'danger'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Attendance
