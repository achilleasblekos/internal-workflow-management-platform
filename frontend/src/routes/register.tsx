import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { register as registerUser } from '@/api/auth'

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

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>()

  async function onSubmit(data: RegisterFormValues) {
    setError(null)

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      await navigate({ to: '/login' })
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                Enter your details below to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        {...register('name', {
                          required: 'Name is required',
                        })}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...register('email', {
                          required: 'Email is required',
                        })}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === watch('password') ||
                            'Passwords do not match',
                        })}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account…' : 'Create Account'}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="underline underline-offset-4">
                      Login
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground">
            Workflow Management &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}
