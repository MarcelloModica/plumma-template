import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { CircleAlert, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthError, AuthService } from '@/lib/AuthService'
import { LanguageSelector } from '@/components/layout/language-selector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (AuthService.isAuthenticated()) {
      throw redirect({ to: AuthService.getLandingPath() })
    }
    AuthService.clearSession()
  },
  component: LoginPage,
})

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.3 44 31 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  )
}

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState(() => AuthService.getRememberedUsername())
  const [password, setPassword] = useState('')

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      AuthService.loginAndPersist(username, password),
    onSuccess: () => {
      void navigate({ to: AuthService.getLandingPath() })
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    AuthService.setRememberedUsername(username.trim())
    loginMutation.mutate({ username: username.trim(), password })
  }

  const errorMessage =
    loginMutation.error instanceof AuthError
      ? loginMutation.error.status === 0
        ? t('login.networkError')
        : loginMutation.error.status === 401 || loginMutation.error.status === 403
          ? t('login.invalidCredentials')
          : loginMutation.error.message
      : loginMutation.isError
        ? t('login.errorGeneric')
        : null

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" strokeWidth={1.75} />
          </span>
        </div>

        <h1 className="mb-1 text-center text-2xl font-semibold">{t('common.appName')}</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t('login.title')}</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">{t('login.username')}</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={loginMutation.isPending} className="w-full">
            {loginMutation.isPending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t('login.or')}
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.assign(AuthService.getOAuthStartUrl('google'))}
            className="w-full gap-2"
          >
            <GoogleIcon className="size-4 shrink-0" />
            <span className="truncate">{t('login.google')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.assign(AuthService.getOAuthStartUrl('azure'))}
            className="w-full gap-2"
          >
            <MicrosoftIcon className="size-4 shrink-0" />
            <span className="truncate">{t('login.microsoft')}</span>
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => void navigate({ to: '/registerMe' })}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('login.register')}
          </button>
        </div>
      </div>
    </div>
  )
}
