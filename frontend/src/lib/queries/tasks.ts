import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { listTasks, getTask, getTasksSummary } from '@/api/tasks'
import type {
  ListTasksParams,
  PaginatedResponse,
  Task,
  TaskStatus,
  TaskPriority,
  SummaryParams,
} from '@/api/types'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: ListTasksParams) => [...taskKeys.lists(), params] as const,
  column: (status: TaskStatus, params?: Omit<ListTasksParams, 'status'>) =>
    [...taskKeys.lists(), 'column', status, params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  summary: (params?: SummaryParams) =>
    [...taskKeys.all, 'summary', params] as const,
}

export function columnTasksQueryOptions(
  status: TaskStatus,
  params?: Omit<ListTasksParams, 'status'>
) {
  return queryOptions({
    queryKey: taskKeys.column(status, params),
    queryFn: () => listTasks({ ...params, status }),
  })
}

export function columnTasksInfiniteQueryOptions(
  status: TaskStatus,
  params?: Omit<ListTasksParams, 'status'>
) {
  return infiniteQueryOptions({
    queryKey: [...taskKeys.column(status, params), 'infinite'] as const,
    queryFn: ({ pageParam }) =>
      listTasks({ ...params, status, page: pageParam, page_size: 10 }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: PaginatedResponse<Task>,
      _allPages,
      lastPageParam
    ) => (lastPage.next ? lastPageParam + 1 : undefined),
  })
}

export function priorityTasksQueryOptions(
  priority: TaskPriority,
  params?: Omit<ListTasksParams, 'priority'>
) {
  return queryOptions({
    queryKey: [...taskKeys.lists(), 'priority', priority, params] as const,
    queryFn: () => listTasks({ ...params, priority }),
  })
}

export function taskDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: taskKeys.detail(id),
    queryFn: () => getTask(id),
  })
}

export function tasksSummaryQueryOptions(params?: SummaryParams) {
  return queryOptions({
    queryKey: taskKeys.summary(params),
    queryFn: () => getTasksSummary(params),
  })
}
