import { useState, useEffect, useCallback } from 'react'

// ─── useApi ───────────────────────────────────────────────────────────────────
// Generic data-fetching hook. Wraps any API call function.
//
// Usage:
//   const { data, loading, error, refetch } = useApi(() => apiGet('/api/items'))
//
// Returns:
//   data    — parsed response body (null until resolved)
//   loading — boolean
//   error   — ApiError instance or null
//   refetch — call this to re-run the fetcher manually
// ──────────────────────────────────────────────────────────────────────────────
export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}
