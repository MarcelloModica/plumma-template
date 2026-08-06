import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PartyPopper, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthService } from '@/lib/AuthService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/welcome')({
  component: WelcomePage,
})

function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userInfo = AuthService.getSecurityInfoFromStorage()?.userInfo
  const userName = userInfo?.userName ?? ''
  const role = userInfo?.userRoles?.[0] ?? ''

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center p-8">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-7" />
          </span>
          <CardTitle className="text-2xl">
            {t('welcome.title', { name: userName })}
          </CardTitle>
          <CardDescription>{t('welcome.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{t('welcome.running')}</p>
          {role ? (
            <p className="text-sm">
              {t('welcome.role')}: <span className="font-medium">{role}</span>
            </p>
          ) : null}
          <Button onClick={() => void navigate({ to: '/dashboard' })}>
            <Rocket className="size-4" />
            {t('welcome.goToDemo')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
