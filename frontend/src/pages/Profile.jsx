import { useState, useEffect } from 'react'
import { profileAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Profile() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const response = await profileAPI.getMyProfile()
            setProfile(response.data)
        } catch (err) {
            console.error('Profile error:', err)
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await profileAPI.updateProfile({
                phone: profile.phone,
                residential_address: profile.residential_address,
                about: profile.about
            })
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setEditing(false)
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-3" style={{ color: '#94a3b8' }}>Loading profile...</p></div>
    }

    if (error) {
        return <div className="alert-glass alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'bi-person' },
        { id: 'work', label: 'Work Info', icon: 'bi-briefcase' },
        { id: 'documents', label: 'Documents', icon: 'bi-file-earmark-text' },
    ]

    return (
        <div className="profile-page">
            {/* Header Card */}
            <div className="glass-card profile-header mb-4">
                <div className="profile-cover"></div>
                <div className="profile-info-section">
                    <div className="profile-avatar-large">
                        {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </div>
                    <div className="profile-details">
                        <h2>{profile?.full_name}</h2>
                        <p className="job-title">{profile?.job_title || 'Employee'}</p>
                        <div className="profile-meta">
                            <span><i className="bi bi-buildings me-1"></i>{profile?.department || 'Not specified'}</span>
                            <span><i className="bi bi-person-badge me-1"></i>{profile?.employee_id}</span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        {!editing ? (
                            <button className="glass-btn glass-btn-primary" onClick={() => setEditing(true)}>
                                <i className="bi bi-pencil me-2"></i>Edit Profile
                            </button>
                        ) : (
                            <div className="d-flex gap-2">
                                <button className="glass-btn" onClick={() => setEditing(false)}>Cancel</button>
                                <button className="glass-btn glass-btn-success" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check2 me-2"></i>}Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`alert-glass alert-${message.type} mb-4`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                    {message.text}
                    <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-glass mb-4">
                {tabs.map(tab => (
                    <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4">
                                <h5 className="card-title mb-4"><i className="bi bi-person me-2"></i>Personal Information</h5>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Full Name</span>
                                        <span className="info-value">{profile?.full_name || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{profile?.email || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Phone</span>
                                        {editing ? (
                                            <input type="text" className="glass-input-sm" value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                        ) : (
                                            <span className="info-value">{profile?.phone || '-'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="glass-card p-4">
                                <h5 className="card-title mb-4"><i className="bi bi-house me-2"></i>Address</h5>
                                {editing ? (
                                    <textarea className="glass-input w-100" rows="4" value={profile?.residential_address || ''} onChange={(e) => setProfile({ ...profile, residential_address: e.target.value })} placeholder="Enter your address..."></textarea>
                                ) : (
                                    <p className="address-text">{profile?.residential_address || 'No address provided'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'work' && (
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4">
                                <h5 className="card-title mb-4"><i className="bi bi-briefcase me-2"></i>Job Details</h5>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Employee ID</span>
                                        <span className="info-value">{profile?.employee_id || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Job Title</span>
                                        <span className="info-value">{profile?.job_title || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Department</span>
                                        <span className="info-value">{profile?.department || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Role</span>
                                        <span className="info-value text-capitalize">{profile?.role?.toLowerCase() || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="glass-card p-4">
                                <h5 className="card-title mb-4"><i className="bi bi-file-earmark-text me-2"></i>My Documents</h5>
                                <div className="glass-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Document Name</th>
                                                <th>Type</th>
                                                <th>Date Uploaded</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Employment Contract</td>
                                                <td>PDF</td>
                                                <td>Jan 15, 2024</td>
                                                <td><button className="glass-btn glass-btn-primary btn-sm"><i className="bi bi-download"></i></button></td>
                                            </tr>
                                            <tr>
                                                <td>Offer Letter</td>
                                                <td>PDF</td>
                                                <td>Jan 10, 2024</td>
                                                <td><button className="glass-btn glass-btn-primary btn-sm"><i className="bi bi-download"></i></button></td>
                                            </tr>
                                            <tr>
                                                <td>ID Proof (Aadhar/Passport)</td>
                                                <td>Image</td>
                                                <td>Jan 15, 2024</td>
                                                <td><button className="glass-btn glass-btn-primary btn-sm"><i className="bi bi-download"></i></button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .profile-page { animation: fadeIn 0.4s ease-out; }
        .profile-header { overflow: hidden; }
        .profile-cover { height: 120px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
        .profile-info-section { display: flex; align-items: flex-end; gap: 1.5rem; padding: 0 1.5rem 1.5rem; margin-top: -50px; flex-wrap: wrap; }
        .profile-avatar-large { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border: 4px solid rgba(30, 41, 59, 0.95); border-radius: 20px; color: white; font-size: 2rem; font-weight: 700; flex-shrink: 0; }
        .profile-details { flex: 1; min-width: 200px; }
        .profile-details h2 { color: white; margin-bottom: 0.25rem; }
        .job-title { color: #60a5fa; font-size: 1rem; margin-bottom: 0.5rem; }
        .profile-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; color: #94a3b8; font-size: 0.875rem; }
        .profile-actions { flex-shrink: 0; }
        .tabs-glass { display: flex; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.04); border-radius: 12px; overflow-x: auto; }
        .tab-btn { padding: 0.75rem 1.25rem; background: transparent; border: none; border-radius: 8px; color: #94a3b8; font-size: 0.9rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .tab-btn:hover { background: rgba(255,255,255,0.06); color: white; }
        .tab-btn.active { background: rgba(37,99,235,0.2); color: white; }
        .card-title { color: white; display: flex; align-items: center; }
        .info-grid { display: grid; gap: 1.25rem; }
        .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .info-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 0.95rem; color: white; }
        .glass-input-sm { padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.9rem; }
        .glass-input-sm:focus { outline: none; border-color: #2563eb; }
        .address-text { color: #cbd5e1; margin: 0; line-height: 1.6; }
        .alert-glass { display: flex; align-items: center; padding: 0.875rem 1rem; border-radius: 12px; position: relative; }
        .alert-glass.alert-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { .profile-info-section { flex-direction: column; align-items: center; text-align: center; } .profile-meta { justify-content: center; } }
      `}</style>
        </div>
    )
}

export default Profile
