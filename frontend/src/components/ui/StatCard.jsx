// ─── StatCard ─────────────────────────────────────────────────────────────────
// Animated count-up metric tile. Used on Dashboard.
import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function StatCard({ value, label, color = 'text-brand-400', icon, loading = false }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (loading || value == null) return
    let start = 0
    const target = Number(value)
    const timer = setInterval(() => {
      start += Math.ceil(target / 40)
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, 30)
    return () => clearInterval(timer)
  }, [value, loading])

  return (
    <div className="stat-card group animate-fade-in">
      {loading ? (
        <LoadingSpinner size="sm" className="py-3" />
      ) : (
        <>
          {icon && <span className={`${color} mb-1`}>{icon}</span>}
          <p className={`text-3xl font-bold tabular-nums ${color}`}>{count.toLocaleString()}</p>
          <p className="text-sm text-white/50 font-medium">{label}</p>
        </>
      )}
    </div>
  )
}
