'use strict'

// ─── API Client ────────────────────────────────────────────────────────────────
// Thin wrapper around native fetch.
// All requests go through the Vite proxy → Express (port 5000) in dev.
// In production: replace BASE with VITE_API_BASE_URL env var if needed.
//
// Phase 5 additions:
//  • JWT token is read from localStorage and injected as Authorization header.
//  • 401 responses clear the token and redirect to /login (session expired).
// ──────────────────────────────────────────────────────────────────────────────

const BASE      = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'equiptrack_token'

// ─── ApiError ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

// ─── Core request helper ─────────────────────────────────────────────────────
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }

  // ── Inject JWT if present ─────────────────────────────────────────────────
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = { method, headers }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(`${BASE}${path}`, options)

  // Parse body regardless of status (backend always returns JSON)
  let data
  try {
    data = await res.json()
  } catch {
    data = { message: res.statusText }
  }

  // ── 401 handler: clear token and redirect to /login ───────────────────────
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('equiptrack_user')
    // Only redirect if not already on an auth page to avoid loops
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login'
    }
  }

  if (!res.ok) {
    throw new ApiError(
      data?.message || `Request failed with status ${res.status}`,
      res.status
    )
  }

  return data
}

// ─── Public helpers ───────────────────────────────────────────────────────────
export const apiGet    = (path)        => request('GET',    path)
export const apiPost   = (path, body)  => request('POST',   path, body)
export const apiPatch  = (path, body)  => request('PATCH',  path, body)
export const apiDelete = (path)        => request('DELETE', path)
