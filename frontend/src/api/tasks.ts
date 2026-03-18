import type { AxiosError } from 'axios'
import { apiClient } from './client'
import type {
  BoardParams,
  CreateTaskRequest,
  ListTasksParams,
  PaginatedResponse,
  PatchTaskRequest,
  SummaryParams,
  Task,
  UpdateTaskRequest,
} from './types'

const BASE = '/api/v1/tasks'

export async function listTasks(params?: ListTasksParams) {
  const res = await apiClient.get<PaginatedResponse<Task>>(`${BASE}/`, {
    params,
  })
  return res.data
}

export async function getTask(id: number) {
  const res = await apiClient.get<Task>(`${BASE}/${id}/`)
  return res.data
}

export async function createTask(data: CreateTaskRequest) {
  const res = await apiClient.post<Task>(`${BASE}/`, data)
  return res.data
}

export async function updateTask(id: number, data: UpdateTaskRequest) {
  try {
    const res = await apiClient.put<Task>(`${BASE}/${id}/`, data)
    return res.data
  } catch (error: unknown) {
    const data = (error as AxiosError)?.response?.data as
      | Record<string, unknown>
      | undefined

    let message = 'Failed to update task'

    if (data?.status) {
      message = Array.isArray(data.status)
        ? String(data.status[0])
        : String(data.status)
    } else if (data?.detail) {
      message = String(data.detail)
    }

    throw new Error(message)
  }
}

export async function patchTask(id: number, data: PatchTaskRequest) {
  const res = await apiClient.patch<Task>(`${BASE}/${id}/`, data)
  return res.data
}

export async function deleteTask(id: number) {
  await apiClient.delete(`${BASE}/${id}/`)
}

export async function getBoard(params?: BoardParams) {
  const res = await apiClient.get(`${BASE}/board/`, { params })
  return res.data
}

export async function getTasksSummary(params?: SummaryParams) {
  const res = await apiClient.get(`${BASE}/summary/`, { params })
  return res.data
}
