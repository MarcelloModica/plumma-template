/**
 * Configurazione autenticazione mock (solo sviluppo / prototipo).
 * Cambia `role` per simulare un utente admin, manager o user.
 */
export type MockUserRole = 'admin' | 'manager' | 'user'

export const authMockConfig = {
  /** Se true, il login non chiama l'API e autentica sempre. */
  enabled: false,
  /** Ruolo simulato dopo il login. */
  role: 'admin' as MockUserRole,
  /** Username usato nella sessione mock (se il form è vuoto). */
  username: 'mock.user',
} as const
