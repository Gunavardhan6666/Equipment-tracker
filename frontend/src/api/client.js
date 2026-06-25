'use strict'

// ─── API Client ────────────────────────────────────────────────────────────────
// Thin wrapper around native fetch.
// All requests go through the Vite proxy → Express (port 5000) in dev.
// In production: replace BASE with VITE_API_BASE_URL env var if needed.
//
// Every response is parsed as JSON.
// Non-2xx responses throw an ApiError with { message, status, statusCode }.
// ──────────────────────────────────────────────────────────────────────────────

const BASE = '/api' // Vite proxy handles /api/* → http://localhost:5000

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
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

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
