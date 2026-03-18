import { useEffect, useRef } from 'react'
import { TaskCard } from '@/components/TaskCard'
import type { Task, TaskStatus } from '@/types/task'
import { useDroppable } from '@dnd-kit/react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  count: number
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

export function KanbanColumn({
  id,
  title,
  tasks,
  count,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id,
    type: 'column',
    accept: ['item'],
    data: { group: id },
    collisionPriority: CollisionPriority.Low,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore?.()
        }
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'flex min-h-0 min-w-64 flex-1 flex-col rounded-xl bg-muted/50 transition-colors',
        isDropTarget && 'bg-muted/80 ring-2 ring-primary/20'
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex min-h-24 flex-col gap-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tasks
            </p>
          ) : (
            <>
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} column={id} />
              ))}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={sentinelRef} className="h-1 shrink-0" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
