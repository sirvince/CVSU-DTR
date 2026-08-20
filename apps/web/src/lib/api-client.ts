import axios from 'axios'
import { clearStoredToken, getStoredToken } from '@/auth/token-storage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Only treat this as "session expired" if the failed request was actually
    // authenticated — a 401 from POST /auth/login itself (bad credentials) has
    // no Authorization header and must not trigger a redirect loop to /login.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.headers?.Authorization &&
      window.location.pathname !== '/login'
    ) {
      clearStoredToken()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)
