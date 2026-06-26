import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { apiPost, apiPatch } from '../../api/client.js'
import { useApi } from '../../hooks/useApi.js'
import { apiGet } from '../../api/client.js'

// ─── Condition options (mirrors backend VALID_CONDITIONS) ─────────────────────
const CONDITIONS = [
  { value: 'good',           label: 'Good' },
  { value: 'fair',           label: 'Fair' },
  { value: 'damaged',        label: 'Damaged' },
  { value: 'in_maintenance', label: 'In Maintenance' },
  { value: 'retired',        label: 'Retired' },
  { value: 'lost',           label: 'Lost' },
  { value: 'stolen',         label: 'Stolen' },
]

const BLANK = { name: '', description: '', notes: '', condition: 'good', category_id: '' }

// ─── ItemFormModal ────────────────────────────────────────────────────────────
// Used for both Add (item = null) and Edit (item = existing item object).
//
// Props:
//   item      — null for create; item object for edit
//   onClose   — dismiss modal
//   onSuccess — called after successful create/update (triggers parent refetch)
// ──────────────────────────────────────────────────────────────────────────────
export default function ItemFormModal({ item, onClose, onSuccess }) {
  const isEdit = Boolean(item)
  const overlayRef = useRef(null)

  const categories = useApi(() => apiGet('/categories'))

  const [form,    setForm]    = useState(() =>
    isEdit
      ? {
          name:          item.name          ?? '',
          description:   item.description   ?? '',
          notes:         item.notes         ?? '',
          condition:     item.condition     ?? 'good',
          category_id:   item.category_id   ?? '',
        }
      : { ...BLANK }
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

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

  const set = useCallback((field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value })), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEdit) {
        await apiPatch(`/items/${item.id}`, form)
      } else {
        await apiPost('/items', form)
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,20,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        id="item-form-modal"
        className="w-full max-w-lg glass-card overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEdit ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>
            {isEdit ? (
              <p className="text-xs text-white/35 font-mono mt-0.5">{item.serial_number}</p>
            ) : (
              <p className="text-xs text-white/35 font-mono mt-0.5">Serial number auto-generated</p>
            )}
          </div>
          <button
            id="item-form-modal-close"
            onClick={onClose}
            className="btn-ghost px-2 py-1 text-white/40 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-5xl animate-bounce">✅</div>
            <p className="font-semibold text-white">
              {isEdit ? 'Item updated!' : 'Item created!'}
            </p>
          </div>
        ) : (
          <form id="item-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="item-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Name <span className="text-accent-rose">*</span>
              </label>
              <input
                id="item-name"
                type="text"
                required
                maxLength={200}
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Sony FX3 Cinema Camera"
                className="input-field"
              />
            </div>

            {/* Category + Condition row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="item-category" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Category <span className="text-accent-rose">*</span>
                </label>
                <select
                  id="item-category"
                  required
                  value={form.category_id}
                  onChange={set('category_id')}
                  className="input-field"
                >
                  <option value="">Select…</option>
                  {(categories.data?.data ?? []).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="item-condition" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Condition
                </label>
                <select
                  id="item-condition"
                  value={form.condition}
                  onChange={set('condition')}
                  className="input-field"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="item-description" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Description <span className="text-white/25 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                id="item-description"
                rows={2}
                maxLength={1000}
                value={form.description}
                onChange={set('description')}
                placeholder="Brief overview of the item…"
                className="input-field resize-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="item-notes" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Internal Notes <span className="text-white/25 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                id="item-notes"
                rows={2}
                maxLength={1000}
                value={form.notes}
                onChange={set('notes')}
                placeholder="Maintenance history, damage notes…"
                className="input-field resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
                <p className="font-semibold">⚠ Error</p>
                <p className="text-xs text-accent-rose/70 mt-0.5">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                id="item-form-submit"
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : isEdit ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
