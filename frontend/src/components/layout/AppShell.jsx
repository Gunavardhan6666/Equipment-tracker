import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Root layout wrapper. Renders once and persists across route changes.
// Structure: [Sidebar | [Topbar / Page Content]]
// ──────────────────────────────────────────────────────────────────────────────
export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main area: topbar + scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
