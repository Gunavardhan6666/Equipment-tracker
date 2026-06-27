import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { apiGet, apiPatch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'

const STATUSES = ['all', 'pending', 'approved', 'active', 'overdue', 'history']

const ROLE_STYLE = {
  admin:     'badge-danger',
  professor: 'badge-brand',
  student:   'badge-info',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

// ─── Authorization logic (mirrors backend enforcement) ─────────────────────────
// Students:   can only cancel their OWN pending or approved reservations
// Professors: can approve pending, can cancel their OWN reservations only.
//             CANNOT cancel already-approved reservations of others.
// Admins:     full access — can cancel any reservation in any cancellable state
function canCancelReservation(reservation, currentUser) {
  if (!currentUser) return false
  const cancellableStatuses = ['pending', 'approved']
  if (!cancellableStatuses.includes(reservation.status)) return false

  const isOwner = reservation.user_id === currentUser.id

  if (currentUser.role === 'admin') return true  // admins cancel anything
  if (currentUser.role === 'professor') {
    // Professors can only cancel their own reservations,
    // and CANNOT cancel already-approved ones of other users
    if (!isOwner) return false
    return true
  }
  // Students: own reservations only
  return isOwner
}

function canApproveReservation(reservation, currentUser) {
  if (!currentUser) return false
  return reservation.status === 'pending' && ['professor', 'admin'].includes(currentUser.role)
}

// ─── Action button with inline loading / confirm ───────────────────────────────
function ActionButton({ label, colorClass, onClick, confirmLabel, id }) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleClick = async (e) => {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    try { await onClick() } finally { setLoading(false); setConfirming(false) }
  }

  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all duration-150 disabled:opacity-50 cursor-pointer
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

// ─── Expandable Reservation Row ────────────────────────────────────────────────
function ReservationRow({ r, idx, user, onStatusChange }) {
  const [open, setOpen] = useState(false)

  const showCancel  = canCancelReservation(r, user)
  const showApprove = canApproveReservation(r, user)

  const changeStatus = async (status) => {
    await apiPatch(`/reservations/${r.id}/status`, { status })
    onStatusChange()
  }

  const bufferHrs = typeof r.buffer_hours === 'object'
    ? (r.buffer_hours?.hours || 0)
    : (r.buffer_hours || 0)

  return (
    <>
      <tr
        className="table-row cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        id={`reservation-row-${r.id}`}
      >
        {/* # serial */}
        <td className="px-4 py-3 text-xs text-white/30 font-mono tabular-nums select-none">
          {idx + 1}
        </td>

        {/* Item */}
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-white">{r.item_name}</p>
          <p className="text-xs text-white/35 font-mono">{r.serial_number}</p>
        </td>

        {/* User name + role */}
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm text-white/70">{r.user_name ?? r.user_id?.slice(0, 8) + '…'}</p>
          {r.user_role && (
            <span className={`badge mt-0.5 text-[10px] ${ROLE_STYLE[r.user_role] || 'badge-neutral'}`}>
              {r.user_role}
            </span>
          )}
        </td>

        {/* Start */}
        <td className="px-4 py-3 text-xs text-white/45 hidden lg:table-cell">
          {formatDate(r.start_time)}
        </td>

        {/* End */}
        <td className="px-4 py-3 text-xs text-white/45 hidden xl:table-cell">
          {formatDate(r.end_time)}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <Badge value={r.status} />
        </td>

        {/* Actions — stop row-click propagation on this cell */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">
            {showApprove && (
              <ActionButton
                id={`approve-btn-${r.id}`}
                label="Approve"
                colorClass="border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald hover:bg-accent-emerald/15"
                confirmLabel="Approve?"
                onClick={() => changeStatus('approved')}
              />
            )}
            {showCancel && (
              <ActionButton
                id={`cancel-btn-${r.id}`}
                label="Cancel"
                colorClass="border-surface-border text-white/40 hover:border-accent-rose/40 hover:text-accent-rose"
                confirmLabel="Sure?"
                onClick={() => changeStatus('cancelled')}
              />
            )}
            <span className="text-white/25 text-sm ml-1 select-none">{open ? '▴' : '▾'}</span>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {open && (
        <tr className="bg-surface-card/40">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Reservation ID</p>
                <p className="text-white/60 font-mono break-all">{r.id}</p>
              </div>
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">User ID</p>
                <p className="text-white/60 font-mono break-all">{r.user_id}</p>
              </div>
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-wider mb-1">Category</p>
                <p className="text-white/60">{r.category_name} · {bufferHrs}h buffer</p>
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
  const location = useLocation()

  // Support initialTab passed via navigate() state (e.g. from Dashboard cards)
  const [activeTab,    setActiveTab]    = useState(location.state?.initialTab ?? 'all')
  const [refetchKey,   setRefetchKey]   = useState(0)
  const [showPicker,   setShowPicker]   = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // If the user navigates here again from Dashboard with a different initialTab, update
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab)
    }
  }, [location.state?.initialTab])

  const qs = activeTab === 'all' ? '' : activeTab === 'history' ? '?status=returned,cancelled' : `?status=${activeTab}`
  const res = useApi(() => apiGet(`/reservations${qs}`), [activeTab, refetchKey])
  const inventory = useApi(() => apiGet('/items'), [])

  const rows = res.data?.data ?? []

  const handleStatusChange = useCallback(() => setRefetchKey((k) => k + 1), [])
  const handleNewReservation = useCallback((item) => { setSelectedItem(item); setShowPicker(false) }, [])
  const handleBookingClose   = useCallback(() => setSelectedItem(null), [])
  const handleBookingSuccess = useCallback(() => { setSelectedItem(null); setRefetchKey((k) => k + 1) }, [])

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

      {/* ── Item picker for new reservation ── */}
      {showPicker && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Select an item to book</p>
            <button onClick={() => setShowPicker(false)} className="btn-ghost text-xs px-2 py-1 text-white/40">
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
                             hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-150 group cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 cursor-pointer ${
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Start</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden xl:table-cell">End</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <ReservationRow
                  key={r.id}
                  r={r}
                  idx={idx}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Booking modal ── */}
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
