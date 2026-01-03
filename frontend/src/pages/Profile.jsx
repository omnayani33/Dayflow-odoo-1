import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { profileAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Profile() {
  const { id } = useParams()
  const location = useLocation()
  const viewOnly = location.state?.viewOnly || false

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resume')
  const [editing, setEditing] = useState(false)

  const isAdmin = authUtils.isAdmin()
  const userInfo = authUtils.getUserInfo()

  // Tabs as per wireframe - Salary Info only visible to Admin
  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isAdmin ? [{ id: 'salary', label: 'Salary Info' }] : []),
  ]

  useEffect(() => {
    fetchProfile()
  }, [id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getMyProfile()
      setProfile(response.data)
    } catch (err) {
      console.error('Profile error:', err)
      // Mock data for demo
      setProfile({
        full_name: userInfo?.full_name || 'My Name',
        employee_id: userInfo?.employee_id || 'EMP001',
        email: userInfo?.email || 'user@company.com',
        phone: '+91 9876543210',
        company: 'Dayflow Tech',
        department: 'Engineering',
        manager: 'John Manager',
        location: 'Mumbai, India',
        about: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.',
        job_description: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since.',
        interests: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
        skills: ['JavaScript', 'React', 'Python'],
        certifications: ['AWS Certified', 'Scrum Master'],
        // Salary Info (Admin only)
        salary: {
          monthly: 50000,
          yearly: 600000,
          working_days: 22,
          break_time: 1,
          components: {
            basic: 25000,
            hra: 12500,
            standard_allowance: 5167,
            performance_bonus: 2083,
            lta: 2083,
            fixed_allowance: 2018,
          },
          pf: {
            employee: 3000,
            employer: 3000,
          },
          tax: 3000,
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      {/* Profile Header Section */}
      <div className="profile-header-section">
        {/* Left: Profile Photo */}
        <div className="profile-photo">
          <i className="bi bi-person-fill"></i>
        </div>

        {/* Center: Basic Info */}
        <div className="profile-basic-info">
          <h2 className="profile-name">{profile?.full_name}</h2>
          <div className="info-row">
            <span className="info-label">Login ID</span>
            <span className="info-value">{profile?.employee_id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{profile?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Mobile</span>
            <span className="info-value">{profile?.phone || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Location</span>
            <span className="info-value">{profile?.location || '-'}</span>
          </div>
        </div>

        {/* Right: Company Info */}
        <div className="profile-company-info">
          <div className="info-row">
            <span className="info-label">Company</span>
            <span className="info-value">{profile?.company || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Department</span>
            <span className="info-value">{profile?.department || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Manager</span>
            <span className="info-value">{profile?.manager || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Resume Tab */}
        {activeTab === 'resume' && (
          <div className="resume-content">
            <div className="resume-left">
              <div className="section">
                <h3>About</h3>
                <p>{profile?.about}</p>
              </div>
              <div className="section">
                <h3>What I love about my job</h3>
                <p>{profile?.job_description}</p>
              </div>
              <div className="section">
                <h3>My interests and hobbies</h3>
                <p>{profile?.interests}</p>
              </div>
            </div>
            <div className="resume-right">
              <div className="section">
                <h3>Skills</h3>
                <div className="skills-list">
                  {profile?.skills?.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
                <button className="add-btn">+ Add Skills</button>
              </div>
              <div className="section">
                <h3>Certification</h3>
                <div className="cert-list">
                  {profile?.certifications?.map((cert, i) => (
                    <span key={i} className="cert-tag">{cert}</span>
                  ))}
                </div>
                <button className="add-btn">+ Add Skills</button>
              </div>
            </div>
          </div>
        )}

        {/* Private Info Tab */}
        {activeTab === 'private' && (
          <div className="private-content">
            <div className="info-grid">
              <div className="info-item">
                <label>Date of Birth</label>
                <span>{profile?.date_of_birth || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Gender</label>
                <span>{profile?.gender || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Marital Status</label>
                <span>{profile?.marital_status || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Emergency Contact</label>
                <span>{profile?.emergency_contact || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Address</label>
                <span>{profile?.address || 'Not specified'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Salary Info Tab (Admin Only) */}
        {activeTab === 'salary' && isAdmin && (
          <div className="salary-content">
            <div className="salary-header">
              <div className="salary-summary">
                <div className="summary-item">
                  <label>Month Wage</label>
                  <span className="wage-value">{profile?.salary?.monthly}</span>
                  <span className="wage-period">/ Month</span>
                </div>
                <div className="summary-item">
                  <label>Yearly wage</label>
                  <span className="wage-value">{profile?.salary?.yearly}</span>
                  <span className="wage-period">/ Yearly</span>
                </div>
              </div>
              <div className="working-info">
                <div className="working-item">
                  <label>No of working days<br />in a week:</label>
                  <span>{profile?.salary?.working_days || 5}</span>
                </div>
                <div className="working-item">
                  <label>Break Time</label>
                  <span>____/hrs</span>
                </div>
              </div>
            </div>

            <div className="salary-details">
              <div className="salary-left">
                <h4>Salary Components</h4>
                <table className="salary-table">
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="amount">{profile?.salary?.components?.basic}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">50.00 %</td>
                    </tr>
                    <tr>
                      <td>House Rent Allowance</td>
                      <td className="amount">{profile?.salary?.components?.hra}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">50.00 %</td>
                    </tr>
                    <tr>
                      <td>Standard Allowance</td>
                      <td className="amount">{profile?.salary?.components?.standard_allowance}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">16.67 %</td>
                    </tr>
                    <tr>
                      <td>Performance Bonus</td>
                      <td className="amount">{profile?.salary?.components?.performance_bonus}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">8.33 %</td>
                    </tr>
                    <tr>
                      <td>Leave Travel Allowance</td>
                      <td className="amount">{profile?.salary?.components?.lta}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">8.33 %</td>
                    </tr>
                    <tr>
                      <td>Fixed Allowance</td>
                      <td className="amount">{profile?.salary?.components?.fixed_allowance}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">16.67 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="salary-right">
                <h4>Provident Fund (PF) Contribution</h4>
                <table className="salary-table">
                  <tbody>
                    <tr>
                      <td>Employee</td>
                      <td className="amount">{profile?.salary?.pf?.employee}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">12.00 %</td>
                    </tr>
                    <tr>
                      <td>Employer</td>
                      <td className="amount">{profile?.salary?.pf?.employer}</td>
                      <td className="period">₹ / month</td>
                      <td className="percent">12.00 %</td>
                    </tr>
                  </tbody>
                </table>

                <h4>Tax Deductions</h4>
                <table className="salary-table">
                  <tbody>
                    <tr>
                      <td>Professional Tax</td>
                      <td className="amount">{profile?.salary?.tax}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-page {
          color: white;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #64748b;
        }

        .page-header {
          margin-bottom: 1rem;
        }

        .page-title {
          font-size: 1rem;
          font-weight: 500;
          color: white;
          margin: 0;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: inline-block;
        }

        .profile-header-section {
          display: flex;
          gap: 2rem;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .profile-photo {
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-photo i {
          font-size: 3rem;
          color: #64748b;
        }

        .profile-basic-info, .profile-company-info {
          flex: 1;
          min-width: 200px;
        }

        .profile-name {
          font-size: 1.5rem;
          font-weight: 500;
          color: #60a5fa;
          margin: 0 0 1rem;
          font-style: italic;
        }

        .info-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .info-label {
          color: #64748b;
          min-width: 80px;
        }

        .info-value {
          color: #94a3b8;
        }

        .profile-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .tab-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-btn.active {
          background: rgba(244, 114, 182, 0.2);
          border-color: #f472b6;
          color: #f472b6;
        }

        .tab-content {
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
        }

        /* Resume Tab */
        .resume-content {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .resume-left {
          flex: 2;
          min-width: 300px;
        }

        .resume-right {
          flex: 1;
          min-width: 200px;
        }

        .section {
          margin-bottom: 1.5rem;
        }

        .section h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          margin: 0 0 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .section p {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        .skills-list, .cert-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .skill-tag, .cert-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 4px;
          font-size: 0.8rem;
          color: #60a5fa;
        }

        .add-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
        }

        .add-btn:hover {
          color: #60a5fa;
        }

        /* Private Info Tab */
        .private-content {
          max-width: 600px;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .info-item span {
          font-size: 0.9rem;
          color: white;
        }

        /* Salary Tab */
        .salary-header {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
        }

        .salary-summary {
          display: flex;
          gap: 2rem;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-item label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .wage-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
        }

        .wage-period {
          font-size: 0.8rem;
          color: #64748b;
        }

        .working-info {
          display: flex;
          gap: 2rem;
        }

        .working-item {
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
        }

        .working-item label {
          color: #64748b;
        }

        .salary-details {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
        }

        .salary-left, .salary-right {
          flex: 1;
          min-width: 300px;
        }

        .salary-details h4 {
          font-size: 0.9rem;
          font-weight: 500;
          color: white;
          margin: 0 0 1rem;
        }

        .salary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .salary-table td {
          padding: 0.5rem 0;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .salary-table td:first-child {
          color: #64748b;
        }

        .salary-table .amount {
          color: #10b981;
          text-align: right;
        }

        .salary-table .period {
          color: #64748b;
          padding-left: 0.5rem;
        }

        .salary-table .percent {
          color: #94a3b8;
          text-align: right;
        }

        @media (max-width: 768px) {
          .profile-header-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .info-row {
            justify-content: center;
          }

          .resume-content {
            flex-direction: column;
          }

          .salary-header {
            flex-direction: column;
          }

          .salary-summary {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Profile
