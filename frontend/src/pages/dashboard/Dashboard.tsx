import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStats } from '../../services/dashboard.service'

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
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Pipeline constants
// ---------------------------------------------------------------------------

const PIPELINE_ORDER = [
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
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  APPLICATION_COMPLETE: 'App Complete',
  QUOTE_SENT: 'Quote Sent',
  NEGOTIATION: 'Negotiation',
  BOUND: 'Bound',
  POLICY_ISSUED: 'Issued',
  RENEWAL: 'Renewal',
  LOST: 'Lost',
}

const STATUS_COLOR: Record<string, string> = {
  LEAD: '#94a3b8',
  PROSPECT: '#60a5fa',
  APPLICATION_COMPLETE: '#3b82f6',
  QUOTE_SENT: '#facc15',
  NEGOTIATION: '#fb923c',
  BOUND: '#4ade80',
  POLICY_ISSUED: '#16a34a',
  RENEWAL: '#a78bfa',
  LOST: '#f87171',
}

const STATUS_BADGE: Record<string, string> = {
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

function statusBadge(status: string) {
  const cls = STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-700'
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: string
  showAlert?: boolean
}

function StatCard({ icon: Icon, label, value, accent, showAlert }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {label}
            {showAlert ? (
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            ) : null}
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            accent ?? 'bg-slate-50 text-slate-700'
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

interface CasesByStatusEntry {
  status: string
  count: number
}

interface PipelineChartProps {
  data: CasesByStatusEntry[]
}

function PipelineChart({ data }: PipelineChartProps) {
  const chartData = useMemo(() => {
    const map = Object.fromEntries(data.map((d) => [d.status, d.count]))
    return PIPELINE_ORDER
      .map((status) => ({
        status,
        label: STATUS_LABEL[status] ?? status,
        count: map[status] ?? 0,
        color: STATUS_COLOR[status] ?? '#94a3b8',
      }))
      .filter((d) => d.count > 0)
  }, [data])

  if (chartData.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 py-8">
        No cases recorded yet.
      </p>
    )
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={0}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            formatter={(value: number) => [value, 'Cases']}
            labelFormatter={(label: string) => label}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface VendorStat {
  id: string
  name: string
  email: string
  totalClients: number
  totalCases: number
  totalPolicies: number
  totalPremium: number
}

interface RecentCase {
  id: string
  clientName: string
  status: string
  createdAt: string
}

interface ExpiringPolicy {
  id: string
  policyNumber: string
  carrier: string
  expirationDate: string
  totalAnnualPremium: number
}

interface DashboardStats {
  totalClients: number
  totalPolicies: number
  totalPremium: number
  policiesExpiringSoon: ExpiringPolicy[]
  casesByStatus: CasesByStatusEntry[]
  vendorStats?: VendorStat[]
  recentCases?: RecentCase[]
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getStats()
        if (!cancelled) setStats(data)
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined
          setError(msg ?? 'Failed to load dashboard.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [role])

  const expiringCount = stats?.policiesExpiringSoon?.length ?? 0
  const expiringAccent =
    expiringCount > 0 ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'

  const vendorChartData = useMemo(
    () =>
      (stats?.vendorStats ?? []).map((v) => ({
        name: v.name.split(' ')[0],
        premium: v.totalPremium,
      })),
    [stats],
  )

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-slate-700">
          <LayoutDashboard className="animate-pulse" />
          <span>Loading dashboard...</span>
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === 'ADMIN' ? 'Agency-wide overview' : 'Your book of business'}
          </p>
        </div>
        <span className="shrink-0 text-sm text-slate-400">
          {new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Clients"
          value={stats?.totalClients ?? 0}
          accent="bg-blue-50 text-blue-700"
        />
        <StatCard
          icon={FileText}
          label="Active Policies"
          value={stats?.totalPolicies ?? 0}
          accent="bg-purple-50 text-purple-700"
        />
        <StatCard
          icon={DollarSign}
          label="Total Premium"
          value={usd.format(stats?.totalPremium ?? 0)}
          accent="bg-green-50 text-green-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring (30 days)"
          value={expiringCount}
          accent={expiringAccent}
          showAlert={expiringCount > 0}
        />
      </div>

      {/* Pipeline chart — full width, both roles */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Cases by Pipeline Stage</h3>
          <span className="text-xs text-slate-400">
            Total:{' '}
            {(stats?.casesByStatus ?? []).reduce((acc, d) => acc + d.count, 0)} cases
          </span>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Distribution of all cases across the insurance pipeline
        </p>
        <PipelineChart data={stats?.casesByStatus ?? []} />

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {PIPELINE_ORDER.map((status) => {
            const count = (stats?.casesByStatus ?? []).find((d) => d.status === status)?.count ?? 0
            if (count === 0) return null
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[status] }}
                />
                <span className="text-xs text-slate-600">
                  {STATUS_LABEL[status]}{' '}
                  <span className="font-semibold text-slate-800">{count}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Role-specific sections */}
      {role === 'ADMIN' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Vendor breakdown table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Vendor Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3 text-right">Clients</th>
                    <th className="pb-3 text-right">Cases</th>
                    <th className="pb-3 text-right">Policies</th>
                    <th className="pb-3 text-right">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.vendorStats ?? []).map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900">{v.name}</td>
                      <td className="py-3 text-right text-slate-700">{v.totalClients}</td>
                      <td className="py-3 text-right text-slate-700">{v.totalCases}</td>
                      <td className="py-3 text-right text-slate-700">{v.totalPolicies}</td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {usd.format(v.totalPremium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Premium by vendor chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Premium by Vendor</h3>
            <p className="mb-4 text-xs text-slate-500">Active policy premium only</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value: number) => [usd.format(value), 'Premium']}
                    labelFormatter={(label: string) => label}
                  />
                  <Bar dataKey="premium" fill="#7c3aed" radius={[8, 8, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expiring soon */}
          {expiringCount > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-orange-800">
                Policies Expiring Within 30 Days ({expiringCount})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                      <th className="pb-2">Policy #</th>
                      <th className="pb-2">Carrier</th>
                      <th className="pb-2">Expires</th>
                      <th className="pb-2 text-right">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.policiesExpiringSoon ?? []).map((p) => (
                      <tr key={p.id} className="border-t border-orange-200">
                        <td className="py-2 font-mono text-xs text-orange-900">{p.policyNumber}</td>
                        <td className="py-2 text-orange-800">{p.carrier}</td>
                        <td className="py-2 text-orange-800">
                          {new Date(p.expirationDate).toLocaleDateString('en-US')}
                        </td>
                        <td className="py-2 text-right font-medium text-orange-900">
                          {usd.format(p.totalAnnualPremium)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Recent cases */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Recent Cases</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Stage</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentCases ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900">{c.clientName}</td>
                      <td className="py-3">
                        <span className={statusBadge(c.status)}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expiring soon (vendor) */}
          {expiringCount > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-orange-800">
                Policies Expiring Soon ({expiringCount})
              </h3>
              <div className="space-y-2">
                {(stats?.policiesExpiringSoon ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-orange-100"
                  >
                    <div>
                      <div className="font-mono text-xs font-medium text-orange-900">
                        {p.policyNumber}
                      </div>
                      <div className="text-xs text-orange-700">{p.carrier}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-orange-800">
                        {usd.format(p.totalAnnualPremium)}
                      </div>
                      <div className="text-xs text-orange-600">
                        {new Date(p.expirationDate).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
