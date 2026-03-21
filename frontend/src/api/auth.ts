import { apiClient, clearNonceCache } from './client'

interface LoginPayload {
  name: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface UpdateMePayload {
  name?: string
  email?: string
  affiliation?: string
  website?: string
  country?: string
  language?: string
  password?: string
  confirm?: string
}

const AUTH_PREFIX = '/ctfd-auth'
const AUTH_LOGIN = `${AUTH_PREFIX}/login`
const AUTH_REGISTER = `${AUTH_PREFIX}/register`
const AUTH_LOGOUT = `${AUTH_PREFIX}/logout`
const AUTH_RESET_PASSWORD = `${AUTH_PREFIX}/reset_password`

async function fetchNonce(page: typeof AUTH_LOGIN | typeof AUTH_REGISTER): Promise<string> {
  const res = await apiClient.get(page, { responseType: 'text' })
  const html: string = res.data

  const scriptMatch = html.match(/['"]csrfNonce['"]\s*:\s*"([^"]+)"/)
  if (scriptMatch) return scriptMatch[1]
  const inputMatch = html.match(/name="nonce"[^>]*?value="([^"]+)"/)
  if (inputMatch) return inputMatch[1]
  throw new Error('Could not retrieve CSRF nonce')
}

export async function login(payload: LoginPayload) {
  const nonce = await fetchNonce(AUTH_LOGIN)
  const form = new URLSearchParams()
  form.append('name', payload.name.trim())
  form.append('password', payload.password)
  form.append('nonce', nonce)
  form.append('_submit', 'Submit')

  const res = await apiClient.post(AUTH_LOGIN, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
    maxRedirects: 0,
  })

  const data = res.data as { success?: boolean; error?: string } | undefined
  if (data && typeof data === 'object' && data.success === true) return { success: true }
  if (res.status === 401 || res.status === 400) {
    throw new Error(
      (data && typeof data === 'object' && data.error) || 'Your username or password is incorrect',
    )
  }
  const html = typeof res.data === 'string' ? res.data : ''
  if (html.includes('incorrect') || (res.status >= 400 && res.status !== 302)) {
    const errorMatch = html.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/)
    throw new Error(
      errorMatch ? errorMatch[1].replace(/<[^>]+>/g, '').trim() : 'Your username or password is incorrect',
    )
  }
  if (res.status === 302) return { success: true }
  return { success: true }
}

export async function register(payload: RegisterPayload) {
  const nonce = await fetchNonce(AUTH_REGISTER)

  const form = new URLSearchParams()
  form.append('name', payload.name)
  form.append('email', payload.email)
  form.append('password', payload.password)
  form.append('nonce', nonce)
  form.append('_submit', 'Submit')

  const res = await apiClient.post(AUTH_REGISTER, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  })

  clearNonceCache()

  const html: string = typeof res.data === 'string' ? res.data : ''
  if (res.status >= 400) {
    const errorMatch = html.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/)
    throw new Error(
      errorMatch ? errorMatch[1].replace(/<[^>]+>/g, '').trim() : 'Registration failed',
    )
  }

  return { success: true }
}

export async function getMe() {
  const res = await apiClient.get('/api/v1/users/me')
  const data = res.data?.data ?? res.data
  if (data && typeof data === 'object' && typeof data.id === 'number') {
    return data
  }
  throw new Error('Invalid user response')
}

export async function logout() {
  clearNonceCache()
  await apiClient.get(AUTH_LOGOUT, { maxRedirects: 0, validateStatus: () => true })
}

/** Request a password reset email. Backend sends email with reset link. */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const res = await apiClient.get(AUTH_RESET_PASSWORD, { responseType: 'text' })
  const html: string = res.data
  const nonceMatch = html.match(/name="nonce"[^>]*value="([^"]+)"/) ?? html.match(/name="nonce"[^>]*value='([^']+)'/)
  const nonce = nonceMatch ? nonceMatch[1] : ''
  const form = new URLSearchParams()
  form.append('email', email.trim())
  if (nonce) form.append('nonce', nonce)
  form.append('_submit', 'Submit')
  await apiClient.post(AUTH_RESET_PASSWORD, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  })
  return { success: true }
}

export async function updateMe(payload: UpdateMePayload) {
  const res = await apiClient.patch('/api/v1/users/me', payload)
  return res.data.data
}
