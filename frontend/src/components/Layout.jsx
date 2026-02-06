import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    return (
        <div className="layout-wrapper dark-theme">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <Navbar onToggleSidebar={toggleSidebar} />
            <main className="main-content-area">
                <Outlet />
            </main>

            <style jsx>{`
        .layout-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        }

        .main-content-area {
          margin-left: 260px;
          padding: calc(65px + 1.5rem) 1.5rem 1.5rem;
          min-height: 100vh;
        }

        @media (max-width: 991px) {
          .main-content-area {
            margin-left: 0;
          }
        }

        @media (max-width: 576px) {
          .main-content-area {
            padding: calc(65px + 1rem) 1rem 1rem;
          }
        }
      `}</style>
        </div>
    )
}

export default Layout
