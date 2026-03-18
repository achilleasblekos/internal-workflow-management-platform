import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
