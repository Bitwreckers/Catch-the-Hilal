export interface CtfTimeResponse {
  success: boolean
  data: {
    start: string | null
    end: string | null
  }
}

/**
 * Fetches CTF start/end times from admin config.
 * Uses /api/v1/ctf (proxied via nginx on same domain) to avoid CORS.
 */
export async function getCtfTime(): Promise<{ start: string | null; end: string | null }> {
  const url = `/api/v1/ctf?_t=${Date.now()}`
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
