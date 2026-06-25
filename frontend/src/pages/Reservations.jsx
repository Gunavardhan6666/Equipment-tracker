import { useState } from 'react'
import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const STATUSES = ['all', 'pending', 'approved', 'active', 'returned', 'overdue', 'cancelled']

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

// ─── Expandable Row ───────────────────────────────────────────────────────────
function ReservationRow({ r }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr
        className="table-row cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        id={`reservation-row-${r.id}`}
      >
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-white">{r.item_name}</p>
          <p className="text-xs text-white/35 font-mono">{r.serial_number}</p>
        </td>
        <td className="px-4 py-3 text-sm text-white/60 hidden md:table-cell">
          {r.user_name ?? r.user_id?.slice(0, 8) + '…'}
        </td>
        <td className="px-4 py-3 text-xs text-white/45 hidden lg:table-cell">
          {formatDate(r.start_time)}
        </td>
        <td className="px-4 py-3 text-xs text-white/45 hidden xl:table-cell">
          {formatDate(r.end_time)}
        </td>
        <td className="px-4 py-3">
          <Badge value={r.status} />
        </td>
        <td className="px-4 py-3 text-white/25 text-sm">{open ? '▴' : '▾'}</td>
      </tr>

      {open && (
        <tr className="bg-surface-card/40">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Reservation ID</p>
                <p className="text-white/60 font-mono break-all">{r.id}</p>
              </div>
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Category</p>
                <p className="text-white/60">{r.category_name} · {r.buffer_hours}h buffer</p>
              </div>
              {r.notes && (
                <div>
                  <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-white/60">{r.notes}</p>
                </div>
              )}
              {r.kit_name && (
                <div>
                  <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Kit</p>
                  <p className="text-white/60">{r.kit_name}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Reservations ─────────────────────────────────────────────────────────────
export default function Reservations() {
  const [activeTab, setActiveTab] = useState('all')

  const qs  = activeTab !== 'all' ? `?status=${activeTab}` : ''
  const res = useApi(() => apiGet(`/reservations${qs}`), [activeTab])

  const rows = res.data?.data ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
        <p className="page-subtitle">
          {res.data?.count != null
            ? `${res.data.count} reservation${res.data.count !== 1 ? 's' : ''}`
            : 'All reservations'}
          {activeTab !== 'all' ? ` · filtered by "${activeTab}"` : ''}
        </p>
      </div>

      {/* ── Status tabs ── */}
      <div className="flex flex-wrap gap-1 p-1 glass-card">
        {STATUSES.map((s) => (
          <button
            key={s}
            id={`reservations-tab-${s}`}
            onClick={() => setActiveTab(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
              activeTab === s
                ? 'bg-brand-500 text-white shadow-glow-indigo'
                : 'text-white/40 hover:text-white hover:bg-surface-hover'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {res.loading ? (
        <LoadingSpinner className="py-20" />
      ) : res.error ? (
        <EmptyState icon="⚠️" title="Could not load reservations" message={res.error.message} />
      ) : !rows.length ? (
        <EmptyState
          icon="📋"
          title={activeTab === 'all' ? 'No reservations yet' : `No ${activeTab} reservations`}
          message="Create a booking via POST /api/reservations to see it here."
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Start</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden xl:table-cell">End</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ReservationRow key={r.id} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
