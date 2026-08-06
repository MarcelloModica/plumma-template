import { authMockConfig } from '@/config/auth.mock'
import { buildApiUrl } from '@/lib/api-base'
import { AuthService } from '@/lib/AuthService'

export class UnauthorizedError extends Error {
  constructor(message = 'Sessione non valida o scaduta') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export { buildApiUrl } from '@/lib/api-base'

function redirectToLogin(): void {
  AuthService.logout()

  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

function ensureAuthenticated(): string {
  const token = AuthService.getToken()

  if (!token || !AuthService.isAuthenticated()) {
    redirectToLogin()
    throw new UnauthorizedError()
  }

  return token
}

function isJwtExpired(token: string): boolean {
  const parts = token.split('.')
  if (parts.length < 2) {
    return false
  }

  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number }

    if (typeof payload.exp !== 'number') {
      return false
    }

    return payload.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = ensureAuthenticated()

  if (!authMockConfig.enabled && isJwtExpired(token)) {
    redirectToLogin()
    throw new UnauthorizedError()
  }

  const headers = new Headers(init.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  })

  // Con auth mock il token non è un JWT del backend: un 401/403 non implica
  // sessione frontend scaduta, quindi lasciamo gestire l'errore al chiamante.
  if (
    !authMockConfig.enabled &&
    (response.status === 401 || response.status === 403)
  ) {
    redirectToLogin()
    throw new UnauthorizedError()
  }

  return response
}
