import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAdminStats, getVendorStats } from '../../services/dashboard.service'

import {
  AlertTriangle,
  DollarSign,
  FileText,
  LayoutDashboard,
  Users,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function statusBadge(status) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

  switch (status) {
    case 'LEAD':
      return `${base} bg-slate-100 text-slate-700`
    case 'PROSPECT':
      return `${base} bg-blue-50 text-blue-700`
    case 'APPLICATION_COMPLETE':
      return `${base} bg-blue-100 text-blue-800`
    case 'QUOTE_SENT':
      return `${base} bg-yellow-50 text-yellow-700`
    case 'NEGOTIATION':
      return `${base} bg-orange-50 text-orange-700`
    case 'BOUND':
      return `${base} bg-green-50 text-green-700`
    case 'POLICY_ISSUED':
      return `${base} bg-green-100 text-green-800`
    case 'RENEWAL':
      return `${base} bg-purple-50 text-purple-700`
    case 'LOST':
      return `${base} bg-red-50 text-red-700`
    default:
      return `${base} bg-slate-100 text-slate-700`
  }
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ?? 'bg-slate-50 text-slate-700'
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data =
          role === 'ADMIN' ? await getAdminStats() : await getVendorStats()

        if (!cancelled) {
          setStats(data)
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Error al cargar el dashboard')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [role])

  const expiringCount = stats?.policiesExpiringSoon?.length || 0
  const expiringAccent =
    expiringCount > 0 ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'

  const vendorChartData = useMemo(() => {
    const list = stats?.vendorStats || []
    return list.map((v) => ({
      name: v.name,
      premium: v.totalPremium,
    }))
  }, [stats])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-slate-700">
          <LayoutDashboard className="animate-pulse" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Vista general para tu rol.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Clientes"
          value={stats?.totalClients ?? 0}
          accent="bg-slate-50 text-slate-700"
        />
        <StatCard
          icon={FileText}
          label="Pólizas Activas"
          value={stats?.totalPolicies ?? 0}
          accent="bg-purple-50 text-purple-700"
        />
        <StatCard
          icon={DollarSign}
          label="Prima Total"
          value={usd.format(stats?.totalPremium ?? 0)}
          accent="bg-purple-50 text-purple-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Por Vencer (30 días)"
          value={expiringCount}
          accent={expiringAccent}
        />
      </div>

      {role === 'ADMIN' ? (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Vendedores
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Clientes</th>
                    <th className="pb-3">Casos</th>
                    <th className="pb-3">Pólizas</th>
                    <th className="pb-3">Prima Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.vendorStats || []).map((v) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-900">{v.name}</td>
                      <td className="py-3 text-slate-700">{v.totalClients}</td>
                      <td className="py-3 text-slate-700">{v.totalCases}</td>
                      <td className="py-3 text-slate-700">{v.totalPolicies}</td>
                      <td className="py-3 text-slate-900">{usd.format(v.totalPremium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Prima por vendedor
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => usd.format(v)} />
                  <Tooltip
                    formatter={(value) => usd.format(Number(value))}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="premium" fill="#6d28d9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Casos recientes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentCases || []).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{c.clientName}</td>
                    <td className="py-3">
                      <span className={statusBadge(c.status)}>{c.status}</span>
                    </td>
                    <td className="py-3 text-slate-700">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

