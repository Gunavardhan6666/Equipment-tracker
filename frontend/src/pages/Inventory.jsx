import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { apiGet } from '../api/client.js'
import ItemCard from '../components/items/ItemCard.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'


const CONDITIONS = ['good', 'fair', 'damaged', 'retired']

// ─── Inventory ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const [search,      setSearch]      = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')
  const [condition,   setCondition]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [view,        setView]        = useState('grid') // 'grid' | 'list'

  // Debounce search input — 350 ms delay
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  // Build query string dynamically
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (debouncedQ) p.set('search',      debouncedQ)
    if (condition)  p.set('condition',   condition)
    if (categoryId) p.set('category_id', categoryId)
    return p.toString()
  }, [debouncedQ, condition, categoryId])

  const items      = useApi(() => apiGet(`/items${qs ? `?${qs}` : ''}`), [qs])
  const categories = useApi(() => apiGet('/categories'))

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">
          {items.data?.count != null
            ? `${items.data.count} item${items.data.count !== 1 ? 's' : ''} found`
            : 'All active equipment items'}
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          id="inventory-search"
          type="text"
          placeholder="Search by name or serial…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-48"
        />

        {/* Condition filter */}
        <select
          id="inventory-filter-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          id="inventory-filter-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Categories</option>
          {(categories.data?.data ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden border border-surface-border shrink-0">
          <button
            id="inventory-view-grid"
            onClick={() => setView('grid')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${view === 'grid' ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white hover:bg-surface-hover'}`}
          >
            ⊞ Grid
          </button>
          <button
            id="inventory-view-list"
            onClick={() => setView('list')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${view === 'list' ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white hover:bg-surface-hover'}`}
          >
            ≡ List
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {items.loading ? (
        <LoadingSpinner className="py-20" />
      ) : items.error ? (
        <EmptyState
          icon="⚠️"
          title="Could not load items"
          message={items.error.message}
        />
      ) : !items.data?.data?.length ? (
        <EmptyState
          icon="📦"
          title="No items found"
          message={debouncedQ || condition || categoryId
            ? 'Try adjusting your filters.'
            : 'Add equipment via the API to see it here.'}
        />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.data.data.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Serial</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Condition</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.data.data.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                  <td className="px-4 py-3 text-white/40 font-mono text-xs hidden md:table-cell">{item.serial_number}</td>
                  <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{item.category_name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      item.condition === 'good'    ? 'badge-success' :
                      item.condition === 'fair'    ? 'badge-warning' :
                      item.condition === 'damaged' ? 'badge-danger'  : 'badge-neutral'
                    }`}>{item.condition}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/inventory/${item.id}`} className="btn-ghost text-xs px-2 py-1">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
