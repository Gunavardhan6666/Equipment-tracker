import { useState, useCallback } from 'react'
import { useApi } from '../hooks/useApi.js'
import { apiGet, apiPatch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'

const STATUSES = ['all', 'pending', 'approved', 'active', 'returned', 'overdue', 'cancelled']

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

// ─── Action button with inline loading / confirm ───────────────────────────────
function ActionButton({ label, colorClass, onClick, confirmLabel, id }) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleClick = async () => {
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    try { await onClick() } finally { setLoading(false); setConfirming(false) }
  }

  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all duration-150 disabled:opacity-50
        ${confirming
          ? 'border-accent-rose/50 bg-accent-rose/10 text-accent-rose'
          : `${colorClass}`
        }`}
    >
      {loading ? (
        <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block" />
      ) : confirming ? (
        confirmLabel || 'Confirm?'
      ) : (
        label
      )}
    </button>
  )
}

// ─── Expandable Row ───────────────────────────────────────────────────────────
function ReservationRow({ r, user, onStatusChange }) {
  const [open, setOpen] = useState(false)

  const canCancel  = ['pending', 'approved'].includes(r.status) && r.user_id === user?.id
  const canApprove = r.status === 'pending' && ['professor', 'admin'].includes(user?.role)

  const changeStatus = async (status) => {
    await apiPatch(`/reservations/${r.id}/status`, { status })
    onStatusChange()
  }

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
        {/* Action buttons — stop row-click propagation */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">
            {canApprove && (
              <ActionButton
                id={`approve-btn-${r.id}`}
                label="Approve"
                colorClass="border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald hover:bg-accent-emerald/15"
                confirmLabel="Approve?"
                onClick={() => changeStatus('approved')}
              />
            )}
            {canCancel && (
              <ActionButton
                id={`cancel-btn-${r.id}`}
                label="Cancel"
                colorClass="border-surface-border text-white/40 hover:border-accent-rose/40 hover:text-accent-rose"
                confirmLabel="Sure?"
                onClick={() => changeStatus('cancelled')}
              />
            )}
            <span className="text-white/25 text-sm ml-1">{open ? '▴' : '▾'}</span>
          </div>
        </td>
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
                <p className="text-white/60">{r.category_name} · {typeof r.buffer_hours === 'object' ? (r.buffer_hours?.hours || 0) : r.buffer_hours}h buffer</p>
              </div>
              {r.approved_by_name && (
                <div>
                  <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Approved By</p>
                  <p className="text-white/60">{r.approved_by_name}</p>
                </div>
              )}
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


// ─── Reservations Page ────────────────────────────────────────────────────────
export default function Reservations() {
  const { user } = useAuth()
  const [activeTab,   setActiveTab]   = useState('all')
  const [refetchKey,  setRefetchKey]  = useState(0)
  const [showPicker,  setShowPicker]  = useState(false) // item picker for new reservation
  const [selectedItem, setSelectedItem] = useState(null) // item for BookingModal

  const qs  = activeTab !== 'all' ? `?status=${activeTab}` : ''
  const res = useApi(() => apiGet(`/reservations${qs}`), [activeTab, refetchKey])

  // Inventory for new reservation picker
  const inventory = useApi(() => apiGet('/items'), [])

  const rows = res.data?.data ?? []

  const handleStatusChange = useCallback(() => setRefetchKey((k) => k + 1), [])

  const handleNewReservation = useCallback((item) => {
    setSelectedItem(item)
    setShowPicker(false)
  }, [])

  const handleBookingClose = useCallback(() => setSelectedItem(null), [])
  const handleBookingSuccess = useCallback(() => {
    setSelectedItem(null)
    setRefetchKey((k) => k + 1)
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">
            {res.data?.count != null
              ? `${res.data.count} reservation${res.data.count !== 1 ? 's' : ''}`
              : 'All reservations'}
            {activeTab !== 'all' ? ` · filtered by "${activeTab}"` : ''}
          </p>
        </div>
        <button
          id="new-reservation-btn"
          onClick={() => setShowPicker((v) => !v)}
          className="btn-primary shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Reservation
        </button>
      </div>

      {/* ── Item picker dropdown for new reservation ── */}
      {showPicker && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Select an item to book</p>
            <button
              onClick={() => setShowPicker(false)}
              className="btn-ghost text-xs px-2 py-1 text-white/40"
            >
              ✕ Close
            </button>
          </div>
          {inventory.loading ? (
            <LoadingSpinner size="sm" className="py-4" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {(inventory.data?.data ?? []).map((item) => (
                <button
                  key={item.id}
                  id={`picker-item-${item.id}`}
                  onClick={() => handleNewReservation(item)}
                  className="text-left px-3 py-2.5 rounded-xl border border-surface-border bg-surface-hover
                             hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-150 group"
                >
                  <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-white/30 font-mono truncate">{item.category_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          message={activeTab === 'all' ? 'Click "+ New Reservation" above to get started.' : 'Try a different status filter.'}
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ReservationRow
                  key={r.id}
                  r={r}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Booking modal (opened from item picker) ── */}
      {selectedItem && (
        <BookingModal
          item={selectedItem}
          onClose={handleBookingClose}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  )
}
