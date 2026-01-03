import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout-wrapper">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        <Outlet />
      </main>

      <style jsx>{`
        .layout-wrapper {
          min-height: 100vh;
          background: #0f0f1a;
        }

        .main-content {
          padding: calc(50px + 1.5rem) 1.5rem 1.5rem;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: calc(50px + 1rem) 1rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout
