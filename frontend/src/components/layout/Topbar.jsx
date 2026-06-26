import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// ─── Route → breadcrumb label map ────────────────────────────────────────────
const ROUTE_LABELS = {
  '/':             'Dashboard',
  '/inventory':    'Inventory',
  '/kits':         'Kits',
  '/reservations': 'Reservations',
}

function getBreadcrumb(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const parent = '/' + pathname.split('/')[1]
  return ROUTE_LABELS[parent] ? `${ROUTE_LABELS[parent]} / Detail` : pathname
}

// ─── Role badge config ────────────────────────────────────────────────────────
const ROLE_STYLE = {
  admin:     'badge-danger',
  professor: 'badge-brand',
  student:   'badge-info',
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar() {
  const { pathname } = useLocation()
  const breadcrumb   = getBreadcrumb(pathname)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Build user initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header
      id="topbar"
      className="h-16 sticky top-0 z-10 flex items-center justify-between px-6
                 border-b border-surface-border bg-surface/95 backdrop-blur-md shrink-0"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/30 font-medium">EquipTrack</span>
        <span className="text-white/20">/</span>
        <span className="text-white font-semibold">{breadcrumb}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Phase badge */}
        <span className="badge badge-brand hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5 inline-block" />
          Phase 5
        </span>

        {/* Role badge */}
        {user && (
          <span className={`badge hidden sm:flex ${ROLE_STYLE[user.role] || 'badge-neutral'}`}>
            {user.role}
          </span>
        )}

        {/* User pill */}
        {user ? (
          <div className="flex items-center gap-2">
            <div
              id="topbar-user-pill"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-surface-hover border border-surface-border
                         text-xs font-medium text-white/70
                         cursor-default select-none"
              title={user.email}
            >
              <span className="w-6 h-6 rounded-full bg-brand-500/40 border border-brand-500/60 flex items-center justify-center text-brand-200 text-[10px] font-bold shrink-0">
                {initials}
              </span>
              <span className="hidden sm:block max-w-[120px] truncate">{user.full_name}</span>
            </div>

            {/* Logout button */}
            <button
              id="topbar-logout"
              onClick={handleLogout}
              title="Sign out"
              className="btn-ghost px-2 py-2 text-white/40 hover:text-accent-rose"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            id="topbar-user-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                       bg-surface-hover border border-surface-border
                       text-xs font-medium text-white/60
                       cursor-default select-none"
          >
            <span className="w-6 h-6 rounded-full bg-brand-500/30 border border-brand-500/50 flex items-center justify-center text-brand-300 text-[10px] font-bold">
              ?
            </span>
            <span className="hidden sm:block">Not signed in</span>
          </div>
        )}
      </div>
    </header>
  )
}
