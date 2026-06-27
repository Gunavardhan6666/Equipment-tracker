import { useState, useEffect } from 'react'
import { apiGet } from '../../api/client.js'

function formatTime(isoStr) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(new Date(isoStr))
}

export default function TimeSlotPicker({ entityId, type = 'item', date, onTimeSelected }) {
  const [windows, setWindows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Local state for the time pickers
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    let active = true
    const fetchSlots = async () => {
      setLoading(true)
      setError(null)
      try {
        const endpoint = type === 'item' ? `/items/${entityId}/timeslots` : `/kits/${entityId}/timeslots`
        const res = await apiGet(`${endpoint}?date=${date}`)
        if (active) setWindows(res.data.windows)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    if (date) fetchSlots()
    return () => { active = false }
  }, [entityId, type, date])

  // Validate selected times against windows
  useEffect(() => {
    if (!startTime || !endTime || !windows) {
      onTimeSelected(null, null, false)
      return
    }

    const s = new Date(`${date}T${startTime}`)
    const e = new Date(`${date}T${endTime}`)

    if (e <= s) {
      onTimeSelected(s.toISOString(), e.toISOString(), false)
      return
    }

    // Check if [s, e] falls ENTIRELY within any single available window
    let isValid = false
    for (const w of windows) {
      const wStart = new Date(w.start)
      const wEnd = new Date(w.end)
      if (s >= wStart && e <= wEnd) {
        isValid = true
        break
      }
    }

    onTimeSelected(s.toISOString(), e.toISOString(), isValid)
  }, [startTime, endTime, windows, date, onTimeSelected])

  if (!date) {
    return <div className="text-center text-xs text-white/40 py-6 bg-surface-elevated rounded-xl border border-surface-border">Select a date from the calendar.</div>
  }

  if (loading) {
    return <div className="text-center text-xs text-brand-400 py-6 bg-surface-elevated rounded-xl border border-surface-border">Checking availability...</div>
  }

  if (error) {
    return <div className="text-center text-xs text-accent-rose py-6 bg-surface-elevated rounded-xl border border-surface-border">{error}</div>
  }

  return (
    <div className="bg-surface-elevated rounded-xl border border-surface-border p-5 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Available Windows</h4>
        {windows?.length === 0 ? (
          <p className="text-xs text-accent-rose bg-accent-rose/10 p-2 rounded">Fully booked for this day.</p>
        ) : (
          <ul className="space-y-1.5">
            {windows?.map((w, i) => (
              <li key={i} className="text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span className="text-white/80">{formatTime(w.start)} — {formatTime(w.end)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-border">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/50 uppercase">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={windows?.length === 0}
            className="w-full bg-surface-base border border-surface-border text-white text-sm rounded-lg px-3 py-1.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/50 uppercase">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={windows?.length === 0}
            className="w-full bg-surface-base border border-surface-border text-white text-sm rounded-lg px-3 py-1.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
