import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import {
  createDriver,
  createVehicle,
  deleteDriver,
  deleteVehicle,
  getClientById,
  updateDriver,
  updateVehicle,
} from '../../services/clients.service'

const tabs = [
  { key: 'info', label: 'Info general' },
  { key: 'vehicles', label: 'Vehículos' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'cases', label: 'Casos' },
]

const vehicleTypeOptions = ['TRACTOR', 'STRAIGHT_TRUCK', 'TRAILER', 'VAN', 'PICKUP', 'BOX_TRUCK']
const ownershipOptions = ['OWNED', 'LEASED', 'FINANCED']
const licenseClassOptions = ['CLASS_A', 'CLASS_B', 'CLASS_C']
const mvrOptions = ['CLEAN', 'MINOR_VIOLATIONS', 'MAJOR_VIOLATIONS']

function caseBadge(status) {
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

function EmptyState({ text }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{text}</div>
}

export default function ClientDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [active, setActive] = useState('info')
  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [vehicleModal, setVehicleModal] = useState({ open: false, editing: null })
  const [driverModal, setDriverModal] = useState({ open: false, editing: null })

  async function loadClient() {
    const data = await getClientById(id)
    setClient(data)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const data = await getClientById(id)
        if (!cancelled) setClient(data)
      } catch (err) {
        if (!cancelled) toast.error(err?.response?.data?.message || 'No se pudo cargar el cliente.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) return <div className="p-6">Cargando...</div>
  if (!client) return <div className="p-6">Cliente no encontrado.</div>

  return (
    <div>
      <PageHeader
        title={client.legalBusinessName}
        subtitle={`DOT: ${client.dotNumber}`}
        action={
          <button
            type="button"
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Editar Cliente
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

        {active === 'info' ? <ClientInfo client={client} /> : null}

        {active === 'vehicles' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
                onClick={() => setVehicleModal({ open: true, editing: null })}
              >
                Agregar vehículo
              </button>
            </div>
            {client.vehicles?.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Año</th>
                      <th className="px-3 py-2">Make</th>
                      <th className="px-3 py-2">Model</th>
                      <th className="px-3 py-2">VIN</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.vehicles.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{v.type}</td>
                        <td className="px-3 py-2">{v.year}</td>
                        <td className="px-3 py-2">{v.make}</td>
                        <td className="px-3 py-2">{v.model}</td>
                        <td className="px-3 py-2">{v.vin}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                              onClick={() => setVehicleModal({ open: true, editing: v })}
                            >
                              Editar
                            </button>
                            <button
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                              onClick={async () => {
                                if (!window.confirm('¿Eliminar vehículo?')) return
                                await deleteVehicle(id, v.id)
                                toast.success('Vehículo eliminado.')
                                await loadClient()
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
            ) : (
              <EmptyState text="Sin vehículos registrados." />
            )}
          </div>
        ) : null}

        {active === 'drivers' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
                onClick={() => setDriverModal({ open: true, editing: null })}
              >
                Agregar driver
              </button>
            </div>
            {client.drivers?.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Licencia</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">MVR</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.drivers.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{d.fullName}</td>
                        <td className="px-3 py-2">{d.licenseNumber}</td>
                        <td className="px-3 py-2">{d.licenseState}</td>
                        <td className="px-3 py-2">{d.mvrStatus}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                              onClick={() => setDriverModal({ open: true, editing: d })}
                            >
                              Editar
                            </button>
                            <button
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                              onClick={async () => {
                                if (!window.confirm('¿Eliminar driver?')) return
                                await deleteDriver(id, d.id)
                                toast.success('Driver eliminado.')
                                await loadClient()
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
            ) : (
              <EmptyState text="Sin drivers registrados." />
            )}
          </div>
        ) : null}

        {active === 'cases' ? (
          <div className="space-y-3">
            {client.cases?.length ? (
              client.cases.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.caseNumber}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={caseBadge(c.status)}>{c.status}</span>
                    <Link to={`/cases/${c.id}`} className="text-sm text-purple-700 hover:underline">
                      Ver caso
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Sin casos para este cliente." />
            )}
          </div>
        ) : null}
      </div>

      {vehicleModal.open ? (
        <VehicleModal
          initial={vehicleModal.editing}
          onClose={() => setVehicleModal({ open: false, editing: null })}
          onSave={async (payload) => {
            if (vehicleModal.editing) {
              await updateVehicle(id, vehicleModal.editing.id, payload)
            } else {
              await createVehicle(id, payload)
            }
            toast.success('Vehículo guardado.')
            setVehicleModal({ open: false, editing: null })
            await loadClient()
          }}
        />
      ) : null}

      {driverModal.open ? (
        <DriverModal
          initial={driverModal.editing}
          onClose={() => setDriverModal({ open: false, editing: null })}
          onSave={async (payload) => {
            if (driverModal.editing) {
              await updateDriver(id, driverModal.editing.id, payload)
            } else {
              await createDriver(id, payload)
            }
            toast.success('Driver guardado.')
            setDriverModal({ open: false, editing: null })
            await loadClient()
          }}
        />
      ) : null}
    </div>
  )
}

function ClientInfo({ client }) {
  const entries = [
    ['Legal Name', client.legalBusinessName],
    ['DBA', client.dba],
    ['DOT Number', client.dotNumber],
    ['MC Number', client.mcNumber],
    ['EIN', client.ein],
    ['Contacto', client.contactName],
    ['Teléfono', client.phonePrimary],
    ['Email', client.email],
    ['Address', client.physicalAddress],
    ['City / State / Zip', `${client.physicalCity} / ${client.physicalState} / ${client.physicalZip}`],
    ['Operation Type', client.operationType],
    ['Operation Radius', client.operationRadius],
    ['States of Operation', (client.statesOfOperation || []).join(', ')],
  ]

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5">
      {entries.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-sm text-slate-900">{value || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function VehicleModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    type: initial?.type || 'TRACTOR',
    year: initial?.year || '',
    make: initial?.make || '',
    model: initial?.model || '',
    vin: initial?.vin || '',
    statedValue: initial?.statedValue || '',
    gvw: initial?.gvw || '',
    ownership: initial?.ownership || 'OWNED',
  })
  const [saving, setSaving] = useState(false)

  return (
    <ModalShell title={initial ? 'Editar vehículo' : 'Agregar vehículo'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Type"><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{vehicleTypeOptions.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <Input label="Year"><input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Input>
        <Input label="Make"><input className="input" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></Input>
        <Input label="Model"><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Input>
        <Input label="VIN"><input className="input" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></Input>
        <Input label="Stated Value"><input className="input" type="number" value={form.statedValue} onChange={(e) => setForm({ ...form, statedValue: e.target.value ? Number(e.target.value) : null })} /></Input>
        <Input label="GVW"><input className="input" type="number" value={form.gvw} onChange={(e) => setForm({ ...form, gvw: e.target.value ? Number(e.target.value) : null })} /></Input>
        <Input label="Ownership"><select className="input" value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>{ownershipOptions.map((v) => <option key={v}>{v}</option>)}</select></Input>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
        <button
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave(form)
            } finally {
              setSaving(false)
            }
          }}
        >
          Guardar
        </button>
      </div>
    </ModalShell>
  )
}

function DriverModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    dateOfBirth: initial?.dateOfBirth ? String(initial.dateOfBirth).slice(0, 10) : '',
    licenseNumber: initial?.licenseNumber || '',
    licenseState: initial?.licenseState || '',
    licenseClass: initial?.licenseClass || 'CLASS_A',
    cdlExperienceYears: initial?.cdlExperienceYears || '',
    mvrStatus: initial?.mvrStatus || 'CLEAN',
    hasDUI: Boolean(initial?.hasDUI),
  })
  const [saving, setSaving] = useState(false)

  return (
    <ModalShell title={initial ? 'Editar driver' : 'Agregar driver'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Input>
        <Input label="Date of Birth"><input className="input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Input>
        <Input label="License Number"><input className="input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></Input>
        <Input label="License State"><input className="input" value={form.licenseState} onChange={(e) => setForm({ ...form, licenseState: e.target.value })} /></Input>
        <Input label="License Class"><select className="input" value={form.licenseClass} onChange={(e) => setForm({ ...form, licenseClass: e.target.value })}>{licenseClassOptions.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <Input label="CDL Experience Years"><input className="input" type="number" value={form.cdlExperienceYears} onChange={(e) => setForm({ ...form, cdlExperienceYears: e.target.value ? Number(e.target.value) : null })} /></Input>
        <Input label="MVR Status"><select className="input" value={form.mvrStatus} onChange={(e) => setForm({ ...form, mvrStatus: e.target.value })}>{mvrOptions.map((v) => <option key={v}>{v}</option>)}</select></Input>
        <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.hasDUI} onChange={(e) => setForm({ ...form, hasDUI: e.target.checked })} />
          Has DUI
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
        <button
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave(form)
            } finally {
              setSaving(false)
            }
          }}
        >
          Guardar
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onClose}>Cerrar</button>
        </div>
        {children}
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

