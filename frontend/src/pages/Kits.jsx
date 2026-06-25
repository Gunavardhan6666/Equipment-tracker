import { useState } from 'react'
import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

// ─── KitCard ──────────────────────────────────────────────────────────────────
function KitCard({ kit }) {
  const [open, setOpen] = useState(false)
  const members = useApi(
    () => (open ? apiGet(`/kits/${kit.id}`) : Promise.resolve(null)),
    [open, kit.id]
  )

  return (
    <div className="glass-card overflow-hidden hover:border-brand-500/25 transition-all duration-200">
      {/* Header */}
      <button
        id={`kit-card-${kit.id}`}
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{kit.name}</h3>
            <span className="badge badge-brand text-xs">{kit.item_count} items</span>
          </div>
          {kit.description && (
            <p className="text-xs text-white/35 mt-1 line-clamp-1">{kit.description}</p>
          )}
        </div>
        <span className={`text-white/30 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expandable member list */}
      {open && (
        <div className="border-t border-surface-border px-5 pb-4 pt-3">
          {members.loading ? (
            <LoadingSpinner size="sm" className="py-3" />
          ) : members.data?.data?.items?.length ? (
            <div className="space-y-2">
              {members.data.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-surface-border/30 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white/70">{item.name}</p>
                    <p className="text-[10px] text-white/30 font-mono">{item.serial_number}</p>
                  </div>
                  <span className={`badge text-[10px] ${
                    item.condition === 'good'    ? 'badge-success' :
                    item.condition === 'fair'    ? 'badge-warning' :
                    item.condition === 'damaged' ? 'badge-danger'  : 'badge-neutral'
                  }`}>{item.condition}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 py-2">No active items in this kit.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Kits Page ────────────────────────────────────────────────────────────────
export default function Kits() {
  const kits = useApi(() => apiGet('/kits'))

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1 className="page-title">Equipment Kits</h1>
        <p className="page-subtitle">Pre-configured bundles — click a kit to see its member items</p>
      </div>

      {/* ── Kits list ── */}
      {kits.loading ? (
        <LoadingSpinner className="py-20" />
      ) : kits.error ? (
        <EmptyState
          icon="⚠️"
          title="Could not load kits"
          message={kits.error.message}
        />
      ) : !kits.data?.data?.length ? (
        <EmptyState
          icon="📦"
          title="No kits configured"
          message="Create kits via POST /api/kits to bundle equipment for checkout."
        />
      ) : (
        <div className="space-y-3">
          {kits.data.data.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  )
}
