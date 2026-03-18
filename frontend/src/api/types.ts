export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AuthTokenRequest {
  email: string
  password: string
}

export interface AuthTokenResponse {
  access: string
  refresh: string
}

export interface LogoutRequest {
  refresh: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

export interface User {
  email: string
  name: string
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
}

export interface UpdateUserRequest {
  email: string
  password: string
  name: string
}

export interface PatchUserRequest {
  email?: string
  password?: string
  name?: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status?: TaskStatus
  status_display: string
  priority?: TaskPriority
  priority_display: string
  created_at: string
  modified_at: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
}

export interface UpdateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
}

export interface PatchTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

export type TaskOrdering =
  | 'title'
  | '-title'
  | 'status'
  | '-status'
  | 'priority'
  | '-priority'
  | 'created_at'
  | '-created_at'
  | 'modified_at'
  | '-modified_at'

export interface ListTasksParams extends PaginationParams {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  ordering?: TaskOrdering
}

export interface BoardParams {
  search?: string
  priority?: TaskPriority
  page_todo?: number
  page_in_progress?: number
  page_done?: number
  page_size?: number
}

export interface SummaryParams {
  search?: string
  priority?: TaskPriority
  status?: TaskStatus
}
