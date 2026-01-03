import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <main className="main-content flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
