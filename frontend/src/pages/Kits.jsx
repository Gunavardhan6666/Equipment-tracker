import { useState, useCallback } from 'react'
import { useApi } from '../hooks/useApi.js'
import { apiGet, apiDelete } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import KitBookingModal from '../components/booking/KitBookingModal.jsx'
import KitFormModal from '../components/admin/KitFormModal.jsx'
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal.jsx'

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

// ─── KitCard ──────────────────────────────────────────────────────────────────
function KitCard({ kit, isAdmin, onBook, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const members = useApi(
    () => (open ? apiGet(`/kits/${kit.id}`) : Promise.resolve(null)),
    [open, kit.id, kit]
  )

  // Computed kit data with items for edit modal
  const kitWithItems = members.data?.data ?? { ...kit, items: [] }

  return (
    <div className="glass-card overflow-hidden hover:border-brand-500/25 transition-all duration-200">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4">
        <button
          id={`kit-card-${kit.id}`}
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left group min-w-0"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{kit.name}</h3>
            <span className="badge badge-brand text-xs">{kit.item_count} items</span>
          </div>
          {kit.description && (
            <p className="text-xs text-white/35 mt-1 line-clamp-1">{kit.description}</p>
          )}
          {kit.contents_summary && (
            <p className="text-[10px] font-mono text-white/30 mt-1.5 line-clamp-1">
              {kit.contents_summary}
            </p>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Book Kit button */}
          <button
            id={`kit-book-${kit.id}`}
            onClick={() => onBook(kit)}
            className="btn-primary py-1.5 px-3 text-xs"
            title={`Book ${kit.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            Book Kit
          </button>

          {/* Admin actions */}
          {isAdmin && (
            <>
              <button
                id={`kit-edit-${kit.id}`}
                onClick={() => onEdit({ ...kitWithItems, id: kit.id })}
                title="Edit kit"
                className="btn-ghost px-2 py-1.5 text-white/40 hover:text-brand-300"
              >
                <PencilIcon />
              </button>
              <button
                id={`kit-delete-${kit.id}`}
                onClick={() => onDelete(kit)}
                title="Archive kit"
                className="btn-ghost px-2 py-1.5 text-white/40 hover:text-accent-rose"
              >
                <TrashIcon />
              </button>
            </>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost px-2 py-1.5 text-white/30"
            title={open ? 'Collapse' : 'Show items'}
          >
            <span className={`text-sm transition-transform duration-200 inline-block ${open ? 'rotate-180' : ''}`}>▾</span>
          </button>
        </div>
      </div>

      {/* Expandable member list */}
      {open && (
        <div className="border-t border-surface-border px-5 pb-4 pt-3">
          {members.loading ? (
            <LoadingSpinner size="sm" className="py-3" />
          ) : members.data?.data?.items?.length ? (
            <div className="space-y-2">
              {members.data.data.items.map((item) => (
                <div key={item.kit_item_id} className="flex items-center gap-3 py-1.5 border-b border-surface-border/30 last:border-0">
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                    {item.quantity}x
                  </span>
                  <p className="text-xs font-medium text-white/70">{item.equipment_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 py-2">No active items in this kit.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Kits Page ────────────────────────────────────────────────────────────────
export default function Kits() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const kits = useApi(() => apiGet('/kits'))

  const [bookingKit,    setBookingKit]    = useState(null)
  const [addOpen,       setAddOpen]       = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)  // kit object with .items[] | null
  const [deleteTarget,  setDeleteTarget]  = useState(null)  // kit object | null
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState(null)

  const handleBook     = useCallback((kit) => setBookingKit(kit), [])
  const handleClose    = useCallback(() => setBookingKit(null), [])
  const handleBookSuccess = useCallback(() => setBookingKit(null), [])

  const handleAddSuccess  = useCallback(() => kits.refetch(), [kits])
  const handleEditSuccess = useCallback(() => { setEditTarget(null); kits.refetch() }, [kits])
  const handleEditClick   = useCallback((kit) => setEditTarget(kit), [])
  const handleDeleteClick = useCallback((kit) => { setDeleteError(null); setDeleteTarget(kit) }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await apiDelete(`/kits/${deleteTarget.id}`)
      setDeleteTarget(null)
      kits.refetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to archive kit.')
      setDeleteLoading(false)
    }
  }, [deleteTarget, kits])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Kits</h1>
          <p className="page-subtitle">Pre-configured bundles — click a kit to see its member items</p>
        </div>

        {/* Create kit — admin only */}
        {isAdmin && (
          <button
            id="kits-add-btn"
            onClick={() => setAddOpen(true)}
            className="btn-primary"
          >
            <PlusIcon />
            Create New Kit
          </button>
        )}
      </div>

      {/* ── Kits list ── */}
      {kits.loading ? (
        <LoadingSpinner className="py-20" />
      ) : kits.error ? (
        <EmptyState icon="⚠️" title="Could not load kits" message={kits.error.message} />
      ) : !kits.data?.data?.length ? (
        <EmptyState
          icon="📦"
          title="No kits configured"
          message={isAdmin ? 'Click "Create New Kit" to bundle equipment together.' : 'No equipment kits are configured yet.'}
        />
      ) : (
        <div className="space-y-3">
          {kits.data.data.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              isAdmin={isAdmin}
              onBook={handleBook}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* ── Delete error banner ── */}
      {deleteError && (
        <div className="glass-card p-4 border-accent-rose/30">
          <p className="text-sm text-accent-rose">⚠ {deleteError}</p>
        </div>
      )}

      {/* ── Modals ── */}
      {bookingKit && (
        <KitBookingModal kit={bookingKit} onClose={handleClose} onSuccess={handleBookSuccess} />
      )}

      {addOpen && (
        <KitFormModal
          kit={null}
          onClose={() => setAddOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editTarget && (
        <KitFormModal
          kit={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Archive "${deleteTarget.name}"?`}
          message="This will soft-delete the kit. Existing reservations using this kit are preserved."
          onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}
