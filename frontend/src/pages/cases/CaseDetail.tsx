import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const tabs = [
  { key: 'info', label: 'Info' },
  { key: 'coverages', label: 'Coberturas solicitadas' },
  { key: 'policy', label: 'Póliza' },
]

const coverageTypes = ['PRIMARY_AUTO_LIABILITY', 'MOTOR_TRUCK_CARGO', 'PHYSICAL_DAMAGE_COMPREHENSIVE', 'PHYSICAL_DAMAGE_COLLISION', 'GENERAL_LIABILITY', 'NON_TRUCKING_LIABILITY', 'TRAILER_INTERCHANGE', 'OCCUPATIONAL_ACCIDENT']
const paymentPlans = ['FULL_PAY', 'MONTHLY', 'QUARTERLY']
const filingStatuses = ['FILED', 'PENDING', 'NOT_REQUIRED']
const policyStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']

function statusBadge(status) {
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

export default function CaseDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [active, setActive] = useState('info')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coverageModal, setCoverageModal] = useState({ open: false, editing: null })

  async function load() {
    const caseData = await getCaseById(id)
    setData(caseData)
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const caseData = await getCaseById(id)
        if (!cancelled) setData(caseData)
      } catch (err) {
        if (!cancelled) toast.error(err?.response?.data?.message || 'No se pudo cargar el caso.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="p-6">Cargando...</div>
  if (!data) return <div className="p-6">Caso no encontrado.</div>

  return (
    <div>
      <PageHeader
        title={`Caso ${data.caseNumber}`}
        subtitle={data.client?.legalBusinessName || 'Sin cliente'}
        action={
          <button
            type="button"
            onClick={() => navigate(`/cases/${id}/edit`)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
          >
            Editar caso
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`rounded-lg px-3 py-2 text-sm ${
                active === t.key ? 'bg-purple-600 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {active === 'info' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Status"><span className={statusBadge(data.status)}>{data.status}</span></Info>
              <Info label="Cliente">{data.client?.legalBusinessName}</Info>
              <Info label="Vendedor">{data.vendor?.name}</Info>
              <Info label="Fecha">{new Date(data.createdAt).toLocaleDateString('en-US')}</Info>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Notas</p>
              <p className="mt-1 text-sm text-slate-900">{data.notes || '—'}</p>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Historial de status</p>
              <div className="space-y-2">
                {(data.statusHistory || []).map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className={statusBadge(h.status)}>{h.status}</span>
                    <span className="text-xs text-slate-600">{new Date(h.changedAt).toLocaleString('en-US')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {active === 'coverages' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setCoverageModal({ open: true, editing: null })}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Agregar cobertura
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Límite</th>
                    <th className="px-3 py-2">Deducible</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.coverageRequests || []).length === 0 ? (
                    <tr><td className="px-3 py-4 text-slate-500" colSpan={4}>Sin coberturas.</td></tr>
                  ) : (data.coverageRequests || []).map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-3 py-2">{c.coverageType}</td>
                      <td className="px-3 py-2">{c.limitRequested ?? '—'}</td>
                      <td className="px-3 py-2">{c.deductible ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => setCoverageModal({ open: true, editing: c })}>Editar</button>
                          <button
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                            onClick={async () => {
                              if (!window.confirm('¿Eliminar cobertura?')) return
                              await deleteCoverageRequest(id, c.id)
                              await load()
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {active === 'policy' ? (
          <PolicySection
            data={data}
            onSave={async (payload, mode) => {
              if (mode === 'create') {
                await createPolicy(id, payload)
              } else {
                await updatePolicy(id, payload)
              }
              toast.success('Póliza guardada.')
              await load()
            }}
          />
        ) : null}
      </div>

      {coverageModal.open ? (
        <CoverageModal
          initial={coverageModal.editing}
          onClose={() => setCoverageModal({ open: false, editing: null })}
          onSave={async (payload) => {
            if (coverageModal.editing) {
              await updateCoverageRequest(id, coverageModal.editing.id, payload)
            } else {
              await createCoverageRequest(id, payload)
            }
            toast.success('Cobertura guardada.')
            setCoverageModal({ open: false, editing: null })
            await load()
          }}
          coverageTypes={coverageTypes}
        />
      ) : null}
    </div>
  )
}

function PolicySection({ data, onSave }) {
  const policy = data.policy
  const [form, setForm] = useState({
    policyNumber: policy?.policyNumber || '',
    carrier: policy?.carrier || '',
    mga: policy?.mga || '',
    effectiveDate: policy?.effectiveDate ? String(policy.effectiveDate).slice(0, 10) : '',
    expirationDate: policy?.expirationDate ? String(policy.expirationDate).slice(0, 10) : '',
    totalAnnualPremium: policy?.totalAnnualPremium || '',
    downPayment: policy?.downPayment || '',
    paymentPlan: policy?.paymentPlan || 'FULL_PAY',
    financeCompany: policy?.financeCompany || '',
    filingStatus: policy?.filingStatus || 'NOT_REQUIRED',
    status: policy?.status || 'ACTIVE',
    coveragesSummary: policy?.coveragesSummary || '',
    remarks: policy?.remarks || '',
    boundCoverages: policy?.boundCoverages || [],
  })
  const [boundModalOpen, setBoundModalOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Datos de póliza</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Policy #"><input className="input" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} /></Input>
        <Input label="Carrier"><input className="input" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} /></Input>
        <Input label="MGA"><input className="input" value={form.mga} onChange={(e) => setForm({ ...form, mga: e.target.value })} /></Input>
        <Input label="Effective Date"><input className="input" type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} /></Input>
        <Input label="Expiration Date"><input className="input" type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} /></Input>
        <Input label="Total Annual Premium"><input className="input" type="number" value={form.totalAnnualPremium} onChange={(e) => setForm({ ...form, totalAnnualPremium: Number(e.target.value) })} /></Input>
        <Input label="Down Payment"><input className="input" type="number" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value ? Number(e.target.value) : null })} /></Input>
        <Input label="Payment Plan"><select className="input" value={form.paymentPlan} onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })}>{paymentPlans.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <Input label="Finance Company"><input className="input" value={form.financeCompany} onChange={(e) => setForm({ ...form, financeCompany: e.target.value })} /></Input>
        <Input label="Filing Status"><select className="input" value={form.filingStatus} onChange={(e) => setForm({ ...form, filingStatus: e.target.value })}>{filingStatuses.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <Input label="Status"><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{policyStatuses.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <Input label="Coverage Summary"><textarea className="input min-h-[80px]" value={form.coveragesSummary} onChange={(e) => setForm({ ...form, coveragesSummary: e.target.value })} /></Input>
        <Input label="Remarks"><textarea className="input min-h-[80px]" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Input>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Coberturas bound</h4>
          <button className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setBoundModalOpen(true)}>Agregar / editar</button>
        </div>
        {(form.boundCoverages || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Límite</th>
                  <th className="px-2 py-2">Deducible</th>
                </tr>
              </thead>
              <tbody>
                {(form.boundCoverages || []).map((b, idx) => (
                  <tr key={`${b.coverageType}-${idx}`} className="border-b border-slate-100">
                    <td className="px-2 py-2">{b.coverageType}</td>
                    <td className="px-2 py-2">{b.limit}</td>
                    <td className="px-2 py-2">{b.deductible ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Sin coberturas bound.</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => onSave(form, policy ? 'update' : 'create')}
        >
          {policy ? 'Actualizar póliza' : 'Crear póliza'}
        </button>
      </div>

      {boundModalOpen ? (
        <BoundCoveragesModal
          initial={form.boundCoverages || []}
          onClose={() => setBoundModalOpen(false)}
          onApply={(next) => {
            setForm({ ...form, boundCoverages: next })
            setBoundModalOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function BoundCoveragesModal({ initial, onClose, onApply }) {
  const [rows, setRows] = useState(initial.length ? initial : [{ coverageType: 'PRIMARY_AUTO_LIABILITY', limit: '', deductible: '', premium: '', notes: '' }])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Coberturas bound</h3>
          <button className="text-sm text-slate-500" onClick={onClose}>Cerrar</button>
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2">
              <select className="input" value={row.coverageType} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, coverageType: e.target.value } : r))}>
                {coverageTypes.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="input" placeholder="Limit" type="number" value={row.limit} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, limit: Number(e.target.value) } : r))} />
              <input className="input" placeholder="Deductible" type="number" value={row.deductible} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, deductible: e.target.value ? Number(e.target.value) : null } : r))} />
              <input className="input" placeholder="Premium" type="number" value={row.premium} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, premium: e.target.value ? Number(e.target.value) : null } : r))} />
              <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700" onClick={() => setRows(rows.filter((_, i) => i !== idx))}>Quitar</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => setRows([...rows, { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: '', deductible: '', premium: '', notes: '' }])}>Agregar fila</button>
          <button className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white" onClick={() => onApply(rows.filter((r) => r.coverageType && r.limit))}>Aplicar</button>
        </div>
      </div>
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children || '—'}</div>
    </div>
  )
}

function CoverageModal({ initial, onClose, onSave, coverageTypes }) {
  const [form, setForm] = useState({
    coverageType: initial?.coverageType || coverageTypes[0],
    limitRequested: initial?.limitRequested || '',
    deductible: initial?.deductible || '',
    requiresFMCSAFiling: Boolean(initial?.requiresFMCSAFiling),
    notes: initial?.notes || '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{initial ? 'Editar cobertura' : 'Agregar cobertura'}</h3>
          <button className="text-sm text-slate-500" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Coverage Type</label>
            <select className="input" value={form.coverageType} onChange={(e) => setForm({ ...form, coverageType: e.target.value })}>
              {coverageTypes.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Limit Requested"><input className="input" type="number" value={form.limitRequested} onChange={(e) => setForm({ ...form, limitRequested: e.target.value ? Number(e.target.value) : null })} /></Input>
          <Input label="Deductible"><input className="input" type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: e.target.value ? Number(e.target.value) : null })} /></Input>
          <label className="col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.requiresFMCSAFiling} onChange={(e) => setForm({ ...form, requiresFMCSAFiling: e.target.checked })} />
            Requires FMCSA Filing
          </label>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea className="input min-h-[90px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
          <button className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

