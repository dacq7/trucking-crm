import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Check, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import {
  createCoverageRequest,
  createPolicy,
  deleteCoverageRequest,
  getCaseById,
  updateCoverageRequest,
  updatePolicy,
} from '../../services/cases.service'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const tabs = [
  { key: 'info', label: 'Info' },
  { key: 'coverages', label: 'Coverage Requests' },
  { key: 'policy', label: 'Policy' },
]

const coverageTypes = [
  'PRIMARY_AUTO_LIABILITY',
  'MOTOR_TRUCK_CARGO',
  'PHYSICAL_DAMAGE_COMPREHENSIVE',
  'PHYSICAL_DAMAGE_COLLISION',
  'GENERAL_LIABILITY',
  'NON_TRUCKING_LIABILITY',
  'TRAILER_INTERCHANGE',
  'OCCUPATIONAL_ACCIDENT',
]
const paymentPlans = ['FULL_PAY', 'MONTHLY', 'QUARTERLY']
const filingStatuses = ['FILED', 'PENDING', 'NOT_REQUIRED']
const policyStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']

// ---------------------------------------------------------------------------
// Pipeline stepper
// ---------------------------------------------------------------------------

const PIPELINE = [
  { key: 'LEAD', label: 'Lead' },
  { key: 'PROSPECT', label: 'Prospect' },
  { key: 'APPLICATION_COMPLETE', label: 'App Complete' },
  { key: 'QUOTE_SENT', label: 'Quote Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'BOUND', label: 'Bound' },
  { key: 'POLICY_ISSUED', label: 'Policy Issued' },
]

interface HistoryEntry {
  id: string
  status: string
  changedAt: string
  note?: string | null
}

interface StepperProps {
  status: string
  statusHistory: HistoryEntry[]
  lostReason?: string | null
}

function PipelineStepper({ status, statusHistory, lostReason }: StepperProps) {
  const isLost = status === 'LOST'
  const isRenewal = status === 'RENEWAL'

  // statusHistory arrives DESC (newest first from the API)
  // Build timestamp map — iterating DESC means the last write per stage is the oldest entry
  const timestamps: Record<string, string> = {}
  for (const h of statusHistory) {
    if (PIPELINE.some((s) => s.key === h.status)) {
      timestamps[h.status] = h.changedAt
    }
  }

  let activeIdx: number
  let lostAtIdx: number | null = null

  if (isRenewal) {
    activeIdx = PIPELINE.length - 1
  } else if (isLost) {
    // First pipeline entry in DESC array = most recently visited pipeline stage
    const lastPipelineEntry = statusHistory.find((h) =>
      PIPELINE.some((s) => s.key === h.status),
    )
    lostAtIdx =
      lastPipelineEntry != null
        ? PIPELINE.findIndex((s) => s.key === lastPipelineEntry.status)
        : 0
    activeIdx = lostAtIdx
  } else {
    activeIdx = PIPELINE.findIndex((s) => s.key === status)
    if (activeIdx < 0) activeIdx = 0
  }

  return (
    <div>
      {/* LOST banner */}
      {isLost && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <span className="font-semibold">Case marked as lost</span>
            {lostAtIdx !== null && (
              <span>
                {' '}— was at the{' '}
                <span className="font-semibold">{PIPELINE[lostAtIdx].label}</span> stage
              </span>
            )}
            {lostReason && (
              <p className="mt-1 text-xs text-red-700">{lostReason}</p>
            )}
          </div>
        </div>
      )}

      {/* RENEWAL banner */}
      {isRenewal && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-800">
          <RefreshCw size={14} />
          Policy issued — up for renewal
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-start overflow-x-auto pb-1">
        {PIPELINE.map((stage, idx) => {
          const isCompleted = isRenewal
            ? true
            : isLost
              ? idx < (lostAtIdx ?? 0)
              : idx < activeIdx
          const isCurrent = !isLost && !isRenewal && idx === activeIdx
          const isLostHere = isLost && idx === lostAtIdx
          const isPending = !isCompleted && !isCurrent && !isLostHere
          const connectorGreen = isRenewal
            ? true
            : isLost
              ? idx < (lostAtIdx ?? 0)
              : idx < activeIdx
          const ts = timestamps[stage.key]

          return (
            <Fragment key={stage.key}>
              {/* Stage node */}
              <div className="flex flex-none flex-col items-center" style={{ width: '78px' }}>
                {/* Circle */}
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : isCurrent
                        ? 'border-purple-600 bg-purple-600 text-white ring-2 ring-purple-200 ring-offset-1'
                        : isLostHere
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-slate-300 bg-white text-slate-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : isLostHere ? (
                    <X size={13} strokeWidth={3} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <p
                  className={[
                    'mt-1.5 w-[78px] text-center text-[11px] leading-tight',
                    isCompleted ? 'font-medium text-green-700' : '',
                    isCurrent ? 'font-semibold text-purple-700' : '',
                    isLostHere ? 'font-semibold text-red-600' : '',
                    isPending ? 'text-slate-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {stage.label}
                </p>

                {/* LOST badge under label */}
                {isLostHere && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    lost
                  </span>
                )}

                {/* Date reached */}
                {ts && !isLostHere && (
                  <p className="mt-0.5 text-center text-[10px] text-slate-400">
                    {new Date(ts).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Connector */}
              {idx < PIPELINE.length - 1 && (
                <div
                  className={`mt-[14px] h-0.5 flex-1 self-start ${
                    connectorGreen ? 'bg-green-400' : 'bg-slate-200'
                  }`}
                  style={{ minWidth: '6px' }}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge (used in tabs/other places, not in stepper)
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
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

// ---------------------------------------------------------------------------
// CaseDetail
// ---------------------------------------------------------------------------

export default function CaseDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [active, setActive] = useState('info')
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverageModal, setCoverageModal] = useState<{
    open: boolean
    editing: Record<string, unknown> | null
  }>({ open: false, editing: null })

  async function load() {
    const caseData = await getCaseById(id as string)
    setData(caseData)
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const caseData = await getCaseById(id as string)
        if (!cancelled) setData(caseData)
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined
          toast.error(msg ?? 'Failed to load case.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>
  if (!data) return <div className="p-6 text-slate-500">Case not found.</div>

  return (
    <div>
      <PageHeader
        title={`Case ${data.caseNumber as string}`}
        subtitle={(data.client as { legalBusinessName?: string })?.legalBusinessName ?? ''}
        action={
          <button
            type="button"
            onClick={() => navigate(`/cases/${id as string}/edit`)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Edit Case
          </button>
        }
      />

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active === t.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Info tab ── */}
        {active === 'info' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-4">
              <Info label="Status">
                <span className={statusBadge(data.status as string)}>{data.status as string}</span>
              </Info>
              <Info label="Client">
                {(data.client as { legalBusinessName?: string })?.legalBusinessName}
              </Info>
              <Info label="Vendor">
                {(data.vendor as { name?: string })?.name}
              </Info>
              <Info label="Date">
                {new Date(data.createdAt as string).toLocaleDateString('en-US')}
              </Info>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-1 text-sm text-slate-900">{(data.notes as string) || '—'}</p>
            </div>

            {/* Pipeline stepper */}
            <div className="mt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pipeline
              </p>
              <PipelineStepper
                status={data.status as string}
                statusHistory={(data.statusHistory as HistoryEntry[]) ?? []}
                lostReason={data.lostReason as string | null | undefined}
              />
            </div>
          </div>
        )}

        {/* ── Coverage Requests tab ── */}
        {active === 'coverages' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setCoverageModal({ open: true, editing: null })}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                Add Coverage
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Limit</th>
                    <th className="px-3 py-2">Deductible</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {((data.coverageRequests as unknown[]) ?? []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-slate-400" colSpan={4}>
                        No coverage requests yet.
                      </td>
                    </tr>
                  ) : (
                    ((data.coverageRequests as Record<string, unknown>[]) ?? []).map((c) => (
                      <tr key={c.id as string} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{c.coverageType as string}</td>
                        <td className="px-3 py-2 text-slate-700">{(c.limitRequested as number) ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700">{(c.deductible as number) ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                              onClick={() => setCoverageModal({ open: true, editing: c })}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                              onClick={async () => {
                                if (!window.confirm('Delete this coverage?')) return
                                await deleteCoverageRequest(id as string, c.id as string)
                                await load()
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Policy tab ── */}
        {active === 'policy' && (
          <PolicySection
            data={data}
            onSave={async (payload, mode) => {
              if (mode === 'create') {
                await createPolicy(id as string, payload)
              } else {
                await updatePolicy(id as string, payload)
              }
              toast.success('Policy saved.')
              await load()
            }}
          />
        )}
      </div>

      {/* Coverage modal */}
      {coverageModal.open && (
        <CoverageModal
          initial={coverageModal.editing}
          onClose={() => setCoverageModal({ open: false, editing: null })}
          onSave={async (payload) => {
            if (coverageModal.editing) {
              await updateCoverageRequest(
                id as string,
                coverageModal.editing.id as string,
                payload,
              )
            } else {
              await createCoverageRequest(id as string, payload)
            }
            toast.success('Coverage saved.')
            setCoverageModal({ open: false, editing: null })
            await load()
          }}
          coverageTypes={coverageTypes}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PolicySection
// ---------------------------------------------------------------------------

function PolicySection({
  data,
  onSave,
}: {
  data: Record<string, unknown>
  onSave: (payload: Record<string, unknown>, mode: 'create' | 'update') => Promise<void>
}) {
  const policy = data.policy as Record<string, unknown> | null | undefined
  const [form, setForm] = useState({
    policyNumber: (policy?.policyNumber as string) ?? '',
    carrier: (policy?.carrier as string) ?? '',
    mga: (policy?.mga as string) ?? '',
    effectiveDate: policy?.effectiveDate
      ? String(policy.effectiveDate).slice(0, 10)
      : '',
    expirationDate: policy?.expirationDate
      ? String(policy.expirationDate).slice(0, 10)
      : '',
    totalAnnualPremium: (policy?.totalAnnualPremium as number) ?? '',
    downPayment: (policy?.downPayment as number) ?? '',
    paymentPlan: (policy?.paymentPlan as string) ?? 'FULL_PAY',
    financeCompany: (policy?.financeCompany as string) ?? '',
    filingStatus: (policy?.filingStatus as string) ?? 'NOT_REQUIRED',
    status: (policy?.status as string) ?? 'ACTIVE',
    coveragesSummary: (policy?.coveragesSummary as string) ?? '',
    remarks: (policy?.remarks as string) ?? '',
    boundCoverages: (policy?.boundCoverages as unknown[]) ?? [],
  })
  const [boundModalOpen, setBoundModalOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Policy Details</h3>
      <div className="grid grid-cols-2 gap-3">
        <FieldWrap label="Policy #">
          <input className="input" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Carrier">
          <input className="input" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="MGA">
          <input className="input" value={form.mga} onChange={(e) => setForm({ ...form, mga: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Effective Date">
          <input className="input" type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Expiration Date">
          <input className="input" type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Total Annual Premium">
          <input className="input" type="number" value={form.totalAnnualPremium} onChange={(e) => setForm({ ...form, totalAnnualPremium: Number(e.target.value) })} />
        </FieldWrap>
        <FieldWrap label="Down Payment">
          <input className="input" type="number" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value ? Number(e.target.value) : '' })} />
        </FieldWrap>
        <FieldWrap label="Payment Plan">
          <select className="input" value={form.paymentPlan} onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })}>
            {paymentPlans.map((v) => <option key={v}>{v}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Finance Company">
          <input className="input" value={form.financeCompany} onChange={(e) => setForm({ ...form, financeCompany: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Filing Status">
          <select className="input" value={form.filingStatus} onChange={(e) => setForm({ ...form, filingStatus: e.target.value })}>
            {filingStatuses.map((v) => <option key={v}>{v}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Policy Status">
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {policyStatuses.map((v) => <option key={v}>{v}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Coverage Summary">
          <textarea className="input min-h-[80px]" value={form.coveragesSummary} onChange={(e) => setForm({ ...form, coveragesSummary: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Remarks">
          <textarea className="input min-h-[80px]" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
        </FieldWrap>
      </div>

      {/* Bound coverages */}
      <div className="mt-4 rounded-lg border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Bound Coverages</h4>
          <button
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            onClick={() => setBoundModalOpen(true)}
          >
            Edit Coverages
          </button>
        </div>
        {(form.boundCoverages as Record<string, unknown>[]).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Limit</th>
                  <th className="px-2 py-2">Deductible</th>
                  <th className="px-2 py-2">Premium</th>
                </tr>
              </thead>
              <tbody>
                {(form.boundCoverages as Record<string, unknown>[]).map((b, idx) => (
                  <tr key={`${b.coverageType as string}-${idx}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-800">{b.coverageType as string}</td>
                    <td className="px-2 py-2 text-slate-700">{b.limit as number}</td>
                    <td className="px-2 py-2 text-slate-700">{(b.deductible as number) ?? '—'}</td>
                    <td className="px-2 py-2 text-slate-700">{(b.premium as number) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No bound coverages.</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          onClick={() => onSave(form as unknown as Record<string, unknown>, policy ? 'update' : 'create')}
        >
          {policy ? 'Update Policy' : 'Create Policy'}
        </button>
      </div>

      {boundModalOpen && (
        <BoundCoveragesModal
          initial={form.boundCoverages as Record<string, unknown>[]}
          onClose={() => setBoundModalOpen(false)}
          onApply={(next) => {
            setForm({ ...form, boundCoverages: next })
            setBoundModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BoundCoveragesModal
// ---------------------------------------------------------------------------

function BoundCoveragesModal({
  initial,
  onClose,
  onApply,
}: {
  initial: Record<string, unknown>[]
  onClose: () => void
  onApply: (rows: Record<string, unknown>[]) => void
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(
    initial.length
      ? initial
      : [{ coverageType: 'PRIMARY_AUTO_LIABILITY', limit: '', deductible: '', premium: '', notes: '' }],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Bound Coverages</h3>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2">
              <select
                className="input"
                value={row.coverageType as string}
                onChange={(e) =>
                  setRows(rows.map((r, i) => (i === idx ? { ...r, coverageType: e.target.value } : r)))
                }
              >
                {coverageTypes.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input
                className="input"
                placeholder="Limit"
                type="number"
                value={row.limit as string}
                onChange={(e) =>
                  setRows(rows.map((r, i) => (i === idx ? { ...r, limit: Number(e.target.value) } : r)))
                }
              />
              <input
                className="input"
                placeholder="Deductible"
                type="number"
                value={row.deductible as string}
                onChange={(e) =>
                  setRows(
                    rows.map((r, i) =>
                      i === idx ? { ...r, deductible: e.target.value ? Number(e.target.value) : null } : r,
                    ),
                  )
                }
              />
              <input
                className="input"
                placeholder="Premium"
                type="number"
                value={row.premium as string}
                onChange={(e) =>
                  setRows(
                    rows.map((r, i) =>
                      i === idx ? { ...r, premium: e.target.value ? Number(e.target.value) : null } : r,
                    ),
                  )
                }
              />
              <button
                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() =>
              setRows([
                ...rows,
                { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: '', deductible: '', premium: '', notes: '' },
              ])
            }
          >
            Add Row
          </button>
          <button
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            onClick={() => onApply(rows.filter((r) => r.coverageType && r.limit))}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CoverageModal
// ---------------------------------------------------------------------------

function CoverageModal({
  initial,
  onClose,
  onSave,
  coverageTypes: types,
}: {
  initial: Record<string, unknown> | null
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<void>
  coverageTypes: string[]
}) {
  const [form, setForm] = useState({
    coverageType: (initial?.coverageType as string) ?? types[0],
    limitRequested: (initial?.limitRequested as number | string) ?? '',
    deductible: (initial?.deductible as number | string) ?? '',
    requiresFMCSAFiling: Boolean(initial?.requiresFMCSAFiling),
    notes: (initial?.notes as string) ?? '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {initial ? 'Edit Coverage' : 'Add Coverage'}
          </h3>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Coverage Type</label>
            <select
              className="input"
              value={form.coverageType}
              onChange={(e) => setForm({ ...form, coverageType: e.target.value })}
            >
              {types.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <FieldWrap label="Limit Requested">
            <input
              className="input"
              type="number"
              value={form.limitRequested}
              onChange={(e) =>
                setForm({ ...form, limitRequested: e.target.value ? Number(e.target.value) : '' })
              }
            />
          </FieldWrap>
          <FieldWrap label="Deductible">
            <input
              className="input"
              type="number"
              value={form.deductible}
              onChange={(e) =>
                setForm({ ...form, deductible: e.target.value ? Number(e.target.value) : '' })
              }
            />
          </FieldWrap>
          <label className="col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.requiresFMCSAFiling}
              onChange={(e) => setForm({ ...form, requiresFMCSAFiling: e.target.checked })}
            />
            Requires FMCSA Filing
          </label>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="input min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            onClick={() => onSave(form as unknown as Record<string, unknown>)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utility components
// ---------------------------------------------------------------------------

function Info({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children ?? '—'}</div>
    </div>
  )
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}
