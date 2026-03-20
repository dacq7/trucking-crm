import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { getPolicies } from '../../services/policies.service'

const policyStatuses = ['', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function statusBadge(status) {
  const map = {
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-red-50 text-red-700',
    PENDING: 'bg-yellow-50 text-yellow-700',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || map.PENDING}`
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function daysToExpiration(date) {
  if (!date) return null
  const ms = new Date(date).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function PoliciesList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await getPolicies({ page, limit: 20, search: debouncedSearch, status: status || undefined })
        if (!cancelled) setResult(data)
      } catch (err) {
        if (!cancelled) toast.error(err?.response?.data?.message || 'No se pudo cargar pólizas.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, status])

  useEffect(() => setPage(1), [debouncedSearch, status])

  const rows = useMemo(() => result.data || [], [result.data])

  return (
    <div>
      <PageHeader title="Pólizas" subtitle="Seguimiento de vigencias y primas." />

      <div className="p-6">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número de póliza o carrier..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {policyStatuses.map((s) => <option key={s || 'all'} value={s}>{s || 'Todos los estados'}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Póliza #</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Prima</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Días</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={7}>Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={7}>Sin resultados.</td></tr>
              ) : rows.map((p) => {
                const days = daysToExpiration(p.expirationDate)
                const expiringSoon = typeof days === 'number' && days < 30
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/cases/${p.caseId}`)}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{p.policyNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{p.carrier}</td>
                    <td className="px-4 py-3 text-slate-700">{p.case?.client?.legalBusinessName || '—'}</td>
                    <td className="px-4 py-3 text-slate-900">{usd.format(p.totalAnnualPremium || 0)}</td>
                    <td className="px-4 py-3 text-slate-700">{p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('en-US') : '—'}</td>
                    <td className="px-4 py-3"><span className={statusBadge(p.status)}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      {days == null ? '—' : (
                        <span className={expiringSoon ? 'inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700' : 'text-slate-700'}>
                          {days}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Página {page} de {result.totalPages || 1}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
            <button type="button" disabled={page >= (result.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}

