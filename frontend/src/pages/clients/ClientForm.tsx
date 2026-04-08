import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { createClient, getClientById, updateClient } from '../../services/clients.service'
import { useAuth } from '../../context/AuthContext'

const sections = [
  { key: 'business', label: 'Información del negocio' },
  { key: 'contact', label: 'Contacto' },
  { key: 'addresses', label: 'Direcciones' },
  { key: 'operations', label: 'Operaciones' },
  { key: 'insurance', label: 'Historial de seguros' },
]

const entityTypes = ['LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP']
const operationTypes = ['OTR', 'LOCAL', 'REGIONAL', 'INTERMODAL']
const operationRadiusOptions = ['LOCAL', 'REGIONAL', 'NATIONAL']
const commodityOptions = ['GENERAL_FREIGHT', 'REFRIGERATED', 'CONSTRUCTION', 'HOUSEHOLD_GOODS', 'HAZMAT']

function splitCsv(text) {
  return (text || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizePayload(values, isAdmin) {
  const payload = {
    ...values,
    yearsInBusiness: toNumberOrNull(values.yearsInBusiness),
    annualGrossRevenue: toNumberOrNull(values.annualGrossRevenue),
    ownerOperatorPct: toNumberOrNull(values.ownerOperatorPct),
    currentPremium: toNumberOrNull(values.currentPremium),
    totalLossesPast3Yrs: toNumberOrNull(values.totalLossesPast3Yrs),
    totalLossAmount: toNumberOrNull(values.totalLossAmount),
    statesOfOperation: splitCsv(values.statesOfOperationText),
    commodities: values.commodities || [],
  }

  delete payload.statesOfOperationText
  if (!isAdmin) delete payload.vendorId
  if (payload.mailingAddressSame) {
    payload.mailingAddress = null
    payload.mailingCity = null
    payload.mailingState = null
    payload.mailingZip = null
  }
  if (!payload.crossesBorder) payload.crossesBorderDetail = null
  if (!payload.leasedToCarrier) payload.leasedCarrierName = null
  if (!payload.hasHazmat) payload.hazmatClass = null
  if (!payload.currentlyInsured) {
    payload.currentCarrier = null
    payload.currentPremium = null
  }
  if (!payload.hadNonRenewal) payload.nonRenewalReason = null

  return payload
}

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [active, setActive] = useState('business')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendors, setVendors] = useState([])

  const defaultValues = useMemo(
    () => ({
      legalBusinessName: '',
      dba: '',
      dotNumber: '',
      mcNumber: '',
      ein: '',
      yearsInBusiness: '',
      entityType: '',
      stateOfIncorporation: '',
      website: '',
      contactName: '',
      contactTitle: '',
      phonePrimary: '',
      phoneSecondary: '',
      email: '',
      preferredContact: '',
      physicalAddress: '',
      physicalCity: '',
      physicalState: '',
      physicalZip: '',
      mailingAddressSame: true,
      mailingAddress: '',
      mailingCity: '',
      mailingState: '',
      mailingZip: '',
      garagingAddress: '',
      garagingCity: '',
      garagingState: '',
      garagingZip: '',
      operationType: '',
      operationRadius: '',
      statesOfOperationText: '',
      crossesBorder: false,
      crossesBorderDetail: '',
      annualGrossRevenue: '',
      ownerOperatorPct: '',
      leasedToCarrier: false,
      leasedCarrierName: '',
      commodities: [],
      hasHazmat: false,
      hazmatClass: '',
      currentlyInsured: false,
      currentCarrier: '',
      currentPremium: '',
      reasonForShopping: '',
      priorCarrier: '',
      hadNonRenewal: false,
      nonRenewalReason: '',
      totalLossesPast3Yrs: '',
      totalLossAmount: '',
      vendorId: '',
    }),
    []
  )

  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues })

  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false
    async function loadVendors() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users?role=VENDOR`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!res.ok) throw new Error('No se pudo cargar vendedores')

        const payload = await res.json()
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        if (!cancelled) setVendors(list)
      } catch (_err) {
        if (!cancelled) setVendors([])
      }
    }

    loadVendors()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isEdit) return

    let cancelled = false
    async function load() {
      try {
        const data = await getClientById(id)
        if (cancelled) return

        reset({
          ...defaultValues,
          ...data,
          statesOfOperationText: (data.statesOfOperation || []).join(', '),
          commodities: data.commodities || [],
          vendorId: data.vendorId || '',
        })
      } catch (err) {
        toast.error(err?.response?.data?.message || 'No se pudo cargar el cliente.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [defaultValues, id, isEdit, reset])

  const mailingAddressSame = watch('mailingAddressSame')
  const crossesBorder = watch('crossesBorder')
  const leasedToCarrier = watch('leasedToCarrier')
  const hasHazmat = watch('hasHazmat')
  const currentlyInsured = watch('currentlyInsured')
  const hadNonRenewal = watch('hadNonRenewal')

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const payload = normalizePayload(values, isAdmin)
      const data = isEdit ? await updateClient(id, payload) : await createClient(payload)
      toast.success(isEdit ? 'Cliente actualizado.' : 'Cliente creado.')
      navigate(`/clients/${data.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo guardar el cliente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-6">Cargando...</div>

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
        subtitle="Completa la información principal del asegurado."
      />

      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active === s.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {active === 'business' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Legal Business Name*" error={errors.legalBusinessName?.message}>
                <input {...register('legalBusinessName', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="DBA">
                <input {...register('dba')} className="input" />
              </Field>
              <Field label="DOT Number*" error={errors.dotNumber?.message}>
                <input {...register('dotNumber', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="MC Number">
                <input {...register('mcNumber')} className="input" />
              </Field>
              <Field label="EIN">
                <input {...register('ein')} className="input" />
              </Field>
              <Field label="Years in Business">
                <input type="number" {...register('yearsInBusiness')} className="input" />
              </Field>
              <Field label="Entity Type">
                <select {...register('entityType')} className="input">
                  <option value="">Selecciona</option>
                  {entityTypes.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="State of Incorporation">
                <input {...register('stateOfIncorporation')} className="input" />
              </Field>
              <Field label="Website">
                <input {...register('website')} className="input" />
              </Field>
              {isAdmin ? (
                vendors.length > 0 ? (
                  <Field label="Vendedor (solo admin)">
                    <select {...register('vendorId')} className="input">
                      <option value="">Selecciona vendedor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Vendor ID (solo admin)">
                    <input {...register('vendorId')} className="input" />
                  </Field>
                )
              ) : null}
            </div>
          ) : null}

          {active === 'contact' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name*" error={errors.contactName?.message}>
                <input {...register('contactName', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Contact Title">
                <input {...register('contactTitle')} className="input" />
              </Field>
              <Field label="Phone Primary*" error={errors.phonePrimary?.message}>
                <input {...register('phonePrimary', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Phone Secondary">
                <input {...register('phoneSecondary')} className="input" />
              </Field>
              <Field label="Email*" error={errors.email?.message}>
                <input type="email" {...register('email', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Preferred Contact">
                <input {...register('preferredContact')} className="input" />
              </Field>
            </div>
          ) : null}

          {active === 'addresses' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Physical Address*" error={errors.physicalAddress?.message}>
                <input {...register('physicalAddress', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Physical City*" error={errors.physicalCity?.message}>
                <input {...register('physicalCity', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Physical State*" error={errors.physicalState?.message}>
                <input {...register('physicalState', { required: 'Requerido' })} className="input" />
              </Field>
              <Field label="Physical Zip*" error={errors.physicalZip?.message}>
                <input {...register('physicalZip', { required: 'Requerido' })} className="input" />
              </Field>

              <label className="col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('mailingAddressSame')} />
                Mailing address same as physical
              </label>

              {!mailingAddressSame ? (
                <>
                  <Field label="Mailing Address"><input {...register('mailingAddress')} className="input" /></Field>
                  <Field label="Mailing City"><input {...register('mailingCity')} className="input" /></Field>
                  <Field label="Mailing State"><input {...register('mailingState')} className="input" /></Field>
                  <Field label="Mailing Zip"><input {...register('mailingZip')} className="input" /></Field>
                </>
              ) : null}

              <Field label="Garaging Address"><input {...register('garagingAddress')} className="input" /></Field>
              <Field label="Garaging City"><input {...register('garagingCity')} className="input" /></Field>
              <Field label="Garaging State"><input {...register('garagingState')} className="input" /></Field>
              <Field label="Garaging Zip"><input {...register('garagingZip')} className="input" /></Field>
            </div>
          ) : null}

          {active === 'operations' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Operation Type">
                <select {...register('operationType')} className="input">
                  <option value="">Selecciona</option>
                  {operationTypes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Operation Radius">
                <select {...register('operationRadius')} className="input">
                  <option value="">Selecciona</option>
                  {operationRadiusOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="States of Operation (separados por coma)" className="col-span-2">
                <input {...register('statesOfOperationText')} className="input" />
              </Field>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('crossesBorder')} />
                Crosses Border
              </label>
              {crossesBorder ? (
                <Field label="Crosses Border Detail">
                  <input {...register('crossesBorderDetail')} className="input" />
                </Field>
              ) : <div />}
              <Field label="Annual Gross Revenue">
                <input type="number" step="0.01" {...register('annualGrossRevenue')} className="input" />
              </Field>
              <Field label="Owner Operator %">
                <input type="number" {...register('ownerOperatorPct')} className="input" />
              </Field>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('leasedToCarrier')} />
                Leased to Carrier
              </label>
              {leasedToCarrier ? (
                <Field label="Leased Carrier Name"><input {...register('leasedCarrierName')} className="input" /></Field>
              ) : <div />}
              <Field label="Commodities" className="col-span-2">
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-300 p-3">
                  {commodityOptions.map((c) => (
                    <label key={c} className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" value={c} {...register('commodities')} />
                      {c}
                    </label>
                  ))}
                </div>
              </Field>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('hasHazmat')} />
                Has Hazmat
              </label>
              {hasHazmat ? <Field label="Hazmat Class"><input {...register('hazmatClass')} className="input" /></Field> : <div />}
            </div>
          ) : null}

          {active === 'insurance' ? (
            <div className="grid grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('currentlyInsured')} />
                Currently Insured
              </label>
              <div />
              {currentlyInsured ? (
                <>
                  <Field label="Current Carrier"><input {...register('currentCarrier')} className="input" /></Field>
                  <Field label="Current Premium"><input type="number" step="0.01" {...register('currentPremium')} className="input" /></Field>
                </>
              ) : null}
              <Field label="Reason for Shopping"><input {...register('reasonForShopping')} className="input" /></Field>
              <Field label="Prior Carrier"><input {...register('priorCarrier')} className="input" /></Field>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('hadNonRenewal')} />
                Had Non Renewal
              </label>
              {hadNonRenewal ? <Field label="Non Renewal Reason"><input {...register('nonRenewalReason')} className="input" /></Field> : <div />}
              <Field label="Total Losses Past 3 Yrs"><input type="number" {...register('totalLossesPast3Yrs')} className="input" /></Field>
              <Field label="Total Loss Amount"><input type="number" step="0.01" {...register('totalLossAmount')} className="input" /></Field>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, className, children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

