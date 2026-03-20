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

export async function getCases(params) {
  const res = await api.get('/cases', { params })
  return res.data
}

export async function getCaseById(id) {
  const res = await api.get(`/cases/${id}`)
  return res.data
}

export async function createCase(data) {
  const res = await api.post('/cases', data)
  return res.data
}

export async function updateCase(id, data) {
  const res = await api.put(`/cases/${id}`, data)
  return res.data
}

export async function deleteCase(id) {
  const res = await api.delete(`/cases/${id}`)
  return res.data
}

export async function createCoverageRequest(caseId, data) {
  const res = await api.post(`/cases/${caseId}/coverages`, data)
  return res.data
}

export async function updateCoverageRequest(caseId, coverageId, data) {
  const res = await api.put(`/cases/${caseId}/coverages/${coverageId}`, data)
  return res.data
}

export async function deleteCoverageRequest(caseId, coverageId) {
  const res = await api.delete(`/cases/${caseId}/coverages/${coverageId}`)
  return res.data
}

export async function createPolicy(caseId, data) {
  const res = await api.post(`/cases/${caseId}/policy`, data)
  return res.data
}

export async function updatePolicy(caseId, data) {
  const res = await api.put(`/cases/${caseId}/policy`, data)
  return res.data
}

