import { useState, useEffect } from 'react'
import { leaveAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Leave() {
  const [requests, setRequests] = useState([])
  const [balance, setBalance] = useState({ paid: 24, sick: 7 })
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('timeoff')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    time_off_type: 'Paid',
    start_date: '',
    end_date: '',
    reason: ''
  })

  const isAdmin = authUtils.isAdmin()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        const response = await leaveAPI.manageTimeOff()
        setRequests(response.data || [])
      } else {
        const response = await leaveAPI.getMyRequests()
        setRequests(response.data || [])
      }
    } catch (err) {
      console.error('Fetch requests error:', err)
      // Mock data for demo
      setRequests([
        { id: 1, employee_name: '[Emp Name]', start_date: '2025-10-28', end_date: '2025-10-28', time_off_type: 'Paid time Off', status: 'PENDING' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading('submit')
      await leaveAPI.submitRequest(formData)
      setMessage({ type: 'success', text: 'Request submitted successfully!' })
      setShowNewModal(false)
      setFormData({ time_off_type: 'Paid', start_date: '', end_date: '', reason: '' })
      fetchRequests()
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to submit request' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (id) => {
    try {
      setActionLoading(id)
      await leaveAPI.approveReject(id, 'approve')
      setMessage({ type: 'success', text: 'Request approved!' })
      fetchRequests()
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to approve' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    try {
      setActionLoading(id)
      await leaveAPI.approveReject(id, 'reject')
      setMessage({ type: 'success', text: 'Request rejected!' })
      fetchRequests()
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to reject' })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const filteredRequests = requests.filter(req =>
    req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="leave-page">
      {/* Tabs: Time Off / Allocation */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'timeoff' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeoff')}
        >
          Time Off
        </button>
        <button
          className={`page-tab ${activeTab === 'allocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocation')}
        >
          Allocation
        </button>
      </div>

      {/* Header Row: NEW button + Search */}
      <div className="header-row">
        <button className="btn-new" onClick={() => setShowNewModal(true)}>
          NEW
        </button>
        <div className="search-box">
          <input
            type="text"
            placeholder="Searchbar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="balance-cards">
        <div className="balance-card">
          <span className="balance-type paid">Paid time Off</span>
          <span className="balance-value">{balance.paid} Days Available</span>
        </div>
        <div className="balance-card">
          <span className="balance-type sick">Sick time off</span>
          <span className="balance-value">{balance.sick} Days Available</span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="requests-table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Time off Type</th>
                <th>Status</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="no-data">No requests found</td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.employee_name || 'Me'}</td>
                    <td>{formatDate(request.start_date)}</td>
                    <td>{formatDate(request.end_date)}</td>
                    <td className="type-cell">{request.time_off_type}</td>
                    <td>
                      {request.status === 'PENDING' && isAdmin ? (
                        <div className="action-buttons">
                          <button
                            className="btn-reject"
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading === request.id}
                          ></button>
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(request.id)}
                            disabled={actionLoading === request.id}
                          ></button>
                        </div>
                      ) : (
                        <span className={`status-badge status-${request.status?.toLowerCase()}`}>
                          {request.status}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td></td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* New Request Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Time Off Request</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Time Off Type</label>
                <select
                  value={formData.time_off_type}
                  onChange={(e) => setFormData({ ...formData, time_off_type: e.target.value })}
                  required
                >
                  <option value="Paid">Paid Time Off</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="3"
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={actionLoading === 'submit'}>
                  {actionLoading === 'submit' ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .leave-page {
          color: white;
        }

        .page-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .page-tab {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-tab:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .page-tab.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          color: #a78bfa;
        }

        .header-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;
        }

        .btn-new {
          padding: 0.5rem 1.25rem;
          background: #8b5cf6;
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-new:hover {
          background: #7c3aed;
        }

        .search-box {
          flex: 1;
          max-width: 300px;
        }

        .search-box input {
          width: 100%;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
        }

        .search-box input::placeholder {
          color: #64748b;
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

        .balance-cards {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .balance-card {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .balance-type {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .balance-type.paid {
          color: #f472b6;
        }

        .balance-type.sick {
          color: #60a5fa;
        }

        .balance-value {
          font-size: 0.8rem;
          color: #64748b;
        }

        .requests-table-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow-x: auto;
        }

        .requests-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .requests-table th,
        .requests-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .requests-table th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 500;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .requests-table td {
          font-size: 0.9rem;
          color: white;
        }

        .requests-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .type-cell {
          color: #60a5fa;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-reject, .btn-approve {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-reject {
          background: #ef4444;
        }

        .btn-approve {
          background: #10b981;
        }

        .btn-reject:disabled, .btn-approve:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .status-approved {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .status-rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .loading, .no-data {
          text-align: center;
          padding: 2rem;
          color: #64748b;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
          width: 100%;
          max-width: 400px;
        }

        .modal-content h3 {
          margin: 0 0 1.5rem;
          color: white;
          font-size: 1.1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .form-actions button {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .form-actions button:first-child {
          background: transparent;
          color: #94a3b8;
        }

        .form-actions .btn-submit {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: white;
        }

        .form-actions .btn-submit:disabled {
          opacity: 0.5;
        }

        @media (max-width: 640px) {
          .balance-cards {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Leave
