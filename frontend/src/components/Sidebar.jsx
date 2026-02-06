import { NavLink } from 'react-router-dom'
import { authUtils } from '../utils/authUtils'

function Sidebar({ isOpen, onClose }) {
  const isAdmin = authUtils.isAdmin()
  const userInfo = authUtils.getUserInfo()

  // Navigation items with role-based visibility
  const navItems = [
    {
      section: 'Main',
      items: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
        { path: '/attendance', icon: 'bi-clock-history', label: 'Attendance' },
        { path: '/leave', icon: 'bi-calendar-event', label: 'Leave' },
      ]
    },
    {
      section: 'Finance',
      items: [
        { path: '/payroll', icon: 'bi-wallet2', label: 'Payroll' },
      ]
    },
    {
      section: 'Account',
      items: [
        { path: '/profile', icon: 'bi-person', label: 'My Profile' },
      ]
    }
  ]

  // Admin-only items
  const adminItems = [
    {
      section: 'Admin',
      items: [
        { path: '/employees', icon: 'bi-people', label: 'All Employees' },
        { path: '/approvals', icon: 'bi-check2-square', label: 'Approvals' },
        { path: '/reports', icon: 'bi-graph-up', label: 'Reports' },
        { path: '/create-employee', icon: 'bi-person-plus', label: 'Add Employee' },
      ]
    }
  ]

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`sidebar-glass ${isOpen ? 'show' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <i className="bi bi-layers-fill"></i>
            </div>
            <span className="logo-text">Dayflow</span>
          </div>
          <button className="sidebar-close d-lg-none" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {allItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <span className="nav-section-title">{section.section}</span>
              <ul className="nav-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => {
                        if (window.innerWidth < 992) onClose?.()
                      }}
                    >
                      <i className={`bi ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {userInfo?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{userInfo?.full_name || 'User'}</span>
              <span className="user-role">{userInfo?.role || 'Employee'}</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 99;
            animation: fadeIn 0.2s ease;
          }

          .sidebar-glass {
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            height: 100vh;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-direction: column;
            z-index: 100;
            transition: transform 0.3s ease;
          }

          @media (max-width: 991px) {
            .sidebar-glass {
              transform: translateX(-100%);
            }
            .sidebar-glass.show {
              transform: translateX(0);
            }
          }

          .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .logo-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 10px;
            color: white;
            font-size: 1.25rem;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          }

          .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
          }

          .sidebar-close {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            border-radius: 6px;
          }

          .sidebar-close:hover {
            background: rgba(255,255,255,0.08);
            color: white;
          }

          .sidebar-nav {
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0.75rem;
          }

          .nav-section {
            margin-bottom: 1.5rem;
          }

          .nav-section-title {
            display: block;
            padding: 0.5rem 0.75rem;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
          }

          .nav-list {
            list-style: none;
            margin: 0;
            padding: 0;
          }

          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem 1rem;
            margin: 0.125rem 0;
            border-radius: 10px;
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
          }

          .sidebar-link:hover {
            background: rgba(255, 255, 255, 0.06);
            color: white;
          }

          .sidebar-link.active {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
            color: white;
            border: 1px solid rgba(37, 99, 235, 0.3);
          }

          .sidebar-link i {
            font-size: 1.1rem;
            width: 20px;
            text-align: center;
          }

          .sidebar-footer {
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .sidebar-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 10px;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 8px;
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            line-height: 1.3;
          }

          .user-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: white;
          }

          .user-role {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: capitalize;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </aside>
    </>
  )
}

export default Sidebar
