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
    const data = response.data
    const code = data && typeof data === 'object' ? Number(data.code) : Number.NaN

    if (Number.isFinite(code) && code !== 200) {
      const message = data.msg || data.message || `请求失败（${code}）`
      const error = new Error(message)
      error.code = code
      error.data = data
      error.response = response
      return Promise.reject(error)
    }

    return data
  },
  (error) => {
    const data = error?.response?.data
    if (data?.msg || data?.message) {
      error.message = data.msg || data.message
    }
    if (data?.code !== undefined) {
      error.code = data.code
    }
    return Promise.reject(error)
  }
)

export default request
