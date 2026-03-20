import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function getUsers(params) {
  const res = await api.get('/users', { params })
  return res.data
}

export async function getUserById(id) {
  const res = await api.get(`/users/${id}`)
  return res.data
}

export async function createUser(data) {
  const res = await api.post('/users', data)
  return res.data
}

export async function updateUser(id, data) {
  const res = await api.put(`/users/${id}`, data)
  return res.data
}

export async function resetPassword(id) {
  const res = await api.post(`/users/${id}/reset-password`)
  return res.data
}
