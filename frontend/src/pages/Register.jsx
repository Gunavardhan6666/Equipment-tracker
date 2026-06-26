import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_OPTIONS = [
  { value: 'student',   label: 'Student',   desc: 'Can browse inventory and request equipment.' },
  { value: 'professor', label: 'Professor',  desc: 'Can approve reservations and book directly.' },
]

// ─── Register ─────────────────────────────────────────────────────────────────
export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form,     setForm]     = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent), #0d0d14' }}
      >
        <div className="glass-card p-10 max-w-sm w-full text-center space-y-4 animate-fade-in">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-white">Account created!</h2>
          <p className="text-sm text-white/50">Redirecting you to the login page…</p>
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.12), transparent), #0d0d14'
      }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in">

        {/* ── Logo ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 shadow-glow-indigo mx-auto">
            <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create an account</h1>
            <p className="text-sm text-white/40 mt-1">Join EquipTrack · FilmDept University</p>
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

          <form id="register-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Jane Smith"
                className="input-field"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@filmdept.edu"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Password <span className="text-white/25 font-normal normal-case tracking-normal">(min 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  id="register-toggle-password"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    id={`register-role-${value}`}
                    onClick={() => setForm((prev) => ({ ...prev, role: value }))}
                    className={`text-left p-3 rounded-xl border transition-all duration-150 space-y-1 ${
                      form.role === value
                        ? 'border-brand-500/60 bg-brand-500/10 shadow-glow-indigo'
                        : 'border-surface-border bg-surface-hover hover:border-brand-500/30'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.role === value ? 'text-brand-300' : 'text-white/70'}`}>
                      {label}
                    </p>
                    <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/25">
                Admin accounts must be promoted via the database.
              </p>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-white/35">
            Already have an account?{' '}
            <Link to="/login" id="register-login-link" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
