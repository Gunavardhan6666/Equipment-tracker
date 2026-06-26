import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Wraps routes that require authentication.
// If user is not logged in → redirect to /login (preserving intended destination).
// If `roles` prop is provided → also enforces role-based access (403 card).
//
// Usage:
//   <ProtectedRoute>                         — auth only
//   <ProtectedRoute roles={['admin']}>       — admin only
// ──────────────────────────────────────────────────────────────────────────────
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="glass-card max-w-sm w-full p-8 text-center space-y-4">
          <div className="text-5xl">🚫</div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-sm text-white/50">
            Your role (<span className="text-accent-amber font-semibold">{user.role}</span>)
            does not have permission to view this page.
          </p>
          <a href="/" className="btn-primary inline-block">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return children
}
