import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskDetailQueryOptions, taskKeys } from '@/lib/queries/tasks'
import { updateTask, deleteTask } from '@/api/tasks'
import type { TaskPriority, TaskStatus, UpdateTaskRequest } from '@/types/task'
import { EditTaskDialog } from '@/components/EditTaskDialog'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  Circle,
  CircleCheck,
  Clock,
  Loader2,
  Timer,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  HIGH: {
    label: 'High',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  TO_DO: { label: 'To-do', icon: Circle, className: 'text-muted-foreground' },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Timer,
    className: 'text-blue-500',
  },
  DONE: { label: 'Done', icon: CircleCheck, className: 'text-green-500' },
}

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(taskId)

  const { data: task, isLoading, error } = useQuery(taskDetailQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      navigate({ to: '/tasks' })
    },
  })

  const editMutation = useMutation({
    mutationFn: (data: UpdateTaskRequest) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <h1 className="text-2xl font-bold">Task not found</h1>
        <p className="text-muted-foreground">No task with ID: {taskId}</p>
        <Button variant="outline" asChild>
          <Link to="/tasks">Back to board</Link>
        </Button>
      </div>
    )
  }

  const priority = priorityConfig[task.priority ?? 'MEDIUM']
  const status = statusConfig[task.status ?? 'TO_DO']
  const StatusIcon = status.icon

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tasks">
            <ArrowLeft className="size-4" />
            Back to board
          </Link>
        </Button>
        <div className="flex gap-2">
          <EditTaskDialog
            task={task}
            onSave={(data) =>
              editMutation.mutateAsync(data).then(() => undefined)
            }
          />
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <CardDescription>Task #{task.id}</CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Badge variant="outline" className={priority.className}>
                {priority.label}
              </Badge>
              <Badge variant="secondary" className={status.className}>
                <StatusIcon className="size-3" />
                {status.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {task.description && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium">Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium">
                  {new Date(task.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2">
              <Clock className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-1 text-sm font-medium">
                  {new Date(task.modified_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(task.modified_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
