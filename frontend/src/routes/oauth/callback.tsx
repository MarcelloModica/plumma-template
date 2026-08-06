import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthService } from '@/lib/AuthService'

export const Route = createFileRoute('/oauth/callback')({
  component: OAuthCallbackPage,
})

function OAuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const params = new URLSearchParams(hash)
    const token = params.get('token')

    if (!token) {
      void navigate({ to: '/login', replace: true })
      return
    }

    AuthService.persistTokenSession(token)
    window.history.replaceState(null, '', window.location.pathname)
    void navigate({ to: AuthService.getLandingPath(), replace: true })
  }, [navigate])

  return (
    <div
      className="flex min-h-screen items-center justify-center font-login"
      style={{ backgroundColor: '#E4E9EF' }}
    >
      <p className="text-base text-[#1C1D21]">Accesso in corso...</p>
    </div>
  )
}
