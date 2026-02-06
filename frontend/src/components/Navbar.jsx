import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'
import { notificationsAPI, profileAPI } from '../api/endpoints'

function Navbar({ onToggleSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [profileAvatar, setProfileAvatar] = useState(null)
  const navigate = useNavigate()
  const userInfo = authUtils.getUserInfo()
  const notificationRef = useRef(null)
  const searchRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getMyNotifications({ limit: 5 })
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }

  const fetchProfileAvatar = async () => {
    try {
      const response = await profileAPI.getMyProfile()
      if (response.data.avatar) {
        setProfileAvatar(response.data.avatar)
      }
    } catch (error) {
      console.error('Failed to fetch profile avatar', error)
    }
  }

  useEffect(() => {
    fetchProfileAvatar()
    fetchNotifications()
    // Poll for new notifications every 15 seconds (Real-time effect)
    const intervalId = setInterval(fetchNotifications, 15000)
    return () => clearInterval(intervalId)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all read', error)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsAPI.markAsRead(notif.id)
        fetchNotifications()
      } catch (error) {
        console.error('Failed to mark read', error)
      }
    }
    // Navigate if there's a link (logic can be enhanced based on notification type)
    if (notif.data && notif.data.link) {
      navigate(notif.data.link)
      setShowNotifications(false)
    }
  }

  // Helper to format date
  const timeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    return Math.floor(seconds) + " seconds ago"
  }

  // Search functionality
  const performSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      // Define searchable items
      const pages = [
        { type: 'page', title: 'Dashboard', icon: 'speedometer2', path: '/dashboard' },
        { type: 'page', title: 'My Profile', icon: 'person', path: '/profile' },
        { type: 'page', title: 'Attendance', icon: 'calendar-check', path: '/attendance' },
        { type: 'page', title: 'Leave Requests', icon: 'calendar-x', path: '/leave' },
        { type: 'page', title: 'Payroll', icon: 'cash-stack', path: '/payroll' },
        { type: 'page', title: 'Approvals', icon: 'check-circle', path: '/approvals', adminOnly: true },
        { type: 'page', title: 'Reports', icon: 'file-earmark-text', path: '/reports', adminOnly: true },
        { type: 'page', title: 'All Employees', icon: 'people', path: '/employees', adminOnly: true },
        { type: 'page', title: 'Create Employee', icon: 'person-plus', path: '/create-employee', adminOnly: true },
      ]

      const actions = [
        { type: 'action', title: 'Check In', icon: 'box-arrow-in-right', action: 'checkin' },
        { type: 'action', title: 'Check Out', icon: 'box-arrow-right', action: 'checkout' },
        { type: 'action', title: 'Apply for Leave', icon: 'calendar-plus', action: 'apply-leave' },
        { type: 'action', title: 'Change Password', icon: 'key', action: 'change-password' },
      ]

      const lowerQuery = query.toLowerCase()
      let results = []

      // Search pages
      const matchedPages = pages.filter(page => {
        if (page.adminOnly && !authUtils.isAdmin()) return false
        return page.title.toLowerCase().includes(lowerQuery)
      })
      results = [...results, ...matchedPages]

      // Search actions
      const matchedActions = actions.filter(action =>
        action.title.toLowerCase().includes(lowerQuery)
      )
      results = [...results, ...matchedActions]

      // Search employees (if admin)
      if (authUtils.isAdmin()) {
        try {
          const { authAPI } = await import('../api/endpoints')
          const response = await authAPI.getEmployees()
          const employees = response.data || []
          const matchedEmployees = employees
            .filter(emp =>
              emp.full_name?.toLowerCase().includes(lowerQuery) ||
              emp.email?.toLowerCase().includes(lowerQuery) ||
              emp.employee_id?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map(emp => ({
              type: 'employee',
              title: emp.full_name,
              subtitle: emp.email,
              icon: 'person-circle',
              data: emp
            }))
          results = [...results, ...matchedEmployees]
        } catch (error) {
          console.error('Failed to search employees', error)
        }
      }

      setSearchResults(results.slice(0, 8))
      setShowSearchResults(results.length > 0)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchRef])

  const handleSearchResultClick = (result) => {
    if (result.type === 'page') {
      navigate(result.path)
    } else if (result.type === 'action') {
      if (result.action === 'change-password') {
        navigate('/change-password')
      } else if (result.action === 'apply-leave') {
        navigate('/leave')
      }
      // Add more action handlers as needed
    } else if (result.type === 'employee') {
      // Could navigate to employee detail page if it exists
      navigate('/employees')
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

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

        <div className="navbar-search d-none d-md-flex" ref={searchRef}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search employees, pages, actions..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
          />
          {isSearching && <div className="search-spinner"><i className="bi bi-arrow-repeat spin"></i></div>}

          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <div className="result-icon">
                    <i className={`bi bi-${result.icon}`}></i>
                  </div>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    {result.subtitle && <div className="result-subtitle">{result.subtitle}</div>}
                    <div className="result-type">{result.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <div className="notification-wrapper" ref={notificationRef}>
          <button className="navbar-action-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header d-flex justify-content-between align-items-center">
                <span className="fw-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn-link text-xs" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="dropdown-divider"></div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-icon">
                        <i className={`bi bi-${notif.type === 'SUCCESS' ? 'check-circle text-success' : notif.type === 'WARNING' ? 'exclamation-triangle text-warning' : notif.type === 'ERROR' ? 'x-circle text-danger' : 'info-circle text-info'}`}></i>
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">{notif.title}</p>
                        <p className="notif-message">{notif.message}</p>
                        <span className="notif-time">{timeAgo(notif.created_at)}</span>
                      </div>
                      {!notif.is_read && <span className="unread-dot"></span>}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted text-sm">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-profile">
          <button className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="profile-avatar">
              {profileAvatar ? (
                <img src={profileAvatar} alt="Profile" className="avatar-img" />
              ) : (
                userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'
              )}
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
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile" className="avatar-img" />
                    ) : (
                      userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'
                    )}
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

        .navbar-search {
          position: relative;
        }

        .search-spinner {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #3b82f6;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(30, 41, 59, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          animation: slideDown 0.2s ease;
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .result-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(37, 99, 235, 0.2);
          border-radius: 8px;
          color: #3b82f6;
          font-size: 1.1rem;
        }

        .result-content {
          flex: 1;
        }

        .result-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 2px;
        }

        .result-subtitle {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .result-type {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: capitalize;
        }

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
          overflow: hidden;
        }

        .profile-avatar .avatar-img, .dropdown-avatar .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .dropdown-item.text-danger { color: #f87171; }

        .notification-wrapper { position: relative; }
        
        .notification-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: -80px;
            width: 320px;
            background: rgba(30, 41, 59, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            overflow: hidden;
            animation: slideDown 0.2s ease;
            z-index: 1000;
        }

        .notification-list {
            max-height: 350px;
            overflow-y: auto;
        }

        .notification-item {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            gap: 12px;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }

        .notification-item:hover {
            background: rgba(255, 255, 255, 0.04);
        }

        .notification-item.unread {
            background: rgba(37, 99, 235, 0.1);
        }

        .notif-icon {
            margin-top: 2px;
            font-size: 1.1rem;
        }

        .notif-content {
            flex: 1;
        }

        .notif-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: #e2e8f0;
            margin: 0 0 2px 0;
        }

        .notif-message {
            font-size: 0.8rem;
            color: #94a3b8;
            margin: 0 0 4px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .notif-time {
            font-size: 0.7rem;
            color: #64748b;
        }

        .unread-dot {
            width: 8px;
            height: 8px;
            background: #3b82f6;
            border-radius: 50%;
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
        }

        .btn-link {
            background: none;
            border: none;
            color: #3b82f6;
            cursor: pointer;
            padding: 0;
            font-size: 0.8rem;
        }
        
        .btn-link:hover { text-decoration: underline; }

        .text-xs { font-size: 0.75rem; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}


export default Navbar
