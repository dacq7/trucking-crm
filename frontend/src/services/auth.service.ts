import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password })
  return res.data // { token, user }
}

export async function changePassword(currentPassword, newPassword) {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No estás autenticado')
  }

  const res = await api.put(
    '/auth/change-password',
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return res.data // { message, mustChangePassword: false }
}

