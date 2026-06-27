import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import CompactCalendar from './CompactCalendar.jsx'
import TimeSlotPicker from './TimeSlotPicker.jsx'
import { useBooking } from '../../hooks/useBooking.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Format a Date object to a datetime-local string value (local time)
function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// ─── BookingModal ─────────────────────────────────────────────────────────────
// Props:
//   item       — { id, name, category_name, buffer_hours }
//   onClose    — called when modal should be dismissed
//   onSuccess  — called after a successful booking (triggers parent refetch)
// ──────────────────────────────────────────────────────────────────────────────
export default function BookingModal({ item, startISO, endISO, onClose, onSuccess }) {
  const { book, loading, error, success } = useBooking()
  const overlayRef = useRef(null)

  const bufferHrs = typeof item.buffer_hours === 'object' ? (item.buffer_hours?.hours || 0) : (item.buffer_hours || 0)


  const [selectedDate, setSelectedDate] = useState('')
  const [internalStartISO, setInternalStartISO] = useState(null)
  const [internalEndISO, setInternalEndISO] = useState(null)
  const [internalAvailable, setInternalAvailable] = useState(false)
  const [notes, setNotes] = useState('')

  const finalStart = startISO || internalStartISO
  const finalEnd = endISO || internalEndISO
  const canBook = (startISO && endISO) ? (!loading) : (internalAvailable && finalStart && finalEnd && !loading)

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-dismiss after success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => { onSuccess?.(); onClose() }, 1800)
      return () => clearTimeout(t)
    }
  }, [success, onSuccess, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await book({ item_id: item.id, start_time: finalStart, end_time: finalEnd, notes: notes || undefined })
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,20,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        id="booking-modal"
        className="w-full max-w-lg glass-card overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-white">Book Equipment</h2>
            <p className="text-sm text-white/45 mt-0.5 truncate max-w-xs">{item.name}</p>
          </div>
          <button
            id="booking-modal-close"
            onClick={onClose}
            className="btn-ghost px-2 py-1 text-white/40 hover:text-white ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-5xl animate-bounce">🎉</div>
            <p className="font-semibold text-white">Reservation created!</p>
            <p className="text-sm text-white/40">Closing in a moment…</p>
          </div>
        ) : (
          <form id="booking-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Buffer info */}
            {bufferHrs > 0 && (
              <div className="rounded-xl border border-accent-amber/25 bg-accent-amber/5 px-3 py-2">
                <p className="text-[11px] text-accent-amber/80">
                  ⏱ Buffer: {bufferHrs}h cooldown is applied after every return for <em>{item.category_name}</em>
                </p>
              </div>
            )}


            {!startISO && !endISO && (
              <div className="space-y-4">
                <CompactCalendar 
                  entityId={item.id}
                  type="item"
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
                <TimeSlotPicker 
                  entityId={item.id}
                  type="item"
                  date={selectedDate}
                  onTimeSelected={(s, e, valid) => {
                    setInternalStartISO(s)
                    setInternalEndISO(e)
                    setInternalAvailable(valid)
                  }}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="booking-notes" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Notes <span className="text-white/25 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                id="booking-notes"
                rows={2}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Purpose of booking, project name…"
                className="input-field resize-none"
              />
            </div>

            {/* API error */}
            {error && (
              <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose space-y-1">
                <p className="font-semibold">⚠ Booking failed</p>
                <p className="text-xs text-accent-rose/70">{error.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                id="booking-modal-submit"
                type="submit"
                disabled={!canBook}
                className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Booking…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                    Confirm Booking
                  </>
                )}
              </button>
            </div>

            {!canBook && !loading && !startISO && (
              <p className="text-center text-[11px] text-white/25">
                Confirm button unlocks once a valid time slot is selected.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
