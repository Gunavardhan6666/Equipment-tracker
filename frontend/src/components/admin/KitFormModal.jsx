import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { apiPost, apiPatch, apiDelete } from '../../api/client.js'
import { useApi } from '../../hooks/useApi.js'
import { apiGet } from '../../api/client.js'

// ─── KitFormModal ─────────────────────────────────────────────────────────────
export default function KitFormModal({ kit, onClose, onSuccess }) {
  const isEdit = Boolean(kit)
  const overlayRef = useRef(null)

  // Load all active inventory items
  const allItems = useApi(() => apiGet('/items'))

  // Group physical items by equipment_name
  const groupedItems = useMemo(() => {
    if (!allItems.data?.data) return []
    const groups = {}
    for (const item of allItems.data.data) {
      if (!groups[item.name]) {
        groups[item.name] = {
          name: item.name,
          category_name: item.category_name,
          total_available: 0
        }
      }
      if (item.condition === 'good' || item.condition === 'fair') {
        groups[item.name].total_available++
      }
    }
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
  }, [allItems.data])

  // Pre-populate selected items for edit mode { [equipment_name]: quantity }
  const initialSelected = useMemo(() => {
    const map = {}
    if (isEdit && kit.items) {
      kit.items.forEach(i => {
        map[i.equipment_name] = i.quantity
      })
    }
    return map
  }, [isEdit, kit])

  const [name,        setName]        = useState(isEdit ? kit.name        ?? '' : '')
  const [description, setDescription] = useState(isEdit ? kit.description ?? '' : '')
  const [selected,    setSelected]    = useState(initialSelected)
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(false)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-dismiss after success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => { onSuccess?.(); onClose() }, 1400)
      return () => clearTimeout(t)
    }
  }, [success, onSuccess, onClose])

  const setQuantity = useCallback((equipmentName, delta) => {
    setSelected((prev) => {
      const current = prev[equipmentName] || 0
      const next = Math.max(0, current + delta)
      
      const newMap = { ...prev }
      if (next === 0) {
        delete newMap[equipmentName]
      } else {
        newMap[equipmentName] = next
      }
      return newMap
    })
  }, [])

  const filteredGroups = groupedItems.filter((group) =>
    !search || group.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Kit name is required.'); return }

    setLoading(true)
    setError(null)
    try {
      if (isEdit) {
        // 1. Update kit metadata
        await apiPatch(`/kits/${kit.id}`, { name: name.trim(), description: description.trim() || undefined })

        // 2. Diff item membership
        const originalNames = Object.keys(initialSelected)
        const newNames = Object.keys(selected)

        const toAddOrUpdate = newNames.filter(
          n => !originalNames.includes(n) || initialSelected[n] !== selected[n]
        )
        const toRemove = originalNames.filter(n => !newNames.includes(n))

        await Promise.all([
          ...toAddOrUpdate.map((n) => apiPost(`/kits/${kit.id}/items`, { equipment_name: n, quantity: selected[n] })),
          ...toRemove.map((n) => apiDelete(`/kits/${kit.id}/items/${encodeURIComponent(n)}`)),
        ])
      } else {
        // 1. Create the kit
        const res = await apiPost('/kits', { name: name.trim(), description: description.trim() || undefined })
        const newKitId = res.data.id

        // 2. Add all selected items
        await Promise.all(
          Object.entries(selected).map(([eqName, qty]) => 
            apiPost(`/kits/${newKitId}/items`, { equipment_name: eqName, quantity: qty })
          )
        )
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = Object.keys(selected).length

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,20,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        id="kit-form-modal"
        className="w-full max-w-xl glass-card overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-white">
            {isEdit ? 'Edit Kit' : 'Create New Kit'}
          </h2>
          <button id="kit-form-modal-close" onClick={onClose} className="btn-ghost px-2 py-1 text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        {/* ── Success ── */}
        {success ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-5xl animate-bounce">✅</div>
            <p className="font-semibold text-white">{isEdit ? 'Kit updated!' : 'Kit created!'}</p>
          </div>
        ) : (
          <form id="kit-form" onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="kit-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Kit Name <span className="text-accent-rose">*</span>
                </label>
                <input
                  id="kit-name"
                  type="text"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Documentary Shoot Kit"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="kit-description" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Description <span className="text-white/25 font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="kit-description"
                  type="text"
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what this kit contains…"
                  className="input-field"
                />
              </div>

              {/* Item selection list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Equipment Requirements <span className="text-white/25 font-normal normal-case">({selectedCount} selected)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Filter equipment…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field text-xs py-1 px-2 w-40"
                  />
                </div>

                <div className="rounded-xl border border-surface-border bg-surface/40 divide-y divide-surface-border/40 max-h-52 overflow-y-auto">
                  {allItems.loading ? (
                    <p className="text-xs text-white/30 p-4 text-center">Loading equipment list…</p>
                  ) : filteredGroups.length === 0 ? (
                    <p className="text-xs text-white/30 p-4 text-center">No equipment found.</p>
                  ) : (
                    filteredGroups.map((group) => {
                      const qty = selected[group.name] || 0
                      return (
                        <div
                          key={group.name}
                          className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                            qty > 0 ? 'bg-brand-500/10' : 'hover:bg-surface-hover'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-medium text-white truncate">{group.name}</p>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">
                              Available: {group.total_available}
                            </p>
                          </div>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-3 shrink-0 bg-surface border border-surface-border rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => setQuantity(group.name, -1)}
                              disabled={qty <= 0}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-white"
                            >
                              −
                            </button>
                            <span className="text-xs font-mono font-bold text-white min-w-[1.25rem] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(group.name, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-hover text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
                  <p className="font-semibold">⚠ Error</p>
                  <p className="text-xs text-accent-rose/70 mt-0.5">{error}</p>
                </div>
              )}
            </div>

            {/* ── Footer actions — sticky at bottom ── */}
            <div className="flex gap-3 p-6 pt-4 border-t border-surface-border shrink-0">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                id="kit-form-submit"
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : isEdit ? 'Save Changes' : 'Create Kit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
