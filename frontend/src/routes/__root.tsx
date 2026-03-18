import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useMatch,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ChevronsUpDown,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react'

import { getAccount, logout } from '@/api/auth'

export interface RouterContext {
  queryClient: QueryClient
  isAuthenticated: () => boolean
}

const PUBLIC_ROUTES = ['/login', '/register']

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  beforeLoad: ({ context, location }) => {
    if (
      !PUBLIC_ROUTES.includes(location.pathname) &&
      !context.isAuthenticated()
    ) {
      throw redirect({ to: '/login' })
    }
  },
})

const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/tasks' as const, label: 'Tasks', icon: KanbanSquare, exact: false },
]

function RootComponent() {
  const isLoginPage = useMatch({ from: '/login', shouldThrow: false })
  const isRegisterPage = useMatch({ from: '/register', shouldThrow: false })

  if (isLoginPage || isRegisterPage) {
    return (
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    )
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />

          <SidebarInset>
            <main className="flex-1">
              <div className="flex items-center gap-2 border-b p-2 md:hidden">
                <SidebarTrigger />
                <span className="font-semibold">Workflow</span>
              </div>

              <Outlet />
            </main>
          </SidebarInset>
        </div>

        <ReactQueryDevtools buttonPosition="top-right" />
        <TanStackRouterDevtools position="bottom-right" />
      </TooltipProvider>
    </SidebarProvider>
  )
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <KanbanSquare className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Workflow</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.to
                  : pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function UserMenu() {
  const router = useRouter()
  const { data: user } = useQuery({
    queryKey: ['user', 'account'],
    queryFn: getAccount,
  })

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user?.name ?? '...'}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? ''}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="top"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user?.name ?? '...'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email ?? ''}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.navigate({ to: '/account' })}>
          <UserRound />
          My Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout().then(() => router.navigate({ to: '/login' }))
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
