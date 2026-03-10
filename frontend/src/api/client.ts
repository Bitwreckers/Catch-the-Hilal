import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL?.toString() || '/'

/** Base URL for the backend (no trailing slash). Use for file/download links so they hit the backend. */
export function getBackendBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.toString() || ''
  return base ? base.replace(/\/$/, '') : ''
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
})

let cachedNonce: string | null = null

export async function getSessionNonce(): Promise<string> {
  if (cachedNonce) return cachedNonce
  const authPath = import.meta.env.VITE_API_BASE_URL ? '/login' : '/ctfd-auth/login'
  const res = await axios.get(authPath, {
    baseURL,
    withCredentials: true,
    responseType: 'text',
  })
  const html: string = res.data
  const scriptMatch = html.match(/['"]csrfNonce['"]\s*:\s*"([^"]+)"/)
  if (scriptMatch) {
    cachedNonce = scriptMatch[1]
    return cachedNonce
  }
  const inputMatch = html.match(/name="nonce"[^>]*?value="([^"]+)"/)
  if (inputMatch) {
    cachedNonce = inputMatch[1]
    return cachedNonce
  }
  throw new Error('Could not retrieve session nonce')
}

export function clearNonceCache() {
  cachedNonce = null
}

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase()
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const url = config.url || ''
    if (url.startsWith('/api')) {
      try {
        const nonce = await getSessionNonce()
        config.headers.set('CSRF-Token', nonce)
      } catch {
        // proceed without nonce
      }
    }
  }
  return config
})
