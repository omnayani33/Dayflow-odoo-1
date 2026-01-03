import { useState, useEffect } from 'react'
import { FiCheck, FiX, FiAlertCircle, FiUser, FiCalendar } from 'react-icons/fi'
import { leaveAPI } from '../api/endpoints'

function Approvals() {
  const [pendingRequests, setPendingRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'pending' ? 'PENDING' : null
      const response = await leaveAPI.manageRequests(status)
      
      if (activeTab === 'pending') {
        setP endingRequests(response.data || [])
      } else {
        setAllRequests(response.data || [])
      }
    } catch (err) {
      console.error('Fetch requests error:', err)
      setMessage({ type: 'danger', text: 'Failed to load leave requests' })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId, action) => {
    try {
      setProcessing(requestId)
      await leaveAPI.approveRejectRequest(requestId, action)
      
      setMessage({ 
        type: 'success', 
        text: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully!` 
      })
      
      // Refresh the list
      fetchRequests()
    } catch (err) {
      console.error('Action error:', err)
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.error || `Failed to ${action} request` 
      })
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger'
    }
    return <span className={`badge bg-${colors[status]}`}>{status}</span>
  }

  const getTypeColor = (type) => {
    return type === 'PAID' ? 'primary' : type === 'SICK' ? 'warning' : 'secondary'
  }

  const requests = activeTab === 'pending' ? pendingRequests : allRequests

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Leave Approvals</h2>
        <span className="badge bg-warning text-dark">
          {pendingRequests.length} Pending
        </span>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FiAlertCircle className="me-2" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests
          </button>
        </li>
      </ul>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <FiCheckCircle size={48} className="text-muted mb-3" />
            <h5 className="text-muted">
              {activeTab === 'pending' ? 'No pending requests' : 'No leave requests found'}
            </h5>
          </div>
        </div>
      ) : (
        <div className="row">
          {requests.map((request) => (
            <div key={request.id} className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-1">
                        <FiUser className="me-2" />
                        {request.employee_name}
                      </h5>
                      <small className="text-muted">{request.employee_id}</small>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="mb-3">
                    <span className={`badge bg-${getTypeColor(request.time_off_type)} mb-2`}>
                      {request.time_off_type} LEAVE
                    </span>
                    
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FiCalendar className="me-2" />
                      <span>
                        {request.start_date} to {request.end_date}
                      </span>
                    </div>
                    
                    <div className="text-muted small mb-2">
                      <strong>Duration:</strong> {request.total_days} day{request.total_days > 1 ? 's' : ''}
                    </div>
                    
                    <div className="mt-2">
                      <strong className="small">Reason:</strong>
                      <p className="mb-0 mt-1">{request.reason}</p>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success btn-sm flex-fill"
                        onClick={() => handleAction(request.id, 'approve')}
                        disabled={processing === request.id}
                      >
                        <FiCheck className="me-1" />
                        {processing === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm flex-fill"
                        onClick={() => handleAction(request.id, 'reject')}
                        disabled={processing === request.id}
                      >
                        <FiX className="me-1" />
                        {processing === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {request.approved_by_name && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted">
                        {request.status === 'APPROVED' ? 'Approved' : 'Rejected'} by: {request.approved_by_name}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Approvals
