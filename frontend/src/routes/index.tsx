import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Pie,
  PieChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  Label,
} from 'recharts'
import {
  columnTasksQueryOptions,
  priorityTasksQueryOptions,
} from '@/lib/queries/tasks'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { CheckCircle, ListTodo, Loader2, Timer } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

const statusChartConfig = {
  count: { label: 'Tasks' },
  todo: { label: 'To-do', color: 'var(--muted-foreground)' },
  'in-progress': { label: 'In Progress', color: 'hsl(210 100% 50%)' },
  done: { label: 'Done', color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig

const priorityChartConfig = {
  count: { label: 'Tasks' },
  low: { label: 'Low', color: 'var(--muted-foreground)' },
  medium: { label: 'Medium', color: 'hsl(40 100% 50%)' },
  high: { label: 'High', color: 'hsl(0 84% 60%)' },
} satisfies ChartConfig

const completionConfig = {
  completed: { label: 'Completed', color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig

const statIcons = {
  todo: ListTodo,
  'in-progress': Timer,
  done: CheckCircle,
} as const

const statColors = {
  todo: 'text-muted-foreground',
  'in-progress': 'text-blue-500',
  done: 'text-green-500',
} as const

function Index() {
  const todoQuery = useQuery(columnTasksQueryOptions('TO_DO', { page_size: 1 }))
  const inProgressQuery = useQuery(
    columnTasksQueryOptions('IN_PROGRESS', { page_size: 1 })
  )
  const doneQuery = useQuery(columnTasksQueryOptions('DONE', { page_size: 1 }))

  const lowQuery = useQuery(priorityTasksQueryOptions('LOW', { page_size: 1 }))
  const mediumQuery = useQuery(
    priorityTasksQueryOptions('MEDIUM', { page_size: 1 })
  )
  const highQuery = useQuery(
    priorityTasksQueryOptions('HIGH', { page_size: 1 })
  )

  const lowCount = lowQuery.data?.count ?? 0
  const mediumCount = mediumQuery.data?.count ?? 0
  const highCount = highQuery.data?.count ?? 0

  const todoCount = todoQuery.data?.count ?? 0
  const inProgressCount = inProgressQuery.data?.count ?? 0
  const doneCount = doneQuery.data?.count ?? 0
  const total = todoCount + inProgressCount + doneCount
  const isLoading =
    todoQuery.isLoading ||
    inProgressQuery.isLoading ||
    doneQuery.isLoading ||
    lowQuery.isLoading ||
    mediumQuery.isLoading ||
    highQuery.isLoading

  const statusData = useMemo(
    () => [
      { status: 'todo', count: todoCount, fill: 'var(--color-todo)' },
      {
        status: 'in-progress',
        count: inProgressCount,
        fill: 'var(--color-in-progress)',
      },
      { status: 'done', count: doneCount, fill: 'var(--color-done)' },
    ],
    [todoCount, inProgressCount, doneCount]
  )

  const priorityData = useMemo(
    () => [
      { priority: 'low', count: lowCount, fill: 'var(--color-low)' },
      { priority: 'medium', count: mediumCount, fill: 'var(--color-medium)' },
      { priority: 'high', count: highCount, fill: 'var(--color-high)' },
    ],
    [lowCount, mediumCount, highCount]
  )

  const completionPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your tasks</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusData.map((s) => {
          const Icon = statIcons[s.status as keyof typeof statIcons]
          const color = statColors[s.status as keyof typeof statColors]
          const label =
            statusChartConfig[s.status as keyof typeof statusChartConfig]?.label
          return (
            <Card key={s.status}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {label}
                </CardDescription>
                <Icon className={`size-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.count}</div>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((s.count / total) * 100) : 0}% of
                  total
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Distribution by current status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square max-h-62.5"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {total}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Tasks
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                  className="-translate-y-2 flex-wrap gap-2"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Tasks grouped by priority level</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ChartContainer
              config={priorityChartConfig}
              className="max-h-62.5 w-full"
            >
              <BarChart
                accessibilityLayer
                data={priorityData}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <YAxis
                  dataKey="priority"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    priorityChartConfig[
                      value as keyof typeof priorityChartConfig
                    ]?.label ?? value
                  }
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Completion</CardTitle>
            <CardDescription>Overall progress</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center pb-0">
            <ChartContainer
              config={completionConfig}
              className="mx-auto aspect-square w-full max-w-62.5"
            >
              <RadialBarChart
                data={[
                  { completed: completionPct, fill: 'var(--color-completed)' },
                ]}
                startAngle={-270}
                endAngle={90}
                innerRadius={80}
                outerRadius={110}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="completed"
                  background
                  cornerRadius={10}
                  angleAxisId={0}
                />
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {completionPct}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Done
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
