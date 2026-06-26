import { useState, useCallback } from 'react'
import { apiPost } from '../api/client.js'

// ─── useBooking ───────────────────────────────────────────────────────────────
// Thin hook wrapping single-item and kit booking API calls.
// Keeps BookingModal components clean of fetch state management.
//
// Returns: { book, bookKit, loading, error, success, reset }
// ──────────────────────────────────────────────────────────────────────────────
export function useBooking() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
  }, [])

  // Single-item booking
  const book = useCallback(async ({ item_id, start_time, end_time, notes }) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const data = await apiPost('/reservations', { item_id, start_time, end_time, notes })
      setSuccess(true)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Kit booking
  const bookKit = useCallback(async ({ kit_id, start_time, end_time, notes }) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const data = await apiPost('/reservations/kit', { kit_id, start_time, end_time, notes })
      setSuccess(true)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { book, bookKit, loading, error, success, reset }
}
