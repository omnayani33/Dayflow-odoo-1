import { useState, useEffect } from 'react'
import { attendanceAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Attendance() {
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ present: 0, leaves: 0, totalDays: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  const isAdmin = authUtils.isAdmin()

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchAttendance()
  }, [selectedMonth, selectedYear])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await attendanceAPI.getMyAttendance(selectedMonth + 1, selectedYear)
      const data = response.data.records || []
      setRecords(data)

      // Calculate summary
      const present = data.filter(r => r.status === 'PRESENT').length
      const leaves = data.filter(r => r.status === 'LEAVE').length
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      setSummary({ present, leaves, totalDays })
    } catch (err) {
      console.error('Fetch attendance error:', err)
      // Mock data for demo
      const mockRecords = [
        { date: '2025-10-28', check_in: '10:00', check_out: '19:00', work_hours: '09:00', extra_hours: '01:00' },
        { date: '2025-10-29', check_in: '10:00', check_out: '19:00', work_hours: '09:00', extra_hours: '01:00' },
      ]
      setRecords(mockRecords)
      setSummary({ present: 20, leaves: 2, totalDays: 22 })
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      await attendanceAPI.checkIn()
      setMessage({ type: 'success', text: 'Checked in successfully!' })
      fetchAttendance()
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
      setMessage({ type: 'success', text: 'Checked out successfully!' })
      fetchAttendance()
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Check-out failed' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="attendance-page">
      {/* Page Title */}
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
      </div>

      {/* Controls Row: Month Navigation + Summary Cards */}
      <div className="controls-row">
        {/* Month Navigation */}
        <div className="month-nav">
          <button className="nav-btn" onClick={handlePrevMonth}>&lt;-</button>
          <button className="nav-btn" onClick={handleNextMonth}>-&gt;</button>
          <div className="month-select">
            {months[selectedMonth].slice(0, 3)} ∨
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-label">Count of<br />days present</span>
            <span className="card-value">{summary.present}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Leaves count</span>
            <span className="card-value">{summary.leaves}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Total working<br />days</span>
            <span className="card-value">{summary.totalDays}</span>
          </div>
        </div>

        {/* Check In/Out Buttons (for employees) */}
        {!isAdmin && (
          <div className="check-buttons">
            <button
              className="check-btn check-in"
              onClick={handleCheckIn}
              disabled={actionLoading}
            >
              Check In →
            </button>
            <button
              className="check-btn check-out"
              onClick={handleCheckOut}
              disabled={actionLoading}
            >
              Check Out →
            </button>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Current Date Display */}
      <div className="current-date">
        {currentDate.getDate()},{months[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      {/* Attendance Table */}
      <div className="attendance-table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Extra hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No records found</td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.check_in || '-'}</td>
                    <td>{record.check_out || '-'}</td>
                    <td>{record.work_hours || '-'}</td>
                    <td>{record.extra_hours || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .attendance-page {
          color: white;
        }

        .page-header {
          margin-bottom: 1rem;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 500;
          color: white;
          margin: 0;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: inline-block;
        }

        .controls-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .month-select {
          padding: 0.5rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 0.9rem;
        }

        .summary-cards {
          display: flex;
          gap: 0.5rem;
        }

        .summary-card {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          text-align: center;
          min-width: 90px;
        }

        .card-label {
          display: block;
          font-size: 0.7rem;
          color: #94a3b8;
          line-height: 1.2;
        }

        .card-value {
          display: block;
          font-size: 1rem;
          font-weight: 500;
          color: white;
          margin-top: 0.25rem;
        }

        .check-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-left: auto;
        }

        .check-btn {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: white;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .check-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .alert-box {
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .current-date {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        .attendance-table-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow-x: auto;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }

        .attendance-table th,
        .attendance-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .attendance-table th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 500;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .attendance-table td {
          font-size: 0.9rem;
          color: white;
        }

        .attendance-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .loading, .no-data {
          text-align: center;
          padding: 2rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .controls-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .check-buttons {
            margin-left: 0;
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  )
}

export default Attendance
