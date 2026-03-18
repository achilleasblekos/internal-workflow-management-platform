import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'
import { Circle, CircleCheck, Clock, Timer } from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string; indicator: string }
> = {
  LOW: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground',
    indicator: 'bg-muted-foreground/40',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    indicator: 'bg-amber-500',
  },
  HIGH: {
    label: 'High',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    indicator: 'bg-red-500',
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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface TaskCardProps {
  task: Task
  index: number
  column: TaskStatus
}

export function TaskCard({ task, index, column }: TaskCardProps) {
  const priority = priorityConfig[task.priority ?? 'MEDIUM']
  const status = statusConfig[task.status ?? 'TO_DO']
  const StatusIcon = status.icon
  const navigate = useNavigate()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    group: 'tasks',
    type: 'item',
    accept: ['item'],
    data: { group: column },
  })

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!pointerStart.current) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y
    pointerStart.current = null

    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      navigate({
        to: '/tasks/$taskId',
        params: { taskId: String(task.id) },
      })
    }
  }

  return (
    <Card
      ref={ref as React.Ref<HTMLDivElement>}
      size="sm"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={cn(
        'relative cursor-grab overflow-hidden transition-all hover:shadow-md hover:ring-foreground/20 active:cursor-grabbing',
        isDragging && 'z-50 opacity-50 shadow-lg'
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1 rounded-l-xl',
          priority.indicator
        )}
      />

      <CardHeader className="pl-5">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <StatusIcon className={cn('size-4 shrink-0', status.className)} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {status.label}
            </TooltipContent>
          </Tooltip>
          <CardTitle className="truncate">{task.title}</CardTitle>
        </div>
        <CardAction>
          <Badge
            variant="outline"
            className={cn('text-[10px]', priority.className)}
          >
            {priority.label}
          </Badge>
        </CardAction>
        {task.description && (
          <CardDescription className="line-clamp-2 pl-6 text-xs">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          <span
            title={`Updated: ${new Date(task.modified_at).toLocaleString()}\nCreated: ${new Date(task.created_at).toLocaleString()}`}
          >
            {formatRelativeDate(task.modified_at)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">#{task.id}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
