import { useLocation } from 'react-router-dom'

// ─── Route → breadcrumb label map ────────────────────────────────────────────
const ROUTE_LABELS = {
  '/':             'Dashboard',
  '/inventory':    'Inventory',
  '/kits':         'Kits',
  '/reservations': 'Reservations',
}

function getBreadcrumb(pathname) {
  // Match exact routes first, then strip trailing segments for detail pages
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const parent = '/' + pathname.split('/')[1]
  return ROUTE_LABELS[parent] ? `${ROUTE_LABELS[parent]} / Detail` : pathname
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar() {
  const { pathname } = useLocation()
  const breadcrumb   = getBreadcrumb(pathname)

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
        <span className="badge badge-info animate-pulse-slow hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan mr-1.5 inline-block" />
          Phase 4
        </span>

        {/* User pill — placeholder until Phase 5 (JWT) */}
        <div
          id="topbar-user-pill"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                     bg-surface-hover border border-surface-border
                     text-xs font-medium text-white/60
                     cursor-default select-none"
          title="Authentication coming in Phase 5"
        >
          <span className="w-6 h-6 rounded-full bg-brand-500/30 border border-brand-500/50 flex items-center justify-center text-brand-300 text-[10px] font-bold">
            ?
          </span>
          <span className="hidden sm:block">Not signed in</span>
        </div>
      </div>
    </header>
  )
}
