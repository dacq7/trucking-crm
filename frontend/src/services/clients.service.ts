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

export async function getClients(params) {
  const res = await api.get('/clients', { params })
  return res.data
}

export async function getClientById(id) {
  const res = await api.get(`/clients/${id}`)
  return res.data
}

export async function createClient(data) {
  const res = await api.post('/clients', data)
  return res.data
}

export async function updateClient(id, data) {
  const res = await api.put(`/clients/${id}`, data)
  return res.data
}

export async function deleteClient(id) {
  const res = await api.delete(`/clients/${id}`)
  return res.data
}

export async function createVehicle(clientId, data) {
  const res = await api.post(`/clients/${clientId}/vehicles`, data)
  return res.data
}

export async function updateVehicle(clientId, vehicleId, data) {
  const res = await api.put(`/clients/${clientId}/vehicles/${vehicleId}`, data)
  return res.data
}

export async function deleteVehicle(clientId, vehicleId) {
  const res = await api.delete(`/clients/${clientId}/vehicles/${vehicleId}`)
  return res.data
}

export async function createDriver(clientId, data) {
  const res = await api.post(`/clients/${clientId}/drivers`, data)
  return res.data
}

export async function updateDriver(clientId, driverId, data) {
  const res = await api.put(`/clients/${clientId}/drivers/${driverId}`, data)
  return res.data
}

export async function deleteDriver(clientId, driverId) {
  const res = await api.delete(`/clients/${clientId}/drivers/${driverId}`)
  return res.data
}

