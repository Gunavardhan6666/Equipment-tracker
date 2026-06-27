import { useState, useMemo, useEffect } from 'react'
import { apiGet } from '../../api/client.js'

export default function CompactCalendar({ entityId, type = 'item', onDateSelect, selectedDate }) {
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
        const endpoint = type === 'item' ? `/items/${entityId}/calendar` : `/kits/${entityId}/calendar`
        const res = await apiGet(`${endpoint}?month=${monthString}`)
        if (active) setData(res.data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchCalendar()
    return () => { active = false }
  }, [entityId, type, monthString])

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [currentMonth])

  const dayStatus = useMemo(() => {
    if (!data?.reservations) return {}
    const statusMap = {}
    const categoryBuffer = (data.buffer_hours || 0) * 60 * 60 * 1000
    const itemBuffer = (data.turnaround_buffer_minutes || 0) * 60 * 1000
    const totalBuffer = categoryBuffer + itemBuffer

    data.reservations.forEach(r => {
      const start = new Date(r.start_time)
      const end = new Date(new Date(r.end_time).getTime() + totalBuffer)
      
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
    <div className="bg-surface-elevated rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="btn-ghost px-2 py-1 text-white/50 hover:text-white">←</button>
        <span className="font-semibold text-sm text-white">
          {currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="btn-ghost px-2 py-1 text-white/50 hover:text-white">→</button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-white/40">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />
          
          const dateStr = date.toISOString().split('T')[0]
          const isBooked = dayStatus[dateStr] === 'booked'
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
          const isSelected = selectedDate === dateStr
          
          let btnClass = 'hover:bg-brand-500/20 text-white cursor-pointer'
          if (isPast) btnClass = 'text-white/20 cursor-not-allowed'
          else if (isBooked && type === 'item') btnClass = 'bg-accent-rose/10 text-accent-rose line-through decoration-accent-rose/50 cursor-pointer'
          
          if (isSelected) btnClass = 'bg-brand-500 text-white font-bold ring-2 ring-brand-300'

          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onDateSelect(dateStr)}
              className={`aspect-square rounded flex items-center justify-center text-[11px] transition-all ${btnClass}`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
