import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { getCases } from '../../services/cases.service'

const statuses = ['', 'LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED', 'RENEWAL', 'LOST']

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function badge(status) {
  const map = {
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
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || map.LEAD}`
}

export default function CasesList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const data = await getCases({ page, limit: 20, search: debouncedSearch, status: status || undefined })
        if (!cancelled) setResult(data)
      } catch (err) {
        if (!cancelled) toast.error(err?.response?.data?.message || 'No se pudo cargar casos.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, status])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const rows = useMemo(() => result.data || [], [result.data])

  return (
    <div>
      <PageHeader
        title="Casos"
        subtitle="Pipeline comercial y estado de cada oportunidad."
        action={
          <button
            type="button"
            onClick={() => navigate('/cases/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus size={16} />
            Nuevo Caso
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por caso # o cliente..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s || 'all'} value={s}>{s || 'Todos los estados'}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Caso #</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin ? <th className="px-4 py-3">Vendedor</th> : null}
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Póliza</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={isAdmin ? 6 : 5}>Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={isAdmin ? 6 : 5}>Sin resultados.</td></tr>
              ) : rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{c.caseNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{c.client?.legalBusinessName}</td>
                  <td className="px-4 py-3"><span className={badge(c.status)}>{c.status}</span></td>
                  {isAdmin ? <td className="px-4 py-3 text-slate-700">{c.vendor?.name || '—'}</td> : null}
                  <td className="px-4 py-3 text-slate-700">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                  <td className="px-4 py-3">
                    {c.policy ? (
                      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {c.policy.policyNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Sin póliza</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Página {page} de {result.totalPages || 1}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= (result.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

