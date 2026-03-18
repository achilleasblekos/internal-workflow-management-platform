import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { DragDropProvider } from '@dnd-kit/react'
import { KanbanColumn } from '@/components/KanbanColumn'
import { AddTaskDialog } from '@/components/AddTaskDialog'
import { TaskFilterBar, type TaskFilters } from '@/components/TaskFilterBar'
import { COLUMNS } from '@/types/task'
import type { TaskStatus, TaskOrdering, TaskPriority } from '@/types/task'
import { columnTasksInfiniteQueryOptions, taskKeys } from '@/lib/queries/tasks'
import { createTask, patchTask } from '@/api/tasks'
import type { CreateTaskRequest } from '@/api/types'

export const Route = createFileRoute('/tasks/')({
  component: TasksIndexPage,
})

const SORT_TO_ORDERING: Record<string, TaskOrdering> = {
  'title-asc': 'title',
  'title-desc': '-title',
  'createdAt-asc': 'created_at',
  'createdAt-desc': '-created_at',
  'updatedAt-asc': 'modified_at',
  'updatedAt-desc': '-modified_at',
}

function TasksIndexPage() {
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    priority: 'all',
    sort: 'createdAt-desc',
  })

  const apiParams = {
    search: filters.search || undefined,
    ordering: SORT_TO_ORDERING[filters.sort],
    priority:
      filters.priority !== 'all'
        ? (filters.priority as TaskPriority)
        : undefined,
  }

  const todoQuery = useInfiniteQuery(
    columnTasksInfiniteQueryOptions('TO_DO', apiParams)
  )
  const inProgressQuery = useInfiniteQuery(
    columnTasksInfiniteQueryOptions('IN_PROGRESS', apiParams)
  )
  const doneQuery = useInfiniteQuery(
    columnTasksInfiniteQueryOptions('DONE', apiParams)
  )

  const queries: Record<TaskStatus, typeof todoQuery> = {
    TO_DO: todoQuery,
    IN_PROGRESS: inProgressQuery,
    DONE: doneQuery,
  }

  const addMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      patchTask(id, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  })

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground">
      <div className="sticky top-0 z-50 flex shrink-0 flex-col gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 transition-all">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Kanban Board
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your tasks and track their progress.
            </p>
          </div>
          <AddTaskDialog onAdd={(data) => addMutation.mutate(data)} />
        </div>
        <TaskFilterBar onChange={setFilters} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-6 pt-4">
        <DragDropProvider
          onDragEnd={(event) => {
            const { source, target } = event.operation
            if (!source || !target) return
            const taskId = source.id as number
            const newStatus = (target.data?.group ?? target.id) as TaskStatus
            const sourceStatus = source.data?.group as TaskStatus | undefined
            if (sourceStatus && newStatus !== sourceStatus) {
              moveMutation.mutate({ id: taskId, status: newStatus })
            }
          }}
        >
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
            {COLUMNS.map((column) => {
              const q = queries[column.id]
              const tasks = q.data?.pages.flatMap((p) => p.results) ?? []
              const count = q.data?.pages[0]?.count ?? 0
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasks}
                  count={count}
                  isLoading={q.isLoading}
                  hasNextPage={q.hasNextPage}
                  isFetchingNextPage={q.isFetchingNextPage}
                  onLoadMore={() => q.fetchNextPage()}
                />
              )
            })}
          </div>
        </DragDropProvider>
      </div>
    </div>
  )
}
