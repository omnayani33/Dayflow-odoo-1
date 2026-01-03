import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { authUtils } from '../utils/authUtils'

function Navbar() {
  const navigate = useNavigate()
  const userInfo = authUtils.getUserInfo()

  const handleLogout = () => {
    authUtils.clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary" style={{ height: '60px' }}>
      <div className="container-fluid px-4">
        <span className="navbar-brand mb-0 h1">
          <strong>Dayflow HRMS</strong>
        </span>
        
        <div className="d-flex align-items-center">
          <div className="text-white me-3">
            <FiUser className="me-2" />
            <strong>{userInfo.full_name}</strong>
            <span className="badge bg-light text-dark ms-2">{userInfo.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm"
            title="Logout"
          >
            <FiLogOut className="me-1" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
