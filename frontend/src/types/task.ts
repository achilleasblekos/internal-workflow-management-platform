export type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  PatchTaskRequest,
  ListTasksParams,
  TaskOrdering,
  PaginatedResponse,
} from '@/api/types'

import type { TaskStatus } from '@/api/types'

export const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TO_DO', title: 'To-do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
]
