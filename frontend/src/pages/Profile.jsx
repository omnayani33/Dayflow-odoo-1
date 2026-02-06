import { useState, useEffect, useRef } from 'react'
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
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadingDoc, setUploadingDoc] = useState(false)
    const [documents, setDocuments] = useState([])
    const [profileImage, setProfileImage] = useState(null)
    const fileInputRef = useRef(null)
    const docInputRef = useRef(null)

    useEffect(() => {
        fetchProfile()
        fetchDocuments()
    }, [])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const response = await profileAPI.getMyProfile()
            setProfile(response.data)
            if (response.data.avatar) {
                setProfileImage(response.data.avatar)
            }
        } catch (err) {
            console.error('Profile error:', err)
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const fetchDocuments = async () => {
        try {
            const response = await profileAPI.getMyDocuments()
            setDocuments(response.data || [])
        } catch (err) {
            console.error('Documents error:', err)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await profileAPI.updateProfile({
                phone: profile.phone,
                residential_address: profile.residential_address,
                personal_email: profile.personal_email,
                date_of_birth: profile.date_of_birth,
                gender: profile.gender,
                marital_status: profile.marital_status,
            })
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setEditing(false)
            fetchProfile()
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'danger', text: 'Please upload an image file' })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'danger', text: 'Image size must be less than 5MB' })
            return
        }

        try {
            setUploadingImage(true)
            const formData = new FormData()
            formData.append('avatar', file)

            await profileAPI.uploadAvatar(formData)
            setMessage({ type: 'success', text: 'Profile image updated successfully!' })
            fetchProfile()
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to upload image' })
        } finally {
            setUploadingImage(false)
        }
    }

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'danger', text: 'File size must be less than 10MB' })
            return
        }

        try {
            setUploadingDoc(true)
            const formData = new FormData()
            formData.append('document', file)
            formData.append('document_type', 'OTHER')
            formData.append('document_name', file.name)

            await profileAPI.uploadDocument(formData)
            setMessage({ type: 'success', text: 'Document uploaded successfully!' })
            fetchDocuments()
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to upload document' })
        } finally {
            setUploadingDoc(false)
        }
    }

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return

        try {
            await profileAPI.deleteDocument(docId)
            setMessage({ type: 'success', text: 'Document deleted successfully!' })
            fetchDocuments()
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to delete document' })
        }
    }

    const handleDownloadDocument = async (docId, filename) => {
        try {
            const response = await profileAPI.downloadDocument(docId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to download document' })
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'bi-file-image'
        if (['pdf'].includes(ext)) return 'bi-file-pdf'
        if (['doc', 'docx'].includes(ext)) return 'bi-file-word'
        if (['xls', 'xlsx'].includes(ext)) return 'bi-file-excel'
        return 'bi-file-earmark'
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
                    <div className="profile-avatar-container">
                        <div className="profile-avatar-large">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="avatar-img" />
                            ) : (
                                profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'
                            )}
                        </div>
                        <button
                            className="avatar-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="bi bi-camera"></i>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
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
                                    <div className="info-item">
                                        <span className="info-label">Personal Email</span>
                                        {editing ? (
                                            <input type="email" className="glass-input-sm" value={profile?.personal_email || ''} onChange={(e) => setProfile({ ...profile, personal_email: e.target.value })} />
                                        ) : (
                                            <span className="info-value">{profile?.personal_email || '-'}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Date of Birth</span>
                                        {editing ? (
                                            <input type="date" className="glass-input-sm" value={profile?.date_of_birth || ''} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
                                        ) : (
                                            <span className="info-value">{formatDate(profile?.date_of_birth)}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Gender</span>
                                        {editing ? (
                                            <select className="glass-input-sm" value={profile?.gender || ''} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : (
                                            <span className="info-value">{profile?.gender || '-'}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Marital Status</span>
                                        {editing ? (
                                            <select className="glass-input-sm" value={profile?.marital_status || ''} onChange={(e) => setProfile({ ...profile, marital_status: e.target.value })}>
                                                <option value="">Select</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Divorced">Divorced</option>
                                            </select>
                                        ) : (
                                            <span className="info-value">{profile?.marital_status || '-'}</span>
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
                                    <div className="info-item">
                                        <span className="info-label">Location</span>
                                        <span className="info-value">{profile?.location || '-'}</span>
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
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="card-title mb-0"><i className="bi bi-file-earmark-text me-2"></i>My Documents</h5>
                                    <button
                                        className="glass-btn glass-btn-primary"
                                        onClick={() => docInputRef.current?.click()}
                                        disabled={uploadingDoc}
                                    >
                                        {uploadingDoc ? (
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                        ) : (
                                            <i className="bi bi-upload me-2"></i>
                                        )}
                                        Upload Document
                                    </button>
                                    <input
                                        ref={docInputRef}
                                        type="file"
                                        onChange={handleDocumentUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <div className="glass-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Document Name</th>
                                                <th>Type</th>
                                                <th>Date Uploaded</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.length > 0 ? (
                                                documents.map(doc => (
                                                    <tr key={doc.id}>
                                                        <td>
                                                            <i className={`bi ${getFileIcon(doc.document_name)} me-2`}></i>
                                                            {doc.document_name}
                                                        </td>
                                                        <td>{doc.document_type}</td>
                                                        <td>{formatDate(doc.uploaded_at)}</td>
                                                        <td>
                                                            <button
                                                                className="glass-btn glass-btn-primary btn-sm me-2"
                                                                onClick={() => handleDownloadDocument(doc.id, doc.document_name)}
                                                                title="Download"
                                                            >
                                                                <i className="bi bi-download"></i>
                                                            </button>
                                                            <button
                                                                className="glass-btn glass-btn-danger btn-sm"
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                title="Delete"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted">
                                                        No documents uploaded yet
                                                    </td>
                                                </tr>
                                            )}
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
        .profile-avatar-container { position: relative; flex-shrink: 0; }
        .profile-avatar-large { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border: 4px solid rgba(30, 41, 59, 0.95); border-radius: 20px; color: white; font-size: 2rem; font-weight: 700; overflow: hidden; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-upload-btn { position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; background: #2563eb; border: 2px solid rgba(30, 41, 59, 0.95); border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .avatar-upload-btn:hover { background: #1e40af; transform: scale(1.1); }
        .avatar-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
        .glass-input-sm, .glass-input { padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.9rem; }
        .glass-input-sm:focus, .glass-input:focus { outline: none; border-color: #2563eb; }
        .address-text { color: #cbd5e1; margin: 0; line-height: 1.6; }
        .alert-glass { display: flex; align-items: center; padding: 0.875rem 1rem; border-radius: 12px; position: relative; }
        .alert-glass.alert-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .alert-glass.alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-close { position: absolute; right: 0.75rem; background: none; border: none; color: inherit; cursor: pointer; }
        .glass-btn-danger { background: rgba(239,68,68,0.2); color: #fca5a5; }
        .glass-btn-danger:hover { background: rgba(239,68,68,0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { .profile-info-section { flex-direction: column; align-items: center; text-align: center; } .profile-meta { justify-content: center; } }
      `}</style>
        </div>
    )
}

export default Profile
