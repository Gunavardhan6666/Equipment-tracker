import { Link } from 'react-router-dom'
import ConditionBadge from './ConditionBadge.jsx'

// ─── ItemCard ─────────────────────────────────────────────────────────────────
// Compact item card for the Inventory grid view.
export default function ItemCard({ item }) {
  const { id, name, serial_number, category_name, condition, description } = item

  return (
    <div className="glass-card p-5 flex flex-col gap-3 hover:border-brand-500/30 hover:shadow-glow-indigo transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight truncate group-hover:text-brand-300 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-white/40 font-mono mt-0.5 truncate">{serial_number}</p>
        </div>
        <ConditionBadge condition={condition} />
      </div>

      {/* Category pill */}
      <span className="badge badge-neutral self-start text-xs">{category_name}</span>

      {/* Description */}
      {description && (
        <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* Footer */}
      <Link
        to={`/inventory/${id}`}
        className="btn-secondary text-xs px-3 py-1.5 self-start mt-auto"
        id={`item-card-view-${id}`}
      >
        View Details →
      </Link>
    </div>
  )
}
