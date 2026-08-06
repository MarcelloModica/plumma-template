// In produzione il frontend e' servito dallo stesso backend (stesso origin),
// quindi il default e' relativo. Sovrascrivibile con VITE_API_BASE_URL.
const DEFAULT_API_BASE_URL = ''

export function getApiBaseUrl(): string {
  // In sviluppo: URL relative così il proxy Vite evita CORS.
  if (import.meta.env.DEV) {
    return ''
  }

  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return DEFAULT_API_BASE_URL
}

export function buildApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`
}
