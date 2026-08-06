import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthService } from '@/lib/AuthService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/registerMe')({
  component: RegisterMePage,
})

/**
 * Placeholder di registrazione. Gli utenti che accedono via OAuth ma non sono
 * ancora presenti a DB ricevono il ruolo "registerme" e vengono instradati qui.
 * Sostituisci con il tuo flusso di onboarding.
 */
function RegisterMePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const email = AuthService.getClaim('email')

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('register.title')}</CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email ? (
            <p className="text-sm text-muted-foreground">
              {email}
            </p>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              AuthService.logout()
              void navigate({ to: '/login' })
            }}
          >
            {t('register.back')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
