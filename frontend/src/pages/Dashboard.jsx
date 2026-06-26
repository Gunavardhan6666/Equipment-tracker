import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    hour12: true,
  }).format(new Date(iso))
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const items        = useApi(() => apiGet('/items'))
  const reservations = useApi(() => apiGet('/reservations'))
  const kits         = useApi(() => apiGet('/kits'))
  const pending      = useApi(() => apiGet('/reservations?status=pending'))
  const active       = useApi(() => apiGet('/reservations?status=active'))
  const categories   = useApi(() => apiGet('/categories'))

  const recentRes = reservations.data?.data?.slice(0, 6) ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Live overview of FilmDept University equipment inventory</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          value={items.data?.count}
          label="Equipment Items"
          color="text-brand-400"
          loading={items.loading}
        />
        <StatCard
          value={kits.data?.count}
          label="Active Kits"
          color="text-accent-cyan"
          loading={kits.loading}
        />
        <StatCard
          value={active.data?.count}
          label="Active Loans"
          color="text-accent-emerald"
          loading={active.loading}
        />
        <StatCard
          value={pending.data?.count}
          label="Pending Approval"
          color="text-accent-amber"
          loading={pending.loading}
        />
      </div>

      {/* ── Two-column section ── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Recent Reservations — 2/3 width */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Recent Reservations</h2>
            <a href="/reservations" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </a>
          </div>

          {reservations.loading ? (
            <LoadingSpinner className="py-8" />
          ) : recentRes.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No reservations yet"
              message="Bookings created via the API will appear here."
            />
          ) : (
            <div className="space-y-0">
              {recentRes.map((r) => (
                <div key={r.id} className="table-row py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.item_name}</p>
                    <p className="text-xs text-white/35 font-mono truncate">{r.user_name ?? r.user_id}</p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-xs text-white/40">{formatDate(r.start_time)}</p>
                    <p className="text-xs text-white/25">→ {formatDate(r.end_time)}</p>
                  </div>
                  <Badge value={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories — 1/3 width */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Categories</h2>
          {categories.loading ? (
            <LoadingSpinner className="py-8" />
          ) : !categories.data?.data?.length ? (
            <EmptyState icon="🗂️" title="No categories" />
          ) : (
            <div className="space-y-2">
              {categories.data.data.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2 border-b border-surface-border/40 last:border-0">
                  <span className="text-sm text-white/70">{cat.name}</span>
                  <span className="text-xs text-white/30 font-mono">
                    {typeof cat.buffer_hours === 'object' ? (cat.buffer_hours?.hours || 0) : cat.buffer_hours}h buffer
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── API Status Card ── */}
      {reservations.error && (
        <div className="glass-card p-5 border-accent-rose/30">
          <p className="text-sm font-semibold text-accent-rose mb-1">⚠ Backend not connected</p>
          <p className="text-xs text-white/40">
            Start the Express server with <code className="font-mono bg-surface-hover px-1.5 py-0.5 rounded text-white/60">cd backend &amp;&amp; npm run dev</code> to see live data.
          </p>
        </div>
      )}
    </div>
  )
}
