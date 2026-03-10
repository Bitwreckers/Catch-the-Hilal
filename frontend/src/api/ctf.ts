import { apiClient, getBackendBaseUrl } from './client'

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
 * Uses backend URL when set so the request always hits the CTFd API.
 */
export async function getCtfTime(): Promise<{ start: string | null; end: string | null }> {
  const base = getBackendBaseUrl()
  const url = base ? `${base}/api/v1/ctf` : '/api/v1/ctf'
  const res = await apiClient.get<CtfTimeResponse>(url, {
    params: { _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  if (!res.data?.success || !res.data?.data) {
    return { start: null, end: null }
  }
  return res.data.data
}
