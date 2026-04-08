import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { changePassword } from '../../services/auth.service'

export default function ChangePasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const newPassword = watch('newPassword')

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const res = await changePassword(values.currentPassword, values.newPassword)

      // Actualizamos el usuario persistido para que ProtectedRoute permita el acceso inmediato.
      // (No se emite nuevo JWT en este flujo, por eso ajustamos el estado local.)
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'))
        if (storedUser) {
          storedUser.mustChangePassword = Boolean(res?.mustChangePassword)
          localStorage.setItem('user', JSON.stringify(storedUser))
        }
      } catch (_err) {
        // No bloqueamos la UX si el localStorage está corrupto.
      }

      toast.success('Contraseña actualizada correctamente.')
      window.location.href = '/dashboard'
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo cambiar la contraseña.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Trucking CRM
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Cambia tu contraseña para continuar.
          </p>
        </div>

        <form
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña actual
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              {...register('currentPassword', { required: 'La contraseña actual es requerida.' })}
            />
            {errors.currentPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              {...register('newPassword', {
                required: 'La nueva contraseña es requerida.',
                minLength: {
                  value: 8,
                  message: 'La nueva contraseña debe tener mínimo 8 caracteres.',
                },
              })}
            />
            {errors.newPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              {...register('confirmPassword', {
                required: 'La confirmación es requerida.',
                validate: (value) =>
                  value === newPassword || 'La confirmación no coincide con la nueva contraseña.',
              })}
            />
            {errors.confirmPassword?.message ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}

