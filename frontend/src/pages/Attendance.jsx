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

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    })
                },
                (error) => {
                    reject(error)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        })
    }

    const reverseGeocode = async (lat, lon) => {
        try {
            // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            )
            const data = await response.json()
            return data.display_name || `${lat}, ${lon}`
        } catch (error) {
            console.error('Reverse geocoding failed:', error)
            return `${lat}, ${lon}`
        }
    }

    const handleCheckIn = async () => {
        try {
            setActionLoading(true)
            setMessage({ type: 'info', text: 'Getting your location...' })

            // Get user's location
            const location = await getLocation()
            const locationName = await reverseGeocode(location.latitude, location.longitude)

            const response = await attendanceAPI.checkIn({
                latitude: location.latitude,
                longitude: location.longitude,
                location: locationName
            })

            setMessage({
                type: 'success',
                text: `${response.data.message || 'Checked in successfully!'} Location: ${locationName}`
            })
            fetchAttendance()
        } catch (err) {
            if (err.code === 1) { // PERMISSION_DENIED
                setMessage({ type: 'danger', text: 'Location permission denied. Please enable location access.' })
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                setMessage({ type: 'danger', text: 'Location unavailable. Please check your GPS settings.' })
            } else if (err.code === 3) { // TIMEOUT
                setMessage({ type: 'danger', text: 'Location request timed out. Please try again.' })
            } else {
                setMessage({ type: 'danger', text: err.response?.data?.error || err.message || 'Check-in failed' })
            }
        } finally {
            setActionLoading(false)
        }
    }

    const handleCheckOut = async () => {
        try {
            setActionLoading(true)
            setMessage({ type: 'info', text: 'Getting your location...' })

            // Get user's location
            const location = await getLocation()
            const locationName = await reverseGeocode(location.latitude, location.longitude)

            const response = await attendanceAPI.checkOut({
                latitude: location.latitude,
                longitude: location.longitude,
                location: locationName
            })

            setMessage({
                type: 'success',
                text: `${response.data.message || 'Checked out successfully!'} Location: ${locationName}`
            })
            fetchAttendance()
        } catch (err) {
            if (err.code === 1) { // PERMISSION_DENIED
                setMessage({ type: 'danger', text: 'Location permission denied. Please enable location access.' })
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                setMessage({ type: 'danger', text: 'Location unavailable. Please check your GPS settings.' })
            } else if (err.code === 3) { // TIMEOUT
                setMessage({ type: 'danger', text: 'Location request timed out. Please try again.' })
            } else {
                setMessage({ type: 'danger', text: err.response?.data?.error || err.message || 'Check-out failed' })
            }
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
                            <div className="action-container">
                                <button className="glass-btn glass-btn-success btn-lg" onClick={handleCheckIn} disabled={actionLoading}>
                                    {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
                                    Check In
                                </button>
                                <p className="action-hint">
                                    <i className="bi bi-info-circle me-1"></i>
                                    You can check in once per day
                                </p>
                            </div>
                        ) : !todayStatus?.check_out ? (
                            <div className="action-container">
                                <button className="glass-btn glass-btn-danger btn-lg" onClick={handleCheckOut} disabled={actionLoading}>
                                    {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-right me-2"></i>}
                                    Check Out
                                </button>
                                <p className="action-hint">
                                    <i className="bi bi-info-circle me-1"></i>
                                    You can check out once per day
                                </p>
                            </div>
                        ) : (
                            <div className="work-complete-container">
                                <div className="work-complete">
                                    <i className="bi bi-check-circle-fill"></i>
                                    <div>
                                        <div className="complete-title">Work day completed!</div>
                                        <div className="complete-subtitle">You have checked in and out for today</div>
                                    </div>
                                </div>
                                <p className="next-day-hint">
                                    <i className="bi bi-calendar-check me-1"></i>
                                    Next check-in available tomorrow
                                </p>
                            </div>
                        )}
                    </div>

                    {todayStatus && (
                        <div className="today-times">
                            {todayStatus.check_in && (
                                <div className="time-block">
                                    <i className="bi bi-box-arrow-in-right time-block-icon text-success"></i>
                                    <div>
                                        <span className="time-block-label">Checked In</span>
                                        <span className="time-block-value">{todayStatus.check_in}</span>
                                        {todayStatus.check_in_location && (
                                            <span className="time-block-location">
                                                <i className="bi bi-geo-alt-fill"></i>
                                                {todayStatus.check_in_location.substring(0, 30)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {todayStatus.check_out && (
                                <div className="time-block">
                                    <i className="bi bi-box-arrow-right time-block-icon text-danger"></i>
                                    <div>
                                        <span className="time-block-label">Checked Out</span>
                                        <span className="time-block-value">{todayStatus.check_out}</span>
                                        {todayStatus.check_out_location && (
                                            <span className="time-block-location">
                                                <i className="bi bi-geo-alt-fill"></i>
                                                {todayStatus.check_out_location.substring(0, 30)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {todayStatus.work_hours && (
                                <div className="time-block">
                                    <i className="bi bi-clock-history time-block-icon text-info"></i>
                                    <div>
                                        <span className="time-block-label">Total Hours</span>
                                        <span className="time-block-value">{todayStatus.work_hours}h</span>
                                    </div>
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
                                <tr>
                                    <th>Date</th>
                                    <th>Check In</th>
                                    <th>Check In Location</th>
                                    <th>Check Out</th>
                                    <th>Check Out Location</th>
                                    <th>Work Hours</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span className="date-cell">
                                                {new Date(record.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td>{record.check_in || '-'}</td>
                                        <td>
                                            {record.check_in_location ? (
                                                <div className="location-cell">
                                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                                    <span className="location-text" title={record.check_in_location}>
                                                        {record.check_in_location.length > 40
                                                            ? record.check_in_location.substring(0, 40) + '...'
                                                            : record.check_in_location}
                                                    </span>
                                                    {record.check_in_latitude && record.check_in_longitude && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="map-link"
                                                            title="View on map"
                                                        >
                                                            <i className="bi bi-map"></i>
                                                        </a>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>{record.check_out || '-'}</td>
                                        <td>
                                            {record.check_out_location ? (
                                                <div className="location-cell">
                                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                                    <span className="location-text" title={record.check_out_location}>
                                                        {record.check_out_location.length > 40
                                                            ? record.check_out_location.substring(0, 40) + '...'
                                                            : record.check_out_location}
                                                    </span>
                                                    {record.check_out_latitude && record.check_out_longitude && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${record.check_out_latitude},${record.check_out_longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="map-link"
                                                            title="View on map"
                                                        >
                                                            <i className="bi bi-map"></i>
                                                        </a>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
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
        .alert-glass.alert-info { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; opacity: 0.7; }
        .checkin-section { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; }
        .current-time-display { text-align: center; }
        .time-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem; }
        .time-value { font-size: 3rem; font-weight: 700; color: white; line-height: 1; }
        .date-value { font-size: 0.9rem; color: #94a3b8; margin-top: 0.5rem; }
        .btn-lg { padding: 1rem 2rem; font-size: 1.1rem; }
        .action-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .action-hint { margin: 0; font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }
        .action-hint i { font-size: 0.9rem; }
        .work-complete-container { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .work-complete { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; color: #34d399; }
        .work-complete i { font-size: 2rem; flex-shrink: 0; }
        .complete-title { font-size: 1.1rem; font-weight: 600; }
        .complete-subtitle { font-size: 0.85rem; color: #6ee7b7; margin-top: 0.25rem; }
        .next-day-hint { margin: 0; font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }
        .today-times { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
        .time-block { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .time-block-icon { font-size: 1.5rem; flex-shrink: 0; }
        .time-block-label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
        .time-block-value { display: block; font-size: 1.25rem; font-weight: 600; color: white; }
        .time-block-location { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem; }
        .time-block-location i { color: #3b82f6; font-size: 0.7rem; }
        .card-header-custom { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 1rem; }
        .card-header-custom h5 { color: white; display: flex; align-items: center; }
        .month-filter { display: flex; gap: 0.5rem; }
        .glass-select { padding: 0.5rem 2rem 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.875rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; }
        .glass-select option { background: #1e293b; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .empty-state h5 { color: #94a3b8; margin-bottom: 0.5rem; }
        .date-cell { font-weight: 500; color: white; }
        .location-cell { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.85rem; max-width: 250px; }
        .location-cell i.bi-geo-alt-fill { color: #3b82f6; flex-shrink: 0; }
        .location-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .map-link { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(59, 130, 246, 0.2); border-radius: 6px; color: #3b82f6; text-decoration: none; transition: all 0.2s; flex-shrink: 0; }
        .map-link:hover { background: rgba(59, 130, 246, 0.3); transform: scale(1.1); }
        .map-link i { font-size: 0.75rem; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { .checkin-section { flex-direction: column; text-align: center; } .time-value { font-size: 2.5rem; } }
      `}</style>
        </div>
    )
}

export default Attendance
