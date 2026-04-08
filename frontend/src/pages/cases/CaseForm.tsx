import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { getClients } from '../../services/clients.service'
import {
  createCase,
  createCoverageRequest,
  getCaseById,
  updateCase,
  updateCoverageRequest,
} from '../../services/cases.service'

const caseStatuses = ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED', 'RENEWAL', 'LOST']
const coverageTypes = ['PRIMARY_AUTO_LIABILITY', 'MOTOR_TRUCK_CARGO', 'PHYSICAL_DAMAGE_COMPREHENSIVE', 'PHYSICAL_DAMAGE_COLLISION', 'GENERAL_LIABILITY', 'NON_TRUCKING_LIABILITY', 'TRAILER_INTERCHANGE', 'OCCUPATIONAL_ACCIDENT']

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CaseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const debouncedClientSearch = useDebouncedValue(clientSearch, 400)
  const [coverages, setCoverages] = useState([])
  const [coverageModal, setCoverageModal] = useState({ open: false, editing: null })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      clientId: '',
      status: 'LEAD',
      notes: '',
      lostReason: '',
    },
  })

  const statusValue = watch('status')

  useEffect(() => {
    let cancelled = false
    async function loadClients() {
      try {
        const res = await getClients({ page: 1, limit: 20, search: debouncedClientSearch })
        if (!cancelled) setClients(res.data || [])
      } catch (_err) {
        if (!cancelled) setClients([])
      }
    }
    loadClients()
    return () => {
      cancelled = true
    }
  }, [debouncedClientSearch])

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    async function loadCase() {
      try {
        const data = await getCaseById(id)
        if (cancelled) return
        reset({
          clientId: data.clientId,
          status: data.status,
          notes: data.notes || '',
          lostReason: data.lostReason || '',
        })
        setCoverages(data.coverageRequests || [])
      } catch (err) {
        toast.error(err?.response?.data?.message || 'No se pudo cargar el caso.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCase()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, reset])

  async function onSave(values) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        lostReason: values.status === 'LOST' ? values.lostReason : null,
      }
      const data = isEdit ? await updateCase(id, payload) : await createCase(payload)
      toast.success(isEdit ? 'Caso actualizado.' : 'Caso creado.')
      navigate(`/cases/${data.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo guardar el caso.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar caso' : 'Nuevo caso'} subtitle="Administra status y coberturas solicitadas." />
      <div className="p-6">
        <form onSubmit={handleSubmit(onSave)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Buscar cliente</label>
              <input
                className="input"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar por nombre de cliente..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cliente*</label>
              <select className="input" {...register('clientId', { required: 'Requerido' })}>
                <option value="">Selecciona cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.legalBusinessName} ({c.dotNumber})</option>
                ))}
              </select>
              {errors.clientId?.message ? <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status*</label>
              <select className="input" {...register('status', { required: 'Requerido' })}>
                {caseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
              <textarea className="input min-h-[110px]" {...register('notes')} />
            </div>
            {statusValue === 'LOST' ? (
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Lost Reason</label>
                <textarea className="input min-h-[90px]" {...register('lostReason')} />
              </div>
            ) : null}
          </div>

          {isEdit ? (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Coberturas solicitadas</h3>
                <button
                  type="button"
                  onClick={() => setCoverageModal({ open: true, editing: null })}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Agregar cobertura
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
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
                    {coverages.length === 0 ? (
                      <tr><td className="px-3 py-4 text-slate-500" colSpan={4}>Sin coberturas.</td></tr>
                    ) : coverages.map((cv) => (
                      <tr key={cv.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{cv.coverageType}</td>
                        <td className="px-3 py-2">{cv.limitRequested ?? '—'}</td>
                        <td className="px-3 py-2">{cv.deductible ?? '—'}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => setCoverageModal({ open: true, editing: cv })}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => navigate('/cases')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {coverageModal.open && isEdit ? (
        <CoverageModal
          initial={coverageModal.editing}
          onClose={() => setCoverageModal({ open: false, editing: null })}
          onSave={async (payload) => {
            try {
              if (coverageModal.editing) {
                await updateCoverageRequest(id, coverageModal.editing.id, payload)
              } else {
                await createCoverageRequest(id, payload)
              }
              const refreshed = await getCaseById(id)
              setCoverages(refreshed.coverageRequests || [])
              setCoverageModal({ open: false, editing: null })
              toast.success('Cobertura guardada.')
            } catch (err) {
              toast.error(err?.response?.data?.message || 'No se pudo guardar cobertura.')
            }
          }}
          coverageTypes={coverageTypes}
        />
      ) : null}
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
              {coverageTypes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Limit Requested</label>
            <input className="input" type="number" value={form.limitRequested} onChange={(e) => setForm({ ...form, limitRequested: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deductible</label>
            <input className="input" type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: e.target.value ? Number(e.target.value) : null })} />
          </div>
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

