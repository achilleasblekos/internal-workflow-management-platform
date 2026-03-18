import { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDownAZ, ArrowUpAZ, Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskPriority } from '@/types/task'

export type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'createdAt-asc'
  | 'createdAt-desc'
  | 'updatedAt-asc'
  | 'updatedAt-desc'

interface FilterFormValues {
  search: string
  priority: TaskPriority | 'all'
  sort: SortOption
}

export interface TaskFilters {
  search: string
  priority: TaskPriority | 'all'
  sort: SortOption
}

interface TaskFilterBarProps {
  onChange: (filters: TaskFilters) => void
}

export function TaskFilterBar({ onChange }: TaskFilterBarProps) {
  const { register, setValue, watch } = useForm<FilterFormValues>({
    defaultValues: {
      search: '',
      priority: 'all',
      sort: 'createdAt-desc',
    },
  })

  const currentValues = watch()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const debouncedUpdate = useCallback(
    (partial: Partial<FilterFormValues>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const next = { ...currentValues, ...partial }
        onChange(next)
      }, 300)
    },
    [currentValues, onChange]
  )

  function update(partial: Partial<FilterFormValues>) {
    const next = { ...currentValues, ...partial }
    onChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-50">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          {...register('search', {
            onChange: (e) => debouncedUpdate({ search: e.target.value }),
          })}
        />
      </div>

      <Select
        defaultValue="all"
        onValueChange={(v) => {
          const val = v as TaskPriority | 'all'
          setValue('priority', val)
          update({ priority: val })
        }}
      >
        <SelectTrigger className="w-40">
          <SlidersHorizontal className="mr-2 size-4 text-muted-foreground" />
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue="createdAt-desc"
        onValueChange={(v) => {
          const val = v as SortOption
          setValue('sort', val)
          update({ sort: val })
        }}
      >
        <SelectTrigger className="w-50">
          {currentValues.sort?.includes('asc') ? (
            <ArrowUpAZ className="mr-2 size-4 text-muted-foreground" />
          ) : (
            <ArrowDownAZ className="mr-2 size-4 text-muted-foreground" />
          )}
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title-asc">Title (A → Z)</SelectItem>
          <SelectItem value="title-desc">Title (Z → A)</SelectItem>
          <SelectItem value="createdAt-asc">Created (Oldest)</SelectItem>
          <SelectItem value="createdAt-desc">Created (Newest)</SelectItem>
          <SelectItem value="updatedAt-asc">Updated (Oldest)</SelectItem>
          <SelectItem value="updatedAt-desc">Updated (Newest)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
