import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { getUsers, resetPassword, updateUser } from '../../services/users.service'

function roleBadge(role) {
  return role === 'ADMIN'
    ? 'bg-purple-50 text-purple-700'
    : 'bg-slate-100 text-slate-700'
}

function activeBadge(active) {
  return active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
}

function TemporaryPasswordModal({ password, title, onClose }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar al portapapeles.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Copia esta contraseña temporal y entrégala al usuario de forma segura. No se volverá a mostrar.
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
          {password}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersList() {
  const navigate = useNavigate()
  const [roleFilter, setRoleFilter] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tempModal, setTempModal] = useState(null)

  const params = useMemo(() => {
    const p = {}
    if (roleFilter === 'ADMIN' || roleFilter === 'VENDOR') p.role = roleFilter
    return p
  }, [roleFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers(params)
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudieron cargar los usuarios.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  async function toggleActive(u) {
    try {
      await updateUser(u.id, { isActive: !u.isActive })
      toast.success(u.isActive ? 'Usuario desactivado.' : 'Usuario activado.')
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo actualizar el usuario.')
    }
  }

  async function onResetPassword(u) {
    if (!window.confirm(`¿Generar nueva contraseña temporal para ${u.name}?`)) return
    try {
      const res = await resetPassword(u.id)
      if (res.temporaryPassword) {
        setTempModal({ password: res.temporaryPassword, title: 'Nueva contraseña temporal' })
      }
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo restablecer la contraseña.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Solo administradores pueden gestionar cuentas."
        action={
          <button
            type="button"
            onClick={() => navigate('/users/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus size={16} />
            Nuevo Usuario
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Rol:</label>
          <select
            className="input max-w-xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ADMIN">Admin</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Debe cambiar contraseña</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    Sin usuarios.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(
                          u.role
                        )}`}
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Vendor'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${activeBadge(
                          u.isActive
                        )}`}
                      >
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {u.mustChangePassword ? 'Sí' : 'No'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${u.id}/edit`)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          {u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(u)}
                          className="rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs text-purple-800 hover:bg-purple-100"
                        >
                          Reset Password
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

      {tempModal ? (
        <TemporaryPasswordModal
          password={tempModal.password}
          title={tempModal.title}
          onClose={() => setTempModal(null)}
        />
      ) : null}
    </div>
  )
}
