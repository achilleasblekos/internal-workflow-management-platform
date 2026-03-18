import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { getAccount, patchAccount } from '@/api/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

interface ProfileFormValues {
  name: string
  email: string
}

interface PasswordFormValues {
  password: string
  confirmPassword: string
}

function AccountPage() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'account'],
    queryFn: getAccount,
  })

  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileForm = useForm<ProfileFormValues>({
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      patchAccount({ name: data.name, email: data.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'account'] })
      setProfileSuccess(true)
      setProfileError(null)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const detail = err.response?.data
        setProfileError(
          typeof detail === 'string'
            ? detail
            : Object.values(detail ?? {})
                .flat()
                .join(', ') || 'Failed to update profile'
        )
      } else {
        setProfileError('Something went wrong')
      }
      setProfileSuccess(false)
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormValues) =>
      patchAccount({ password: data.password }),
    onSuccess: () => {
      setPasswordSuccess(true)
      setPasswordError(null)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const detail = err.response?.data
        setPasswordError(
          typeof detail === 'string'
            ? detail
            : Object.values(detail ?? {})
                .flat()
                .join(', ') || 'Failed to update password'
        )
      } else {
        setPasswordError('Something went wrong')
      }
      setPasswordSuccess(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and security settings
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your name and email address
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form
              onSubmit={profileForm.handleSubmit((data) =>
                profileMutation.mutate(data)
              )}
              className="grid gap-4"
            >
              {profileError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                  Profile updated successfully
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...profileForm.register('name', {
                    required: 'Name is required',
                  })}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...profileForm.register('email', {
                    required: 'Email is required',
                  })}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form
              onSubmit={passwordForm.handleSubmit((data) =>
                passwordMutation.mutate(data)
              )}
              className="grid gap-4"
            >
              {passwordError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                  Password updated successfully
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 5,
                      message: 'Password must be at least 5 characters',
                    },
                  })}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) =>
                      val === passwordForm.getValues('password') ||
                      'Passwords do not match',
                  })}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
