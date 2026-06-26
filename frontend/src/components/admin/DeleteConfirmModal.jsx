import { createPortal } from 'react-dom'

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
// Reusable two-button confirmation modal for destructive actions.
//
// Props:
//   title    — heading string
//   message  — body description
//   onCancel — dismiss without action
//   onConfirm — proceed with deletion
//   loading  — disables buttons while API call is in progress
// ──────────────────────────────────────────────────────────────────────────────
export default function DeleteConfirmModal({ title, message, onCancel, onConfirm, loading = false }) {
  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,20,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        id="delete-confirm-modal"
        className="w-full max-w-sm glass-card p-6 space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + heading */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗑️</span>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>

        {/* Body */}
        <p className="text-sm text-white/55 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            id="delete-confirm-cancel"
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            id="delete-confirm-proceed"
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1 justify-center bg-accent-rose hover:bg-red-600 shadow-none"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Archive'
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
