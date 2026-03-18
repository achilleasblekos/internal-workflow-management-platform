import { AxiosError } from 'axios'
import { apiClient, clearTokens, setTokens } from './client'
import type {
  AuthTokenRequest,
  AuthTokenResponse,
  CreateUserRequest,
  PatchUserRequest,
  UpdateUserRequest,
  User,
} from './types'

type ApiErrorData = {
  detail?: string
  email?: string | string[]
  password?: string | string[]
  name?: string | string[]
  [key: string]: unknown
}

const BASE = '/api/v1/user'

export async function login(data: AuthTokenRequest) {
  try {
    const res = await apiClient.post<AuthTokenResponse>(`${BASE}/login/`, data)
    setTokens(res.data.access, res.data.refresh)
    return res.data
  } catch (error: unknown) {
    const data = (error as AxiosError<ApiErrorData>)?.response?.data

    let message = 'Login failed'

    if (data?.detail) {
      message = data.detail
    }

    throw new Error(message)
  }
}

export async function logout() {
  const refresh = localStorage.getItem('refresh_token')
  if (refresh) {
    await apiClient.post(`${BASE}/logout/`, { refresh })
  }
  clearTokens()
}

export async function register(data: CreateUserRequest) {
  try {
    const res = await apiClient.post<User>(`${BASE}/register/`, data)
    return res.data
  } catch (error: unknown) {
    const data = (error as AxiosError<ApiErrorData>)?.response?.data

    let message = 'Registration failed'

    if (data?.password) {
      message = Array.isArray(data.password)
        ? data.password.join(', ')
        : data.password
    } else if (data?.email) {
      message = Array.isArray(data.email) ? data.email.join(', ') : data.email
    } else if (data?.name) {
      message = Array.isArray(data.name) ? data.name.join(', ') : data.name
    } else if (data?.detail) {
      message = data.detail
    }

    throw new Error(message)
  }
}

export async function getAccount() {
  const res = await apiClient.get<User>(`${BASE}/account/`)
  return res.data
}

export async function updateAccount(data: UpdateUserRequest) {
  try {
    const res = await apiClient.put<User>(`${BASE}/account/`, data)
    return res.data
  } catch (error: unknown) {
    const data = (error as AxiosError)?.response?.data

    let message = 'Update failed'

    if (typeof data === 'string') {
      message = data
    } else if (data) {
      message = Object.values(data).flat().join(', ')
    }

    throw new Error(message)
  }
}

export async function patchAccount(data: PatchUserRequest) {
  try {
    const res = await apiClient.patch<User>(`${BASE}/account/`, data)
    return res.data
  } catch (error: unknown) {
    const data = (error as AxiosError)?.response?.data

    let message = 'Update failed'

    if (typeof data === 'string') {
      message = data
    } else if (data) {
      message = Object.values(data).flat().join(', ')
    }

    throw new Error(message)
  }
}
