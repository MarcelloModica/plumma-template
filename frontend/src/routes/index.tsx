import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthService } from '@/lib/AuthService'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!AuthService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }

    throw redirect({ to: AuthService.getLandingPath() })
  },
})
