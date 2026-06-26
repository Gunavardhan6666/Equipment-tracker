import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'


// ─── Icons (inline SVG, no dependency) ────────────────────────────────────────
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const InventoryIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
  </svg>
)

const KitsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const ReservationsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
  </svg>
)

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
)

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: <DashboardIcon />,    end: true },
  { to: '/inventory',    label: 'Inventory',    icon: <InventoryIcon /> },
  { to: '/kits',         label: 'Kits',         icon: <KitsIcon /> },
  { to: '/reservations', label: 'Reservations', icon: <ReservationsIcon /> },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user } = useAuth()

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside
      id="sidebar"
      className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-surface-border bg-surface/95 backdrop-blur-md"
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-glow-indigo text-white">
          <CameraIcon />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight leading-none">EquipTrack</p>
          <p className="text-[10px] text-white/35 leading-none mt-0.5">FilmDept University</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`sidebar-nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-4 py-4 border-t border-surface-border">
        {user ? (
          <div className="glass-card px-3 py-2.5 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-brand-500/40 border border-brand-500/60 flex items-center justify-center text-brand-200 text-[11px] font-bold shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white/70 leading-none truncate">{user.full_name}</p>
              <p className="text-[10px] text-white/35 mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="glass-card px-3 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse-slow shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white/60 leading-none truncate">Phase 5 Active</p>
              <p className="text-[10px] text-white/25 mt-0.5 truncate">JWT Auth</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
