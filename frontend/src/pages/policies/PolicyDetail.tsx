import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { getPolicyById } from '../../services/policies.service'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-red-50 text-red-700',
    PENDING: 'bg-yellow-50 text-yellow-700',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.PENDING}`
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US')
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-44 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value ?? '—'}</span>
    </div>
  )
}

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getPolicyById(id)
        if (!cancelled) setPolicy(data)
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(message || 'Failed to load policy.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className="p-6">Loading...</div>
  if (!policy) return <div className="p-6 text-slate-500">Policy not found.</div>

  const caseData = policy.case as Record<string, unknown> | undefined
  const client = caseData?.client as Record<string, unknown> | undefined
  const boundCoverages = (policy.boundCoverages as Record<string, unknown>[]) || []

  return (
    <div>
      <PageHeader
        title={`Policy ${policy.policyNumber as string}`}
        subtitle={`Carrier: ${policy.carrier as string}`}
        action={
          <button
            type="button"
            onClick={() => navigate(`/cases/${policy.caseId as string}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink size={14} />
            View Case
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Policy info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Policy Details</h2>
          <div>
            <FieldRow label="Policy Number" value={policy.policyNumber as string} />
            <FieldRow label="Carrier" value={policy.carrier as string} />
            <FieldRow label="MGA" value={(policy.mga as string) || '—'} />
            <FieldRow label="Effective Date" value={formatDate(policy.effectiveDate as string)} />
            <FieldRow label="Expiration Date" value={formatDate(policy.expirationDate as string)} />
            <FieldRow label="Total Annual Premium" value={usd.format((policy.totalAnnualPremium as number) || 0)} />
            <FieldRow label="Down Payment" value={policy.downPayment != null ? usd.format(policy.downPayment as number) : '—'} />
            <FieldRow label="Payment Plan" value={policy.paymentPlan as string} />
            <FieldRow label="Finance Company" value={(policy.financeCompany as string) || '—'} />
            <FieldRow label="Filing Status" value={policy.filingStatus as string} />
            <FieldRow
              label="Status"
              value={<span className={statusBadge(policy.status as string)}>{policy.status as string}</span>}
            />
            {policy.coveragesSummary ? (
              <FieldRow label="Coverages Summary" value={policy.coveragesSummary as string} />
            ) : null}
            {policy.remarks ? (
              <FieldRow label="Remarks" value={policy.remarks as string} />
            ) : null}
          </div>
        </div>

        {/* Client info */}
        {client ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Client</h2>
            <div>
              <FieldRow label="Company" value={client.legalBusinessName as string} />
              <FieldRow label="DOT Number" value={client.dotNumber as string} />
              <FieldRow label="Contact" value={client.contactName as string} />
            </div>
          </div>
        ) : null}

        {/* Bound coverages */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Bound Coverages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Limit</th>
                  <th className="px-5 py-3">Deductible</th>
                  <th className="px-5 py-3">Premium</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {boundCoverages.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={5}>No bound coverages.</td>
                  </tr>
                ) : boundCoverages.map((cv) => (
                  <tr key={cv.id as string} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-900">{cv.coverageType as string}</td>
                    <td className="px-5 py-3 text-slate-700">{cv.limit != null ? usd.format(cv.limit as number) : '—'}</td>
                    <td className="px-5 py-3 text-slate-700">{cv.deductible != null ? usd.format(cv.deductible as number) : '—'}</td>
                    <td className="px-5 py-3 text-slate-700">{cv.premium != null ? usd.format(cv.premium as number) : '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{(cv.notes as string) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
