import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '../../api/client.js'

// ─── AvailabilityChecker ──────────────────────────────────────────────────────
// Calls GET /api/items/:id/availability?start=&end= and renders a live result.
//
// Props:
//   itemId    — equipment item UUID
//   start     — ISO 8601 string (or empty)
//   end       — ISO 8601 string (or empty)
//   onResult  — callback(available: boolean | null) called after each check
// ──────────────────────────────────────────────────────────────────────────────
export default function AvailabilityChecker({ itemId, start, end, onResult }) {
  const [status,    setStatus]    = useState('idle') // idle | checking | available | conflict | error
  const [conflicts, setConflicts] = useState([])

  const check = useCallback(async () => {
    if (!itemId || !start || !end) {
      setStatus('idle')
      onResult?.(null)
      return
    }
    setStatus('checking')
    try {
      const data = await apiGet(
        `/items/${itemId}/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      )
      const avail = data.data.available
      setConflicts(data.data.conflicts ?? [])
      setStatus(avail ? 'available' : 'conflict')
      onResult?.(avail)
    } catch {
      setStatus('error')
      onResult?.(null)
    }
  }, [itemId, start, end, onResult])

  // Debounce: wait 600 ms after inputs settle before hitting the API
  useEffect(() => {
    const t = setTimeout(check, 600)
    return () => clearTimeout(t)
  }, [check])

  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-hover border border-surface-border">
        <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
        <span className="text-xs text-white/30">Select dates to check availability</span>
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-hover border border-surface-border animate-pulse">
        <span className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin shrink-0" />
        <span className="text-xs text-white/40">Checking availability…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-amber/5 border border-accent-amber/20">
        <span className="text-sm shrink-0">⚠️</span>
        <span className="text-xs text-accent-amber/80">Could not check availability</span>
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30">
        <span className="text-sm shrink-0">✅</span>
        <span className="text-xs font-semibold text-accent-emerald">Available for this window</span>
      </div>
    )
  }

  // conflict
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-rose/10 border border-accent-rose/30">
        <span className="text-sm shrink-0">❌</span>
        <span className="text-xs font-semibold text-accent-rose">Not available — conflicts detected</span>
      </div>
      {conflicts.length > 0 && (
        <div className="space-y-1.5">
          {conflicts.map((c) => (
            <div
              key={c.reservation_id}
              className="text-[11px] text-white/40 bg-surface-hover rounded-lg px-3 py-2 border border-surface-border/60"
            >
              <span className="font-mono text-white/25 mr-1">{c.status}</span>
              {formatRange(c.start_time, c.end_time)}
              {c.buffer_applied && (
                <span className="text-white/25 ml-1">+ {formatInterval(c.buffer_applied)} buffer</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRange(start, end) {
  const fmt = (iso) =>
    new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(iso))
  return `${fmt(start)} → ${fmt(end)}`
}

// ─── formatInterval ───────────────────────────────────────────────────────────
// The pg driver deserialises PostgreSQL INTERVAL columns as plain objects,
// e.g. { hours: 4 } or { hours: 1, minutes: 30 }.
// This helper converts that safely to a human-readable string.
function formatInterval(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const parts = []
    if (val.hours)   parts.push(`${val.hours}h`)
    if (val.minutes) parts.push(`${val.minutes}m`)
    if (val.seconds) parts.push(`${val.seconds}s`)
    return parts.length ? parts.join(' ') : '0h'
  }
  return String(val)
}
