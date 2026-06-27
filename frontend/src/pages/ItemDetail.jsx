import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import ConditionBadge from '../components/items/ConditionBadge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Badge from '../components/ui/Badge.jsx'
import CompactCalendar from '../components/booking/CompactCalendar.jsx'
import TimeSlotPicker from '../components/booking/TimeSlotPicker.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import CalendarVisualizer from '../components/booking/CalendarVisualizer.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function defaultDates() {
  const start = new Date(Date.now() + 60 * 60 * 1000)
  start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start: toLocalInput(start), end: toLocalInput(end) }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-4 py-3 border-b border-surface-border/40 last:border-0">
      <span className="text-xs font-semibold text-white/30 uppercase tracking-wider w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-white/75">{value}</span>
    </div>
  )
}

// ─── Item Detail ──────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id } = useParams()
  const item = useApi(() => apiGet(`/items/${id}`), [id])

  const [selectedDate, setSelectedDate] = useState('')
  const [startISO, setStartISO] = useState(null)
  const [endISO, setEndISO]     = useState(null)
  const [available, setAvailable] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Refetch key for upcoming reservations panel
  const [resKey, setResKey] = useState(0)
  const reservations = useApi(
    () => apiGet(`/reservations?item_id=${id}`),
    [id, resKey]
  )

  const handleBookingSuccess = useCallback(() => {
    setResKey((k) => k + 1) // refetch upcoming reservations
  }, [])

  // Filter to non-cancelled, non-returned — most recent first
  const upcomingRes = (reservations.data?.data ?? [])
    .filter((r) => !['cancelled', 'returned'].includes(r.status))
    .slice(0, 8)

  if (item.loading) return <LoadingSpinner className="py-32" />
  if (item.error) return (
    <EmptyState
      icon="⚠️"
      title={item.error.statusCode === 404 ? 'Item not found' : 'Error loading item'}
      message={item.error.message}
      action={<Link to="/inventory" className="btn-secondary text-sm">← Back to Inventory</Link>}
    />
  )

  const d = item.data?.data
  if (!d) return null

  const bufferHrs = typeof d.buffer_hours === 'object' ? (d.buffer_hours?.hours || 0) : (d.buffer_hours || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Back link ── */}
      <Link to="/inventory" className="btn-ghost text-sm pl-0">
        ← Back to Inventory
      </Link>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{d.name}</h1>
          <p className="text-xs text-white/35 font-mono mt-1">S/N: {d.serial_number}</p>
        </div>
        <ConditionBadge condition={d.condition} />
      </div>

      {/* ── Two column layout ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Details — 2/3 */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Item Details</h2>
          <DetailRow label="Category"    value={d.category_name} />
          <DetailRow label="Buffer Time" value={`${bufferHrs} hour${bufferHrs !== 1 ? 's' : ''} cooldown after return`} />
          <DetailRow label="Description" value={d.description} />
          <DetailRow label="Notes"       value={d.notes} />
          <DetailRow label="Condition"   value={d.condition} />
          <DetailRow label="Active"      value={d.is_active ? 'Yes' : 'Archived'} />
          <DetailRow label="Added"       value={new Date(d.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>

        {/* Availability & Booking — 1/3 */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Check & Book</h2>

          {['good', 'fair'].includes(d.condition) ? (
            <>
              {/* Interactive Calendar for booking */}
              <CompactCalendar 
                entityId={d.id} 
                type="item" 
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />

              <TimeSlotPicker 
                entityId={d.id} 
                type="item" 
                date={selectedDate} 
                onTimeSelected={(s, e, valid) => {
                  setStartISO(s)
                  setEndISO(e)
                  setAvailable(valid)
                }} 
              />

              {/* Book button */}
              <button
                id="item-detail-book-btn"
                disabled={!available || !d.is_active}
                onClick={() => setShowModal(true)}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                title={!d.is_active ? 'Item is archived' : !available ? 'Confirm availability first' : 'Create reservation'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
                Book Now
              </button>

              {/* Buffer reminder */}
              <div className="rounded-xl border border-accent-amber/25 bg-accent-amber/5 px-3 py-2.5 mt-2">
                <p className="text-[11px] text-accent-amber/80 font-medium">
                  Buffer: {bufferHrs}h after every return
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {d.category_name} · Overlap Engine active
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-6 text-center space-y-2">
              <span className="text-2xl">🚫</span>
              <p className="text-sm font-semibold text-accent-rose uppercase">Not Available</p>
              <p className="text-xs text-white/50 leading-relaxed">
                This item is currently marked as <strong className="text-white/80">{d.condition}</strong> and cannot be reserved until it is repaired or replaced.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Availability Calendar ── */}
      <CalendarVisualizer itemId={d.id} />

      {/* ── Upcoming Reservations ── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Upcoming Reservations
          </h2>
          {reservations.loading && (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin" />
          )}
        </div>

        {reservations.error ? (
          <p className="text-xs text-accent-rose/70">Could not load reservations.</p>
        ) : upcomingRes.length === 0 ? (
          <p className="text-xs text-white/25 py-2">No active or pending reservations for this item.</p>
        ) : (
          <div className="space-y-0">
            {upcomingRes.map((r) => (
              <div key={r.id} className="table-row py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 truncate">{r.user_name}</p>
                  <p className="text-[11px] text-white/30 font-mono truncate">{formatDate(r.start_time)} → {formatDate(r.end_time)}</p>
                </div>
                <Badge value={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {showModal && (
        <BookingModal
          item={{ id: d.id, name: d.name, category_name: d.category_name, buffer_hours: bufferHrs }}
          startISO={startISO}
          endISO={endISO}
          onClose={() => setShowModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  )
}
