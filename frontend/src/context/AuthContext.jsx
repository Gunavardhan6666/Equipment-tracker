import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiPost } from '../api/client.js'

// ─── AuthContext ───────────────────────────────────────────────────────────────
// Provides: { user, token, login, register, logout, loading }
//
// user  — decoded JWT payload { id, email, role, full_name } or null
// token — raw JWT string from localStorage or null
// ──────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

const TOKEN_KEY = 'equiptrack_token'
const USER_KEY = 'equiptrack_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // Persist token + user to localStorage whenever they change
  useEffect(() => {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }, [token, user])

  // ─── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await apiPost('/api/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── register ──────────────────────────────────────────────────────────────
  const register = useCallback(async ({ email, password, full_name, role }) => {
    setLoading(true)
    try {
      const data = await apiPost('/auth/register', { email, password, full_name, role })
      // Don't auto-login after register; redirect to /login
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
