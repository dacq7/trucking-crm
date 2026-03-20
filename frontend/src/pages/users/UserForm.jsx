import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import PageHeader from '../../components/layout/PageHeader'
import { createUser, getUserById, updateUser } from '../../services/users.service'

function TemporaryPasswordModal({ password, onClose }) {
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
        <h3 className="text-lg font-semibold text-slate-900">Usuario creado</h3>
        <p className="mt-2 text-sm text-slate-600">
          Contraseña temporal. Cópiala y entrégala al usuario de forma segura.
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
            Ir a la lista
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: 'VENDOR',
      isActive: true,
    },
  })

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    async function load() {
      try {
        const u = await getUserById(id)
        if (cancelled) return
        reset({
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        })
      } catch (err) {
        toast.error(err?.response?.data?.message || 'No se pudo cargar el usuario.')
        navigate('/users')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, navigate, reset])

  async function onSubmit(values) {
    setSaving(true)
    try {
      if (isEdit) {
        await updateUser(id, {
          name: values.name,
          email: values.email,
          role: values.role,
          isActive: values.isActive,
        })
        toast.success('Usuario actualizado.')
        navigate('/users')
      } else {
        const res = await createUser({
          name: values.name,
          email: values.email,
          role: values.role,
        })
        if (res.temporaryPassword) {
          setTempPassword(res.temporaryPassword)
        } else {
          toast.success('Usuario creado.')
          navigate('/users')
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle={isEdit ? 'Actualiza datos y estado de la cuenta.' : 'Se generará una contraseña temporal automáticamente.'}
      />

      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre*</label>
              <input
                className="input"
                {...register('name', { required: 'El nombre es requerido.' })}
              />
              {errors.name?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email*</label>
              <input
                type="email"
                className="input"
                {...register('email', {
                  required: 'El email es requerido.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email no válido.',
                  },
                })}
              />
              {errors.email?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rol*</label>
              <select
                className="input"
                {...register('role', { required: 'El rol es requerido.' })}
              >
                <option value="VENDOR">VENDOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {errors.role?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
              ) : null}
            </div>
            {isEdit ? (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('isActive')} />
                Usuario activo
              </label>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {tempPassword ? (
        <TemporaryPasswordModal
          password={tempPassword}
          onClose={() => {
            setTempPassword(null)
            navigate('/users')
          }}
        />
      ) : null}
    </div>
  )
}
