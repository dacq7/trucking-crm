import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const user = await login(values.email, values.password)

      if (user?.mustChangePassword) {
        navigate('/change-password', { replace: true })
        return
      }

      if (user?.role === 'ADMIN') {
        navigate('/dashboard', { replace: true })
        return
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not sign in. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo + title */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-900/40">
            <Truck size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Trucking CRM
            </h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <form
          className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              className="input-dark"
              placeholder="you@company.com"
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address.',
                },
              })}
            />
            {errors.email?.message ? (
              <p className="mt-1.5 text-xs text-red-400">{String(errors.email.message)}</p>
            ) : null}
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              className="input-dark"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required.',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters.',
                },
              })}
            />
            {errors.password?.message ? (
              <p className="mt-1.5 text-xs text-red-400">{String(errors.password.message)}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            Premier Trucking Insurance — Internal Platform
          </p>
        </form>
      </div>
    </main>
  )
}
