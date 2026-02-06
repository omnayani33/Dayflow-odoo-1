import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'

function Navbar({ onToggleSidebar }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const navigate = useNavigate()
    const userInfo = authUtils.getUserInfo()

    const handleLogout = () => {
        authUtils.clearAuth()
        navigate('/login', { replace: true })
    }

    return (
        <nav className="navbar-glass">
            <div className="navbar-left">
                <button className="navbar-toggle d-lg-none" onClick={onToggleSidebar}>
                    <i className="bi bi-list"></i>
                </button>

                <div className="navbar-search d-none d-md-flex">
                    <i className="bi bi-search"></i>
                    <input type="text" placeholder="Search..." className="search-input" />
                </div>
            </div>

            <div className="navbar-right">
                <button className="navbar-action-btn">
                    <i className="bi bi-bell"></i>
                    <span className="notification-dot"></span>
                </button>

                <div className="navbar-profile">
                    <button className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <div className="profile-avatar">
                            {userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                        </div>
                        <div className="profile-info d-none d-md-block">
                            <span className="profile-name">{userInfo?.full_name || 'User'}</span>
                            <span className="profile-role">{userInfo?.role || 'Employee'}</span>
                        </div>
                        <i className="bi bi-chevron-down d-none d-md-block"></i>
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="dropdown-backdrop" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <div className="dropdown-avatar">
                                        {userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                                    </div>
                                    <div>
                                        <div className="dropdown-name">{userInfo?.full_name}</div>
                                        <div className="dropdown-email">{userInfo?.email}</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                                    <i className="bi bi-person"></i> My Profile
                                </button>
                                <button className="dropdown-item" onClick={() => { navigate('/change-password'); setShowProfileMenu(false); }}>
                                    <i className="bi bi-key"></i> Change Password
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item text-danger" onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right"></i> Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .navbar-glass {
          position: fixed;
          top: 0;
          left: 260px;
          right: 0;
          height: 65px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          z-index: 99;
        }

        @media (max-width: 991px) {
          .navbar-glass { left: 0; }
        }

        .navbar-left, .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-toggle {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #cbd5e1;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .navbar-search {
          position: relative;
        }

        .navbar-search i {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .search-input {
          width: 280px;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .search-input::placeholder { color: #64748b; }

        .navbar-action-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.15rem;
          position: relative;
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        .navbar-profile { position: relative; }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.375rem 0.75rem 0.375rem 0.375rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50px;
          cursor: pointer;
        }

        .profile-avatar, .dropdown-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 50%;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .profile-info { text-align: left; line-height: 1.3; }
        .profile-name { display: block; font-size: 0.875rem; font-weight: 500; color: white; }
        .profile-role { display: block; font-size: 0.7rem; color: #64748b; text-transform: capitalize; }
        .profile-trigger i { color: #64748b; font-size: 0.75rem; }

        .dropdown-backdrop { position: fixed; inset: 0; z-index: -1; }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          width: 260px;
          background: rgba(30, 41, 59, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }

        .dropdown-header { display: flex; gap: 0.75rem; padding: 1rem; }
        .dropdown-avatar { width: 44px; height: 44px; font-size: 1rem; }
        .dropdown-name { font-weight: 600; color: white; }
        .dropdown-email { font-size: 0.8rem; color: #64748b; }
        .dropdown-divider { height: 1px; background: rgba(255, 255, 255, 0.08); }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: #cbd5e1;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: left;
        }

        .dropdown-item:hover { background: rgba(255, 255, 255, 0.06); }
        .dropdown-item.text-danger { color: #f87171; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </nav>
    )
}

export default Navbar
