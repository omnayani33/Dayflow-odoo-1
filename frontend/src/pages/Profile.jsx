import { useState, useEffect } from 'react'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBriefcase, FiDollarSign } from 'react-icons/fi'
import { profileAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('info')
  
  const isAdmin = authUtils.isAdmin()
  
  const [formData, setFormData] = useState({
    phone: '',
    residential_address: '',
    about: '',
    skills: '',
    certifications: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getProfile()
      const profileData = response.data
      setProfile(profileData)
      
      // Initialize form data
      setFormData({
        phone: profileData.phone || '',
        residential_address: profileData.residential_address || '',
        about: profileData.about || '',
        skills: Array.isArray(profileData.skills) ? profileData.skills.join(', ') : '',
        certifications: Array.isArray(profileData.certifications) ? profileData.certifications.join(', ') : ''
      })
    } catch (err) {
      console.error('Profile fetch error:', err)
      setMessage({ type: 'danger', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Convert comma-separated strings to arrays
      const updateData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : []
      }
      
      await profileAPI.updateProfile(updateData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
      fetchProfile()
    } catch (err) {
      console.error('Profile update error:', err)
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="alert alert-danger">Failed to load profile</div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Profile</h2>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
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
          <button className={`nav-link ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            Personal Info
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'job' ? 'active' : ''}`} onClick={() => setActiveTab('job')}>
            Job Details
          </button>
        </li>
        {isAdmin && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>
              Salary Info
            </button>
          </li>
        )}
      </ul>

      {/* Personal Info Tab */}
      {activeTab === 'info' && (
        <div className="card">
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-3">
                  <FiUser className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Full Name</small>
                    <strong>{profile.full_name}</strong>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-3">
                  <FiBriefcase className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Employee ID</small>
                    <strong>{profile.employee_id}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-3">
                  <FiMail className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <strong>{profile.email}</strong>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    <FiPhone className="me-2" />
                    Phone
                  </label>
                  {editing ? (
                    <input 
                      type="text" 
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="mb-0">{profile.phone || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">
                <FiMapPin className="me-2" />
                Address
              </label>
              {editing ? (
                <textarea 
                  className="form-control"
                  name="residential_address"
                  rows="2"
                  value={formData.residential_address}
                  onChange={handleChange}
                />
              ) : (
                <p className="mb-0">{profile.residential_address || '-'}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label">About</label>
              {editing ? (
                <textarea 
                  className="form-control"
                  name="about"
                  rows="3"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="mb-0">{profile.about || '-'}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label">Skills</label>
              {editing ? (
                <>
                  <input 
                    type="text" 
                    className="form-control"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="Python, React, Django (comma separated)"
                  />
                  <small className="text-muted">Separate skills with commas</small>
                </>
              ) : (
                <div>
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span key={idx} className="badge bg-primary me-2 mb-2">{skill}</span>
                    ))
                  ) : '-'}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label">Certifications</label>
              {editing ? (
                <>
                  <input 
                    type="text" 
                    className="form-control"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    placeholder="AWS Certified, Python Expert (comma separated)"
                  />
                  <small className="text-muted">Separate certifications with commas</small>
                </>
              ) : (
                <div>
                  {profile.certifications && profile.certifications.length > 0 ? (
                    profile.certifications.map((cert, idx) => (
                      <span key={idx} className="badge bg-success me-2 mb-2">{cert}</span>
                    ))
                  ) : '-'}
                </div>
              )}
            </div>

            {editing && (
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(false)
                    fetchProfile()
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Details Tab */}
      {activeTab === 'job' && (
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Department</small>
                <strong>{profile.department || '-'}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Job Title</small>
                <strong>{profile.job_title || '-'}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Location</small>
                <strong>{profile.location || '-'}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Role</small>
                <span className={`badge bg-${profile.role === 'ADMIN' ? 'danger' : 'primary'}`}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Info Tab (Admin Only) */}
      {activeTab === 'salary' && isAdmin && (
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="d-flex align-items-center">
                  <FiDollarSign className="me-2 text-success" />
                  <div>
                    <small className="text-muted d-block">Monthly Wage</small>
                    <strong>₹ {profile.monthly_wage || '-'}</strong>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Bank Name</small>
                <strong>{profile.bank_name || '-'}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">Account Number</small>
                <strong>{profile.account_number || '-'}</strong>
              </div>
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block">IFSC Code</small>
                <strong>{profile.ifsc_code || '-'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
