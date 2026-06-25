import { Link } from 'react-router-dom'

// ─── NotFound ─────────────────────────────────────────────────────────────────
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center px-6 animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-surface-hover border border-surface-border flex items-center justify-center mb-8">
        <span className="text-5xl">404</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-white/40 max-w-xs mb-8">
        This route doesn't exist in EquipTrack. Check the URL or head back to the dashboard.
      </p>
      <Link to="/" id="not-found-home-link" className="btn-primary">
        ← Back to Dashboard
      </Link>
    </div>
  )
}
