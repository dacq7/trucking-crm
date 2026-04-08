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

export async function getPolicies(params) {
  const res = await api.get('/policies', { params })
  return res.data
}

export async function getPolicyById(id) {
  const res = await api.get(`/policies/${id}`)
  return res.data
}

