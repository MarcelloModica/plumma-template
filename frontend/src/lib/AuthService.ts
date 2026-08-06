import { authMockConfig, type MockUserRole } from '@/config/auth.mock'
import { buildApiUrl } from '@/lib/api-base'

const AUTH_TOKEN_KEY = 'plumma.authToken'
const SECURITY_INFO_KEY = 'plumma.securityInfo'
const REMEMBERED_USERNAME_KEY = 'plumma.rememberedUsername'

export type AppUserRole = MockUserRole | 'registerme'

export interface UserInfo {
  userId?: string
  userName?: string
  userRoles?: string[]
  landingPage?: string
  userAttributes?: Record<string, unknown>
}

export interface SecurityInfo {
  securityEnabled?: boolean
  authenticated?: boolean
  rememberMeEnabled?: boolean
  userInfo?: UserInfo
  csrfHeaderName?: string
  csrfCookieName?: string
}

export interface BackendTokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface AuthSession {
  token: string
  securityInfo: SecurityInfo
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

async function readAuthError(response: Response, fallback: string): Promise<AuthError> {
  try {
    const body = (await response.json()) as {
      message?: string
      error?: string
      code?: string
    }
    const message = body.message ?? body.error ?? fallback
    return new AuthError(message, response.status)
  } catch {
    return new AuthError(fallback, response.status)
  }
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function securityInfoFromJwt(token: string, username: string): SecurityInfo {
  const payload = parseJwtPayload(token)
  const role =
    typeof payload?.role === 'string' && payload.role.trim()
      ? payload.role.trim().toLowerCase()
      : undefined
  const subject =
    typeof payload?.sub === 'string' && payload.sub.trim()
      ? payload.sub.trim()
      : username

  return {
    securityEnabled: true,
    authenticated: true,
    rememberMeEnabled: true,
    userInfo: {
      userId: subject,
      userName: subject,
      userRoles: role ? [role] : [],
      landingPage: '/dashboard',
      userAttributes: payload ?? undefined,
    },
  }
}

function getStoredSecurityInfo(): SecurityInfo | null {
  const raw = localStorage.getItem(SECURITY_INFO_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SecurityInfo
  } catch {
    return null
  }
}

export class AuthService {
  static getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }

  static getSecurityInfoFromStorage(): SecurityInfo | null {
    return getStoredSecurityInfo()
  }

  static getSession(): AuthSession | null {
    const token = AuthService.getToken()
    const securityInfo = AuthService.getSecurityInfoFromStorage()

    if (!token || !securityInfo) {
      return null
    }

    return { token, securityInfo }
  }

  static isAuthenticated(): boolean {
    const session = AuthService.getSession()
    if (!session?.token) {
      return false
    }

    return session.securityInfo.authenticated !== false
  }

  static saveSession(session: AuthSession): void {
    localStorage.setItem(AUTH_TOKEN_KEY, session.token)
    localStorage.setItem(SECURITY_INFO_KEY, JSON.stringify(session.securityInfo))
  }

  static clearSession(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(SECURITY_INFO_KEY)
  }

  static getRememberedUsername(): string {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ''
  }

  static setRememberedUsername(username: string): void {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username)
  }

  static clearRememberedUsername(): void {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY)
  }

  static hasRole(role: AppUserRole): boolean {
    const roles = AuthService.getSecurityInfoFromStorage()?.userInfo?.userRoles ?? []
    return roles.includes(role)
  }

  static getLandingPath(): '/welcome' | '/registerMe' | '/login' {
    if (AuthService.hasRole('registerme')) {
      return '/registerMe'
    }

    if (
      AuthService.hasRole('admin') ||
      AuthService.hasRole('manager') ||
      AuthService.hasRole('user')
    ) {
      return '/welcome'
    }

    return '/login'
  }

  static getClaim(claim: string): string | null {
    const token = AuthService.getToken()
    if (!token) {
      return null
    }
    const payload = parseJwtPayload(token)
    const value = payload?.[claim]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  static persistTokenSession(token: string): AuthSession {
    const payload = parseJwtPayload(token)
    const username =
      typeof payload?.sub === 'string' && payload.sub.trim()
        ? payload.sub.trim()
        : 'oauth-user'
    const session = {
      token,
      securityInfo: securityInfoFromJwt(token, username),
    }
    AuthService.saveSession(session)
    return session
  }

  static createMockSession(username: string): AuthSession {
    const resolvedUsername = username.trim() || authMockConfig.username
    const role = authMockConfig.role

    return {
      token: `mock-token-${role}`,
      securityInfo: {
        securityEnabled: true,
        authenticated: true,
        rememberMeEnabled: true,
        userInfo: {
          userId: `mock-${role}`,
          userName: resolvedUsername,
          userRoles: [role],
          landingPage: '/dashboard',
        },
      },
    }
  }

  static async login(username: string, password: string): Promise<AuthSession> {
    if (authMockConfig.enabled) {
      return AuthService.createMockSession(username)
    }

    const token = await AuthService.fetchToken(username, password)

    return {
      token,
      securityInfo: securityInfoFromJwt(token, username),
    }
  }

  static async loginAndPersist(
    username: string,
    password: string,
  ): Promise<AuthSession> {
    const session = await AuthService.login(username, password)
    AuthService.saveSession(session)
    return session
  }

  static async fetchToken(
    username: string,
    password: string,
  ): Promise<string> {
    let response: Response

    try {
      response = await fetch(buildApiUrl('/token'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
    } catch {
      throw new AuthError(
        'Impossibile contattare il servizio di autenticazione',
        0,
      )
    }

    if (!response.ok) {
      throw await readAuthError(response, 'Credenziali non valide')
    }

    const data = (await response.json()) as BackendTokenResponse

    if (!data.accessToken) {
      throw new AuthError('Token non presente nella risposta', 500)
    }

    return data.accessToken
  }

  static async refreshSession(): Promise<AuthSession | null> {
    const token = AuthService.getToken()
    if (!token) {
      return null
    }

    if (authMockConfig.enabled) {
      return AuthService.getSession()
    }

    const payload = parseJwtPayload(token)
    if (!payload) {
      AuthService.clearSession()
      return null
    }

    if (
      typeof payload.exp === 'number' &&
      payload.exp * 1000 <= Date.now()
    ) {
      AuthService.clearSession()
      return null
    }

    const username =
      typeof payload.sub === 'string' ? payload.sub : AuthService.getRememberedUsername()
    const session = {
      token,
      securityInfo: securityInfoFromJwt(token, username),
    }
    AuthService.saveSession(session)
    return session
  }

  static logout(): void {
    AuthService.clearSession()
  }

  static getOAuthStartUrl(provider: 'google' | 'azure'): string {
    return buildApiUrl(`/api/public/oauth/${provider}/start`)
  }
}