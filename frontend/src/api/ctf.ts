import { getBackendBaseUrl } from './client'

export interface CtfTimeResponse {
  success: boolean
  data: {
    start: string | null
    end: string | null
  }
}

/**
 * Fetches CTF start/end times from admin config (public endpoint).
 * Used for the "Event starts in" countdown on the landing page.
 * Uses native fetch with credentials: 'include' for cross-origin CORS + cookies.
 */
export async function getCtfTime(): Promise<{ start: string | null; end: string | null }> {
  const base = getBackendBaseUrl()
  const url = base ? `${base}/api/v1/ctf?_t=${Date.now()}` : `/api/v1/ctf?_t=${Date.now()}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
    if (!res.ok) return { start: null, end: null }
    const json: CtfTimeResponse = await res.json()
    if (!json?.success || !json?.data) return { start: null, end: null }
    return json.data
  } catch {
    return { start: null, end: null }
  }
}
