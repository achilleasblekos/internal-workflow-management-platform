import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskRequest,
} from '@/types/task'

interface EditTaskFormValues {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

interface EditTaskDialogProps {
  task: Task
  onSave: (data: UpdateTaskRequest) => Promise<void>
}

export function EditTaskDialog({ task, onSave }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditTaskFormValues>({
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      status: task.status ?? 'TO_DO',
      priority: task.priority ?? 'MEDIUM',
    },
  })

  async function onSubmit(data: EditTaskFormValues) {
    try {
      setError(null)

      await onSave({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
      })

      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update task')
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)

    if (!value) {
      setError(null)
      reset({
        title: task.title,
        description: task.description ?? '',
        status: task.status ?? 'TO_DO',
        priority: task.priority ?? 'MEDIUM',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update the details of this task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-600">
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="e.g. Implement user settings"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Describe the task..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                defaultValue={task.status ?? 'TO_DO'}
                onValueChange={(v) => setValue('status', v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_DO">To-do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                defaultValue={task.priority ?? 'MEDIUM'}
                onValueChange={(v) => setValue('priority', v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
