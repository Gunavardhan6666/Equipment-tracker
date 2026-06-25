// ─── Badge ────────────────────────────────────────────────────────────────────
// Maps a reservation status or condition value to the correct design-system pill.
// variant prop overrides automatic mapping when needed.

const STATUS_MAP = {
  // Reservation statuses
  pending:   'badge-warning',
  approved:  'badge-brand',
  active:    'badge-success',
  returned:  'badge-neutral',
  cancelled: 'badge-neutral',
  overdue:   'badge-danger',
  // Condition values
  good:      'badge-success',
  fair:      'badge-warning',
  damaged:   'badge-danger',
  retired:   'badge-neutral',
}

const STATUS_LABELS = {
  pending:   '⏳ Pending',
  approved:  '✓ Approved',
  active:    '🟢 Active',
  returned:  '↩ Returned',
  cancelled: '✕ Cancelled',
  overdue:   '⚠ Overdue',
  good:      'Good',
  fair:      'Fair',
  damaged:   'Damaged',
  retired:   'Retired',
}

export default function Badge({ value, variant, label, className = '' }) {
  const cls     = variant ?? STATUS_MAP[value] ?? 'badge-neutral'
  const display = label ?? STATUS_LABELS[value] ?? value

  return (
    <span className={`${cls} ${className}`}>
      {display}
    </span>
  )
}
