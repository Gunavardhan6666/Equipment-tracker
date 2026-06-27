import { useState, useMemo, useEffect } from 'react'
import { apiGet } from '../../api/client.js'

export default function CalendarVisualizer({ itemId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const monthString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    let active = true
    const fetchCalendar = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet(`/items/${itemId}/calendar?month=${monthString}`)
        if (active) setData(res.data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchCalendar()
    return () => { active = false }
  }, [itemId, monthString])

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    // Pad leading days
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    // Month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }, [currentMonth])

  // Map reservations to dates
  const dayStatus = useMemo(() => {
    if (!data?.reservations) return {}
    const statusMap = {}
    
    // Convert buffer to ms
    const categoryBuffer = data.buffer_hours * 60 * 60 * 1000
    const itemBuffer = (data.turnaround_buffer_minutes || 0) * 60 * 1000
    const totalBuffer = categoryBuffer + itemBuffer

    data.reservations.forEach(r => {
      const start = new Date(r.start_time)
      const end = new Date(new Date(r.end_time).getTime() + totalBuffer)
      
      // Mark all days that fall within this range
      let d = new Date(start)
      d.setHours(0, 0, 0, 0)
      const endDay = new Date(end)
      endDay.setHours(0, 0, 0, 0)
      
      while (d <= endDay) {
        statusMap[d.toISOString().split('T')[0]] = 'booked'
        d.setDate(d.getDate() + 1)
      }
    })
    return statusMap
  }, [data])

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Availability Calendar</h3>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={prevMonth} className="btn-ghost px-2 py-1 text-white/50 hover:text-white">←</button>
          <span className="font-medium text-white min-w-[120px] text-center">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="btn-ghost px-2 py-1 text-white/50 hover:text-white">→</button>
        </div>
      </div>
      
      {loading && <div className="py-10 text-center text-xs text-white/40">Loading...</div>}
      {error && <div className="py-10 text-center text-xs text-accent-rose">{error}</div>}
      
      {!loading && !error && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-semibold text-white/30 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square bg-white/5 rounded-md" />
              
              const dateStr = date.toISOString().split('T')[0]
              const isBooked = dayStatus[dateStr] === 'booked'
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
              
              let bgClass = 'bg-brand-500/10 border-brand-500/20 text-brand-300'
              if (isPast) bgClass = 'bg-surface-hover/30 border-transparent text-white/20'
              else if (isBooked) bgClass = 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose line-through decoration-accent-rose/50'

              return (
                <div key={i} className={`aspect-square rounded-md border flex items-center justify-center text-xs transition-colors ${bgClass}`}>
                  {date.getDate()}
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 flex gap-4 text-[10px] uppercase font-semibold justify-center">
            <div className="flex items-center gap-1.5 text-brand-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-500/20 border border-brand-500/40"></span>
              Available
            </div>
            <div className="flex items-center gap-1.5 text-accent-rose">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent-rose/20 border border-accent-rose/40"></span>
              Booked
            </div>
          </div>
        </>
      )}
    </div>
  )
}
