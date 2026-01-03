import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiUser, 
  FiClock, 
  FiCalendar, 
  FiCheckSquare, 
  FiDollarSign,
  FiUserPlus
} from 'react-icons/fi'
import { authUtils } from '../utils/authUtils'

function Sidebar() {
  const isAdmin = authUtils.isAdmin()

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/profile', label: 'My Profile', icon: <FiUser /> },
    { path: '/attendance', label: 'Attendance', icon: <FiClock /> },
    { path: '/leave', label: 'Leave Management', icon: <FiCalendar /> },
    { path: '/payroll', label: 'Payroll', icon: <FiDollarSign /> },
  ]

  const adminItems = [
    { path: '/approvals', label: 'Approvals', icon: <FiCheckSquare /> },
    { path: '/create-employee', label: 'Create Employee', icon: <FiUserPlus /> },
  ]

  return (
    <aside className="sidebar">
      <nav className="py-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="me-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        
        {isAdmin && (
          <>
            <hr className="my-2 mx-3" />
            <div className="px-3 py-2">
              <small className="text-muted text-uppercase fw-bold">Admin</small>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="me-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
