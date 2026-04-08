import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { deleteClient, getClients } from '../../services/clients.service'

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])

  return debounced
}

function statusBadge(isActive) {
  return isActive
    ? 'bg-green-50 text-green-700'
    : 'bg-red-50 text-red-700'
}

export default function ClientsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await getClients({ page, limit: 20, search: debouncedSearch })
        if (!cancelled) setResult(data)
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Failed to load clients.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const canNext = page < (result.totalPages || 1)
  const canPrev = page > 1

  const rows = useMemo(() => result.data || [], [result.data])

  async function onDelete(e, id) {
    e.stopPropagation()
    if (!isAdmin) return

    const ok = window.confirm('Deactivate this client?')
    if (!ok) return

    try {
      await deleteClient(id)
      toast.success('Client deactivated.')
      const data = await getClients({ page, limit: 20, search: debouncedSearch })
      setResult(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate client.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage your trucking client accounts."
        action={
          <button
            type="button"
            onClick={() => navigate('/clients/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus size={16} />
            New Client
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, DOT or contact..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">DOT #</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin ? <th className="px-4 py-3">Vendor</th> : null}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={isAdmin ? 7 : 6}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={isAdmin ? 7 : 6}>
                    No results found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{c.legalBusinessName}</td>
                    <td className="px-4 py-3 text-slate-700">{c.dotNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{c.contactName}</td>
                    <td className="px-4 py-3 text-slate-700">{c.phonePrimary}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(
                          c.isActive
                        )}`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3 text-slate-700">{c.vendor?.name || '—'}</td>
                    ) : null}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/clients/${c.id}/edit`)
                          }}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={(e) => onDelete(e, c.id)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {result.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

