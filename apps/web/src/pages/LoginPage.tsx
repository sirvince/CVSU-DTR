import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { credentialsSchema, type CredentialsFormValues } from '@/api/auth-schemas'
import { useAuth } from '@/auth/useAuth'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { getErrorMessage } from '@/lib/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginMutation } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsFormValues>({ resolver: zodResolver(credentialsSchema) })

  function onSubmit(values: CredentialsFormValues) {
    loginMutation.mutate(values, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Teacher DTR</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        {loginMutation.isError && <Alert variant="error">{getErrorMessage(loginMutation.error)}</Alert>}

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-sky-600 hover:text-sky-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
