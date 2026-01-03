import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'

function Navbar({ onToggleSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()
  const userInfo = authUtils.getUserInfo()
  const isAdmin = authUtils.isAdmin()

  const handleLogout = () => {
    authUtils.clearAuth()
    navigate('/login', { replace: true })
  }

  // Navigation tabs matching wireframe
  const navTabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/employees', label: 'Employees' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/leave', label: 'Time Off' },
  ]

  return (
    <nav className="navbar-wireframe">
      {/* Left: Logo and Tabs */}
      <div className="navbar-left">
        {/* Mobile Toggle */}
        <button className="mobile-toggle d-lg-none" onClick={onToggleSidebar}>
          <i className="bi bi-list"></i>
        </button>

        {/* Company Logo */}
        <div className="company-logo">
          <span>Company Logo</span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs-wrapper">
          {navTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right: Avatar and Dropdown */}
      <div className="navbar-right">
        {/* Status Indicator */}
        <div className="status-indicator"></div>

        {/* Profile Avatar */}
        <div className="profile-section">
          <button
            className="avatar-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar">
              {userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </div>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div className="dropdown-backdrop" onClick={() => setShowProfileMenu(false)}></div>
              <div className="profile-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                >
                  My Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar-wireframe {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: #1a1a2e;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 100;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .mobile-toggle {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .company-logo {
          color: #94a3b8;
          font-size: 0.85rem;
          padding-right: 1rem;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-tabs-wrapper {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-tab {
          padding: 0.5rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .nav-tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-tab.active {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .status-indicator {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f87171;
        }

        .profile-section {
          position: relative;
        }

        .avatar-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: #3b82f6;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: -1;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          min-width: 150px;
          overflow: hidden;
          animation: slideDown 0.15s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: #cbd5e1;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .nav-tabs-wrapper {
            display: none;
          }
          
          .company-logo {
            border-right: none;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar
