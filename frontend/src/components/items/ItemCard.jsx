import { Link } from 'react-router-dom'
import ConditionBadge from './ConditionBadge.jsx'

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 8.625" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────
// Props:
//   item     — item object
//   isAdmin  — boolean; shows edit/delete buttons when true
//   onEdit   — (item) => void; called when pencil is clicked
//   onDelete — (item) => void; called when trash is clicked
// ──────────────────────────────────────────────────────────────────────────────
export default function ItemCard({ item, isAdmin = false, onEdit, onDelete }) {
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
      <div className="flex items-center gap-2 mt-auto">
        <Link
          to={`/inventory/${id}`}
          className="btn-secondary text-xs px-3 py-1.5"
          id={`item-card-view-${id}`}
        >
          View Details →
        </Link>

        {/* Admin-only actions */}
        {isAdmin && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              id={`item-card-edit-${id}`}
              onClick={() => onEdit?.(item)}
              title="Edit item"
              className="btn-ghost p-1.5 text-white/40 hover:text-brand-300"
            >
              <PencilIcon />
            </button>
            <button
              id={`item-card-delete-${id}`}
              onClick={() => onDelete?.(item)}
              title="Archive item"
              className="btn-ghost p-1.5 text-white/40 hover:text-accent-rose"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
