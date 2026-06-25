// ─── EmptyState ───────────────────────────────────────────────────────────────
// Displayed when a list has no data or an error occurs.
// icon prop: SVG element | emoji string
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-surface-border flex items-center justify-center text-white/25 mb-5">
          {typeof icon === 'string' ? (
            <span className="text-3xl">{icon}</span>
          ) : (
            <span className="w-8 h-8">{icon}</span>
          )}
        </div>
      )}
      <h3 className="text-base font-semibold text-white/70 mb-1">{title}</h3>
      {message && <p className="text-sm text-white/35 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
