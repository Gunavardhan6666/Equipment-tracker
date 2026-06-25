import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import ConditionBadge from '../components/items/ConditionBadge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

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

  if (item.loading) return <LoadingSpinner className="py-32" />
  if (item.error)   return (
    <EmptyState
      icon="⚠️"
      title={item.error.statusCode === 404 ? 'Item not found' : 'Error loading item'}
      message={item.error.message}
      action={<Link to="/inventory" className="btn-secondary text-sm">← Back to Inventory</Link>}
    />
  )

  const d = item.data?.data
  if (!d) return null

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
          <DetailRow label="Buffer Time" value={`${d.buffer_hours} hour${d.buffer_hours !== 1 ? 's' : ''} cooldown after return`} />
          <DetailRow label="Description" value={d.description} />
          <DetailRow label="Notes"       value={d.notes} />
          <DetailRow label="Condition"   value={d.condition} />
          <DetailRow label="Active"      value={d.is_active ? 'Yes' : 'Archived'} />
          <DetailRow label="Added"       value={new Date(d.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>

        {/* Availability panel — 1/3 */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Check Availability</h2>

          <p className="text-xs text-white/35 leading-relaxed">
            Full date-range picker launches in <strong className="text-white/50">Phase 6</strong> (Booking UI & Calendar Integration).
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">From</label>
              <input type="datetime-local" className="input-field" disabled
                title="Coming in Phase 6" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">To</label>
              <input type="datetime-local" className="input-field" disabled
                title="Coming in Phase 6" />
            </div>
          </div>

          <button
            disabled
            className="btn-primary w-full justify-center opacity-50 cursor-not-allowed"
            title="Coming in Phase 6"
          >
            Check Availability
          </button>

          <div className="rounded-xl border border-accent-amber/25 bg-accent-amber/5 px-3 py-2.5">
            <p className="text-[11px] text-accent-amber/80 font-medium">
              Buffer time: {d.buffer_hours}h after every return
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              Category: {d.category_name} · Overlap Engine active
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
