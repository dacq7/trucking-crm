import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { getCases } from '../../services/cases.service'

const STATUSES = [
  '',
  'LEAD',
  'PROSPECT',
  'APPLICATION_COMPLETE',
  'QUOTE_SENT',
  'NEGOTIATION',
  'BOUND',
  'POLICY_ISSUED',
  'RENEWAL',
  'LOST',
]

const STATUS_LABEL: Record<string, string> = {
  APPLICATION_COMPLETE: 'App Complete',
  QUOTE_SENT: 'Quote Sent',
  POLICY_ISSUED: 'Policy Issued',
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function badge(status: string) {
  const map: Record<string, string> = {
    LEAD: 'bg-slate-100 text-slate-700',
    PROSPECT: 'bg-blue-50 text-blue-700',
    APPLICATION_COMPLETE: 'bg-blue-100 text-blue-800',
    QUOTE_SENT: 'bg-yellow-50 text-yellow-700',
    NEGOTIATION: 'bg-orange-50 text-orange-700',
    BOUND: 'bg-green-50 text-green-700',
    POLICY_ISSUED: 'bg-green-100 text-green-800',
    RENEWAL: 'bg-purple-50 text-purple-700',
    LOST: 'bg-red-50 text-red-700',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.LEAD}`
}

interface CaseRow {
  id: string
  caseNumber: string
  status: string
  createdAt: string
  client?: { legalBusinessName: string }
  vendor?: { name: string }
  policy?: { policyNumber: string; status: string } | null
}

export default function CasesList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ data: CaseRow[]; total: number; totalPages: number }>({
    data: [],
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const data = await getCases({
          page,
          limit: 20,
          search: debouncedSearch,
          status: status || undefined,
        })
        if (!cancelled) setResult(data)
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined
          toast.error(msg ?? 'Failed to load cases.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, debouncedSearch, status])

  useEffect(() => { setPage(1) }, [debouncedSearch, status])

  const rows = useMemo(() => result.data ?? [], [result.data])
  const colSpan = isAdmin ? 7 : 6

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle="Track opportunities across the insurance pipeline."
        action={
          <button
            type="button"
            onClick={() => navigate('/cases/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus size={16} />
            New Case
          </button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case # or client..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? (STATUS_LABEL[s] ?? s) : 'All stages'}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Case #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Policy</th>
                {isAdmin && <th className="px-4 py-3">Vendor</th>}
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={colSpan}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={colSpan}>
                    No results found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                      {c.caseNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {c.client?.legalBusinessName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={badge(c.status)}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.policy ? (
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          {c.policy.policyNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No policy</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-700">{c.vendor?.name ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/cases/${c.id}`)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {result.totalPages || 1}
            {result.total > 0 && (
              <span className="ml-2 text-slate-400">({result.total} cases)</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= (result.totalPages || 1)}
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
