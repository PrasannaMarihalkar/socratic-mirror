import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

export const startSession = async (topic, language = 'english') => {
  const res = await API.post('/session/start', { topic, language })
  return res.data
}

export const getProbe = async (payload) => {
  const res = await API.post('/chat/probe', payload)
  return res.data
}

export default API
