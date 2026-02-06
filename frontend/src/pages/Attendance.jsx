import { useState, useEffect } from 'react'
import { attendanceAPI } from '../api/endpoints'

function Attendance() {
    const [records, setRecords] = useState([])
    const [todayStatus, setTodayStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const currentDate = new Date()
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

    useEffect(() => {
        fetchAttendance()
    }, [selectedMonth, selectedYear])

    const fetchAttendance = async () => {
        try {
            setLoading(true)
            const response = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear)
            setRecords(response.data.records || [])
            const today = new Date().toISOString().split('T')[0]
            const todayRecord = response.data.records?.find(r => r.date === today)
            setTodayStatus(todayRecord || null)
        } catch (err) {
            console.error('Fetch attendance error:', err)
            setMessage({ type: 'danger', text: 'Failed to load attendance records' })
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async () => {
        try {
            setActionLoading(true)
            const response = await attendanceAPI.checkIn()
            setMessage({ type: 'success', text: response.data.message || 'Checked in successfully!' })
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
            const response = await attendanceAPI.checkOut()
            setMessage({ type: 'success', text: response.data.message || 'Checked out successfully!' })
            fetchAttendance()
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Check-out failed' })
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'PRESENT': { class: 'status-badge-success', icon: 'bi-check-circle' },
            'ABSENT': { class: 'status-badge-danger', icon: 'bi-x-circle' },
            'LEAVE': { class: 'status-badge-warning', icon: 'bi-calendar-event' },
            'HALF_DAY': { class: 'status-badge-info', icon: 'bi-circle-half' },
        }
        const config = statusMap[status] || { class: 'status-badge-info', icon: 'bi-question-circle' }
        return (
            <span className={`status-badge ${config.class}`}>
                <i className={`bi ${config.icon} me-1`}></i>
                {status}
            </span>
        )
    }

    return (
        <div className="attendance-page">
            <div className="page-header mb-4">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track your daily attendance and work hours</p>
                </div>
            </div>

            {message.text && (
                <div className={`alert-glass alert-${message.type} mb-4`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                    {message.text}
                    <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}>
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            )}

            {/* Check In/Out Card */}
            <div className="glass-card p-4 mb-4">
                <div className="checkin-section">
                    <div className="current-time-display">
                        <div className="time-label">Current Time</div>
                        <div className="time-value">
                            {currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="date-value">
                            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="checkin-actions">
                        {!todayStatus?.check_in ? (
                            <button className="glass-btn glass-btn-success btn-lg" onClick={handleCheckIn} disabled={actionLoading}>
                                {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
                                Check In
                            </button>
                        ) : !todayStatus?.check_out ? (
                            <button className="glass-btn glass-btn-danger btn-lg" onClick={handleCheckOut} disabled={actionLoading}>
                                {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-right me-2"></i>}
                                Check Out
                            </button>
                        ) : (
                            <div className="work-complete">
                                <i className="bi bi-check-circle-fill text-success"></i>
                                <span>Work day completed!</span>
                            </div>
                        )}
                    </div>

                    {todayStatus && (
                        <div className="today-times">
                            {todayStatus.check_in && (
                                <div className="time-block">
                                    <span className="time-block-label">Check In</span>
                                    <span className="time-block-value">{todayStatus.check_in}</span>
                                </div>
                            )}
                            {todayStatus.check_out && (
                                <div className="time-block">
                                    <span className="time-block-label">Check Out</span>
                                    <span className="time-block-value">{todayStatus.check_out}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Attendance History */}
            <div className="glass-card">
                <div className="card-header-custom">
                    <h5 className="mb-0">
                        <i className="bi bi-calendar-range me-2"></i>Attendance History
                    </h5>
                    <div className="month-filter">
                        <select className="glass-select" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select className="glass-select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                            {[2024, 2025, 2026].map(year => (<option key={year} value={year}>{year}</option>))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : records.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-calendar-x"></i>
                        <h5>No records found</h5>
                        <p>No attendance records for this period</p>
                    </div>
                ) : (
                    <div className="glass-table">
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr key={index}>
                                        <td><span className="date-cell">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></td>
                                        <td>{record.check_in || '-'}</td>
                                        <td>{record.check_out || '-'}</td>
                                        <td>{record.work_hours ? `${record.work_hours}h` : '-'}</td>
                                        <td>{getStatusBadge(record.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
        .attendance-page { animation: fadeIn 0.4s ease-out; }
        .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
        .page-subtitle { color: #94a3b8; margin-bottom: 0; }
        .alert-glass { display: flex; align-items: center; padding: 0.875rem 1rem; border-radius: 12px; font-size: 0.9rem; position: relative; }
        .alert-glass.alert-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; opacity: 0.7; }
        .checkin-section { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; }
        .current-time-display { text-align: center; }
        .time-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem; }
        .time-value { font-size: 3rem; font-weight: 700; color: white; line-height: 1; }
        .date-value { font-size: 0.9rem; color: #94a3b8; margin-top: 0.5rem; }
        .btn-lg { padding: 1rem 2rem; font-size: 1.1rem; }
        .work-complete { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; background: rgba(16,185,129,0.15); border-radius: 12px; color: #34d399; font-weight: 500; }
        .work-complete i { font-size: 1.5rem; }
        .today-times { display: flex; gap: 2rem; }
        .time-block { text-align: center; }
        .time-block-label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
        .time-block-value { display: block; font-size: 1.25rem; font-weight: 600; color: white; }
        .card-header-custom { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 1rem; }
        .card-header-custom h5 { color: white; display: flex; align-items: center; }
        .month-filter { display: flex; gap: 0.5rem; }
        .glass-select { padding: 0.5rem 2rem 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.875rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; }
        .glass-select option { background: #1e293b; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .empty-state h5 { color: #94a3b8; margin-bottom: 0.5rem; }
        .date-cell { font-weight: 500; color: white; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { .checkin-section { flex-direction: column; text-align: center; } .time-value { font-size: 2.5rem; } }
      `}</style>
        </div>
    )
}

export default Attendance
