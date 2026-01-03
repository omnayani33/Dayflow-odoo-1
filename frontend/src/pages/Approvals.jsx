import { useState, useEffect } from 'react'
import { leaveAPI } from '../api/endpoints'

function Approvals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [filter, setFilter] = useState('PENDING')

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await leaveAPI.manageTimeOff(filter)
      setRequests(response.data || [])
    } catch (err) {
      console.error('Fetch requests error:', err)
      setMessage({ type: 'danger', text: 'Failed to load requests' })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id)
      await leaveAPI.approveReject(id, action)
      setMessage({
        type: 'success',
        text: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      })
      fetchRequests()
    } catch (err) {
      setMessage({ type: 'danger', text: `Failed to ${action} request` })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { class: 'status-badge-warning', icon: 'bi-hourglass-split' },
      'APPROVED': { class: 'status-badge-success', icon: 'bi-check-circle' },
      'REJECTED': { class: 'status-badge-danger', icon: 'bi-x-circle' },
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
    <div className="approvals-page">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Manage leave requests and approvals</p>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`alert-glass alert-${message.type} mb-4`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
          {message.text}
          <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="glass-card stat-card-sm glass-card-warning" onClick={() => setFilter('PENDING')}>
            <div className="stat-icon">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{requests.filter(r => r.status === 'PENDING').length || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card stat-card-sm glass-card-success" onClick={() => setFilter('APPROVED')}>
            <div className="stat-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{requests.filter(r => r.status === 'APPROVED').length || 0}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card stat-card-sm glass-card-danger" onClick={() => setFilter('REJECTED')}>
            <div className="stat-icon">
              <i className="bi bi-x-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{requests.filter(r => r.status === 'REJECTED').length || 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs mb-4">
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h5>No {filter.toLowerCase()} requests</h5>
            <p>There are no requests to show</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request, index) => (
              <div key={index} className="request-card">
                <div className="request-main">
                  <div className="request-avatar">
                    {request.employee_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </div>
                  <div className="request-info">
                    <h6>{request.employee_name}</h6>
                    <p className="employee-id">{request.employee_id}</p>
                  </div>
                </div>
                <div className="request-details">
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className={`leave-type type-${request.time_off_type?.toLowerCase()}`}>
                      {request.time_off_type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Days</span>
                    <span className="detail-value">{request.total_days}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                <div className="request-reason">
                  <span className="detail-label">Reason</span>
                  <p>{request.reason}</p>
                </div>
                {request.status === 'PENDING' && (
                  <div className="request-actions">
                    <button
                      className="glass-btn glass-btn-success btn-sm"
                      onClick={() => handleAction(request.id, 'approve')}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <><i className="bi bi-check2 me-1"></i>Approve</>
                      )}
                    </button>
                    <button
                      className="glass-btn glass-btn-danger btn-sm"
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={actionLoading === request.id}
                    >
                      <i className="bi bi-x me-1"></i>Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .approvals-page {
          animation: fadeIn 0.4s ease-out;
        }

        .page-title {
          color: white;
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .page-subtitle {
          color: #94a3b8;
          margin-bottom: 0;
        }

        .alert-glass {
          display: flex;
          align-items: center;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          position: relative;
        }

        .alert-glass.alert-success {
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          color: #34d399;
        }

        .alert-glass.alert-danger {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        .alert-close {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
        }

        .stat-card-sm {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          cursor: pointer;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 1.25rem;
        }

        .glass-card-warning .stat-icon {
          background: rgba(245,158,11,0.2);
          color: #fbbf24;
        }

        .glass-card-success .stat-icon {
          background: rgba(16,185,129,0.2);
          color: #34d399;
        }

        .glass-card-danger .stat-icon {
          background: rgba(239,68,68,0.2);
          color: #f87171;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .filter-tab {
          padding: 0.5rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .filter-tab.active {
          background: rgba(37,99,235,0.2);
          border-color: rgba(37,99,235,0.3);
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #64748b;
        }

        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .empty-state h5 {
          color: #94a3b8;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
        }

        .request-card {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: grid;
          gap: 1rem;
        }

        .request-card:last-child {
          border-bottom: none;
        }

        .request-main {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .request-avatar {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .request-info h6 {
          color: white;
          margin: 0 0 0.125rem;
        }

        .employee-id {
          color: #64748b;
          font-size: 0.8rem;
          margin: 0;
        }

        .request-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 0.9rem;
          color: white;
        }

        .leave-type {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .leave-type.type-paid {
          background: rgba(16,185,129,0.15);
          color: #34d399;
        }

        .leave-type.type-sick {
          background: rgba(245,158,11,0.15);
          color: #fbbf24;
        }

        .leave-type.type-unpaid {
          background: rgba(100,116,139,0.15);
          color: #94a3b8;
        }

        .request-reason {
          background: rgba(255,255,255,0.03);
          padding: 0.75rem;
          border-radius: 8px;
        }

        .request-reason p {
          margin: 0;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .request-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default Approvals
