import { useState, useEffect } from 'react'
import { leaveAPI } from '../api/endpoints'

function Leave() {
    const [requests, setRequests] = useState([])
    const [allocation, setAllocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showForm, setShowForm] = useState(false)

    const [formData, setFormData] = useState({
        time_off_type: 'PAID',
        start_date: '',
        end_date: '',
        reason: ''
    })

    useEffect(() => {
        fetchLeaveData()
    }, [])

    const fetchLeaveData = async () => {
        try {
            setLoading(true)
            const response = await leaveAPI.getMyRequests()
            setRequests(response.data.time_off_requests || [])
            setAllocation(response.data.allocation || null)
        } catch (err) {
            console.error('Fetch leave error:', err)
            setMessage({ type: 'danger', text: 'Failed to load leave data' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.start_date || !formData.end_date || !formData.reason) {
            setMessage({ type: 'danger', text: 'Please fill in all required fields' })
            return
        }
        try {
            setSubmitting(true)
            await leaveAPI.submitRequest(formData)
            setMessage({ type: 'success', text: 'Leave request submitted successfully!' })
            setShowForm(false)
            setFormData({ time_off_type: 'PAID', start_date: '', end_date: '', reason: '' })
            fetchLeaveData()
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to submit request' })
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': { class: 'status-badge-warning', icon: 'bi-hourglass-split' },
            'APPROVED': { class: 'status-badge-success', icon: 'bi-check-circle' },
            'REJECTED': { class: 'status-badge-danger', icon: 'bi-x-circle' },
        }
        const config = statusMap[status] || { class: 'status-badge-info', icon: 'bi-question-circle' }
        return <span className={`status-badge ${config.class}`}><i className={`bi ${config.icon} me-1`}></i>{status}</span>
    }

    return (
        <div className="leave-page">
            <div className="page-header mb-4">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Apply for time off and track your leave requests</p>
                </div>
                <button className="glass-btn glass-btn-primary" onClick={() => setShowForm(!showForm)}>
                    <i className={`bi ${showForm ? 'bi-x' : 'bi-plus-lg'} me-2`}></i>
                    {showForm ? 'Cancel' : 'New Request'}
                </button>
            </div>

            {message.text && (
                <div className={`alert-glass alert-${message.type} mb-4`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                    {message.text}
                    <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* Leave Balance Cards */}
            {allocation && (
                <div className="row g-4 mb-4">
                    <div className="col-md-4">
                        <div className="glass-card stat-card glass-card-success">
                            <div className="stat-card-icon bg-success-glow"><i className="bi bi-calendar-check"></i></div>
                            <div className="stat-card-value">{allocation.paid_leave_available}</div>
                            <div className="stat-card-label">Paid Leave Available</div>
                            <div className="progress-custom">
                                <div className="progress-bar progress-bar-success" style={{ width: `${(allocation.paid_leave_available / allocation.paid_leave_total) * 100}%` }}></div>
                            </div>
                            <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>of {allocation.paid_leave_total} days</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="glass-card stat-card glass-card-warning">
                            <div className="stat-card-icon bg-warning-glow"><i className="bi bi-bandaid"></i></div>
                            <div className="stat-card-value">{allocation.sick_leave_available}</div>
                            <div className="stat-card-label">Sick Leave Available</div>
                            <div className="progress-custom">
                                <div className="progress-bar progress-bar-warning" style={{ width: `${(allocation.sick_leave_available / allocation.sick_leave_total) * 100}%` }}></div>
                            </div>
                            <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>of {allocation.sick_leave_total} days</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="glass-card stat-card glass-card-primary">
                            <div className="stat-card-icon bg-primary-glow"><i className="bi bi-hourglass-split"></i></div>
                            <div className="stat-card-value">{requests.filter(r => r.status === 'PENDING').length}</div>
                            <div className="stat-card-label">Pending Requests</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Application Form */}
            {showForm && (
                <div className="glass-card p-4 mb-4 animate-slide-up">
                    <h5 className="card-title mb-4"><i className="bi bi-calendar-plus me-2"></i>New Leave Request</h5>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label-glass">Leave Type</label>
                                <select className="glass-select w-100" value={formData.time_off_type} onChange={(e) => setFormData({ ...formData, time_off_type: e.target.value })}>
                                    <option value="PAID">Paid Leave</option>
                                    <option value="SICK">Sick Leave</option>
                                    <option value="UNPAID">Unpaid Leave</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label-glass">Start Date</label>
                                <input type="date" className="glass-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label-glass">End Date</label>
                                <input type="date" className="glass-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                            </div>
                            <div className="col-12">
                                <label className="form-label-glass">Reason</label>
                                <textarea className="glass-input" rows="3" placeholder="Enter reason for leave..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required></textarea>
                            </div>
                            <div className="col-12">
                                <button type="submit" className="glass-btn glass-btn-primary" disabled={submitting}>
                                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send me-2"></i>Submit Request</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Leave History */}
            <div className="glass-card">
                <div className="card-header-custom">
                    <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i>Leave History</h5>
                </div>
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : requests.length === 0 ? (
                    <div className="empty-state"><i className="bi bi-calendar-x"></i><h5>No leave requests</h5><p>You haven't submitted any leave requests yet</p></div>
                ) : (
                    <div className="glass-table">
                        <table>
                            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
                            <tbody>
                                {requests.map((request, index) => (
                                    <tr key={index}>
                                        <td><span className={`leave-type type-${request.time_off_type?.toLowerCase()}`}>{request.time_off_type}</span></td>
                                        <td>{new Date(request.start_date).toLocaleDateString()}</td>
                                        <td>{new Date(request.end_date).toLocaleDateString()}</td>
                                        <td><strong>{request.total_days}</strong></td>
                                        <td className="reason-cell">{request.reason}</td>
                                        <td>{getStatusBadge(request.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
        .leave-page { animation: fadeIn 0.4s ease-out; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
        .page-subtitle { color: #94a3b8; margin-bottom: 0; }
        .alert-glass { display: flex; align-items: center; padding: 0.875rem 1rem; border-radius: 12px; font-size: 0.9rem; position: relative; }
        .alert-glass.alert-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; }
        .stat-card-icon { position: absolute; right: 1rem; top: 1rem; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .bg-primary-glow { background: linear-gradient(135deg, rgba(37,99,235,0.3), rgba(37,99,235,0.1)); color: #60a5fa; }
        .bg-success-glow { background: linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1)); color: #34d399; }
        .bg-warning-glow { background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1)); color: #fbbf24; }
        .stat-card-value { font-size: 2rem; font-weight: 700; color: white; }
        .stat-card-label { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem; }
        .card-title { color: white; display: flex; align-items: center; }
        .form-label-glass { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; }
        .glass-select { padding: 0.75rem 2.5rem 0.75rem 1rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; font-size: 1rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }
        .glass-select option { background: #1e293b; }
        textarea.glass-input { resize: vertical; min-height: 100px; }
        .card-header-custom { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .card-header-custom h5 { color: white; display: flex; align-items: center; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .empty-state h5 { color: #94a3b8; }
        .leave-type { padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .leave-type.type-paid { background: rgba(16,185,129,0.15); color: #34d399; }
        .leave-type.type-sick { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .leave-type.type-unpaid { background: rgba(100,116,139,0.15); color: #94a3b8; }
        .reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    )
}

export default Leave
