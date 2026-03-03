import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '',
  timeout: 20000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('supplier_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default request
