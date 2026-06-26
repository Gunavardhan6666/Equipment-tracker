import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// ─── Login ────────────────────────────────────────────────────────────────────
export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [showPass, setShowPass] = useState(false)

  // After login, go back to wherever the user was trying to reach
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.12), transparent), #0d0d14'
      }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in">

        {/* ── Logo ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 shadow-glow-indigo mx-auto">
            <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-white/40 mt-1">Sign in to EquipTrack · FilmDept University</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="glass-card p-8 space-y-6">

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@filmdept.edu"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-white/35">
            Don't have an account?{' '}
            <Link to="/register" id="login-register-link" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one →
            </Link>
          </p>
        </div>

        {/* Admin hint */}
        <p className="text-center text-xs text-white/20">
          Admin accounts are promoted directly in the database.
        </p>
      </div>
    </div>
  )
}
