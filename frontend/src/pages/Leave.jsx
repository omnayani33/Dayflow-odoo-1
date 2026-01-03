import { useState, useEffect } from 'react'
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { leaveAPI } from '../api/endpoints'

function Leave() {
  const [requests, setRequests] = useState([])
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [formData, setFormData] = useState({
    time_off_type: 'PAID',
    start_date: '',
    end_date: '',
    reason: ''
  })

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await leaveAPI.getMyRequests()
      setRequests(response.data.time_off_requests || [])
      setAllocation(response.data.allocation || null)
    } catch (err) {
      console.error('Leave fetch error:', err)
      setMessage({ type: 'danger', text: 'Failed to load leave requests' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      setMessage({ type: 'danger', text: 'Please fill all required fields' })
      return
    }

    try {
      setSubmitting(true)
      await leaveAPI.submitRequest(formData)
      setMessage({ type: 'success', text: 'Leave request submitted successfully!' })
      
      // Reset form
      setFormData({
        time_off_type: 'PAID',
        start_date: '',
        end_date: '',
        reason: ''
      })
      
      // Refresh requests
      fetchLeaveRequests()
    } catch (err) {
      console.error('Leave submit error:', err)
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.error || 'Failed to submit leave request' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'warning', icon: <FiAlertCircle /> },
      APPROVED: { color: 'success', icon: <FiCheckCircle /> },
      REJECTED: { color: 'danger', icon: <FiXCircle /> }
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`badge bg-${badge.color} d-flex align-items-center gap-1`}>
        {badge.icon} {status}
      </span>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Leave Management</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Leave Balance Cards */}
      {allocation && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  <FiCalendar className="me-2" />
                  Paid Leave
                </h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-0">{allocation.paid_leave_available}</h2>
                    <small className="text-muted">Available</small>
                  </div>
                  <div className="text-end">
                    <p className="mb-0 text-muted">of {allocation.paid_leave_total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  <FiClock className="me-2" />
                  Sick Leave
                </h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-0">{allocation.sick_leave_available}</h2>
                    <small className="text-muted">Available</small>
                  </div>
                  <div className="text-end">
                    <p className="mb-0 text-muted">of {allocation.sick_leave_total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Form */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Request Time Off</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Leave Type *</label>
                <select 
                  className="form-select"
                  name="time_off_type"
                  value={formData.time_off_type}
                  onChange={handleChange}
                  required
                >
                  <option value="PAID">Paid Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Date *</label>
                <input 
                  type="date"
                  className="form-control"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">End Date *</label>
                <input 
                  type="date"
                  className="form-control"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Reason *</label>
              <textarea 
                className="form-control"
                name="reason"
                rows="3"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Please explain the reason for your leave request..."
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>

      {/* Leave History */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Leave History</h5>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <span className={`badge bg-${req.time_off_type === 'PAID' ? 'primary' : req.time_off_type === 'SICK' ? 'warning' : 'secondary'}`}>
                            {req.time_off_type}
                          </span>
                        </td>
                        <td>{req.start_date}</td>
                        <td>{req.end_date}</td>
                        <td>{req.total_days}</td>
                        <td>{req.reason}</td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td>{req.approved_by_name || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Leave
