import axios from 'axios'
import type { TokenRefreshResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _router: { navigate: (opts: any) => void } | null = null

export function setRouter(router: {
  navigate: (opts: { to: string }) => void
}) {
  _router = router
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = axios
          .post<TokenRefreshResponse>(
            `${API_BASE_URL}/api/v1/user/token/refresh/`,
            { refresh: getRefreshToken() }
          )
          .then((res) => {
            const { access, refresh } = res.data
            setTokens(access, refresh)
            return access
          })
          .catch((refreshError) => {
            clearTokens()
            _router?.navigate({ to: '/login' })
            return Promise.reject(refreshError)
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    }

    return Promise.reject(error)
  }
)
