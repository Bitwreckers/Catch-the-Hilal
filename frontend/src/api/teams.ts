import { apiClient, getSessionNonce } from './client'

/** Returns team data when user has a team, or null when 403 (no team). */
export async function getMyTeam() {
  const res = await apiClient.get('/api/v1/teams/me', {
    validateStatus: (status) => status === 200 || status === 403,
  })
  if (res.status === 403) return null
  return res.data.data ?? null
}

/** Returns list of { id, name } for current team members. Call when user has a team. */
export async function getMyTeamMembers(): Promise<{ id: number; name: string }[]> {
  const res = await apiClient.get<{ success?: boolean; data?: unknown }>(
    '/api/v1/teams/me/members',
    { validateStatus: (s) => s === 200 || s === 403 }
  )
  if (res.status !== 200 || !res.data) return []
  const raw = res.data.data
  if (!Array.isArray(raw)) return []
  return raw.map((m: unknown) => {
    const o = m && typeof m === 'object' && m !== null ? m as Record<string, unknown> : {}
    return {
      id: Number(o.id) || 0,
      name: String(o.name ?? o.username ?? ''),
    }
  })
}

const TEAMS_PREFIX = import.meta.env.VITE_API_BASE_URL ? '' : '/ctfd-auth'
const TEAMS_NEW = `${TEAMS_PREFIX}/teams/new`
const TEAMS_JOIN = `${TEAMS_PREFIX}/teams/join`

function extractHtmlError(html: string): string | null {
  const match = html.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/)
  if (!match) return null
  return match[1].replace(/<[^>]+>/g, '').trim()
}

export async function createTeam(name: string, password: string) {
  const nonce = await getSessionNonce()
  const form = new URLSearchParams()
  form.append('name', name)
  form.append('password', password)
  form.append('nonce', nonce)
  form.append('_submit', 'Submit')

  const res = await apiClient.post(TEAMS_NEW, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  })

  const html: string = typeof res.data === 'string' ? res.data : ''
  if (res.status >= 400 || html.includes('alert-danger')) {
    const msg = extractHtmlError(html) ?? 'Failed to create team'
    throw new Error(msg)
  }

  return { success: true }
}

export async function joinTeam(name: string, password: string) {
  const nonce = await getSessionNonce()
  const form = new URLSearchParams()
  form.append('name', name)
  form.append('password', password)
  form.append('nonce', nonce)
  form.append('_submit', 'Submit')

  const res = await apiClient.post(TEAMS_JOIN, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  })

  const html: string = typeof res.data === 'string' ? res.data : ''
  if (res.status >= 400 || html.includes('alert-danger')) {
    const msg = extractHtmlError(html) ?? 'Failed to join team'
    throw new Error(msg)
  }

  return { success: true }
}

/** PATCH /api/v1/teams/me — captain only. Pass name, website, affiliation, country, and/or { password, confirm }. */
export async function patchTeamMe(payload: {
  name?: string
  website?: string
  affiliation?: string
  country?: string
  password?: string
  confirm?: string
}) {
  const res = await apiClient.patch('/api/v1/teams/me', payload)
  return res.data.data
}

/** POST /api/v1/teams/me/members — captain only. Returns new invite code. */
export async function getInviteCode(): Promise<string> {
  const res = await apiClient.post('/api/v1/teams/me/members', {})
  return (res.data as { data: { code: string } }).data.code
}

// --- Paginated list and single team (for /teams and /teams/:id) ---

export interface TeamMember {
  id: number
  name: string
}

export interface TeamPublic {
  id: number
  name: string
  website?: string | null
  affiliation?: string | null
  country?: string | null
  captain_id?: number
  members?: TeamMember[]
  place?: number | null
  score?: number
}

export interface PaginationMeta {
  page: number
  next: number | null
  prev: number | null
  pages: number
  per_page: number
  total: number
}

export type TeamListField = 'name' | 'website' | 'country' | 'affiliation'

export interface GetTeamsFilters {
  q?: string
  field?: TeamListField
  viewAdmin?: boolean
}

/** GET /api/v1/teams — paginated list. */
export async function getTeams(
  page = 1,
  perPage = 50,
  filters?: GetTeamsFilters
): Promise<{ data: TeamPublic[]; meta: { pagination: PaginationMeta } }> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('per_page', String(Math.min(perPage, 100)))
  if (filters?.q) params.set('q', filters.q)
  if (filters?.field) params.set('field', filters.field)
  if (filters?.viewAdmin) params.set('view', 'admin')
  const res = await apiClient.get<{
    success?: boolean
    data?: TeamPublic[] | unknown
    meta?: { pagination: PaginationMeta }
  }>(`/api/v1/teams?${params.toString()}`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) {
    return {
      data: [],
      meta: { pagination: { page: 1, next: null, prev: null, pages: 1, per_page: perPage, total: 0 } },
    }
  }
  const rawData = res.data?.data
  const data = Array.isArray(rawData) ? rawData : []
  return {
    data,
    meta: res.data?.meta ?? {
      pagination: { page: 1, next: null, prev: null, pages: 1, per_page: perPage, total: 0 },
    },
  }
}

/** GET /api/v1/teams/:id — single team with members. */
export async function getTeamById(id: number): Promise<TeamPublic | null> {
  const res = await apiClient.get<{ success: boolean; data: TeamPublic }>(`/api/v1/teams/${id}`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) return null
  return res.data.data ?? null
}

export interface TeamSolve {
  id: number
  challenge_id?: number
  challenge?: { id: number; name: string; category?: string; value?: number }
  date?: string
  value?: number
}

/** GET /api/v1/teams/:id/solves — team's solves. */
export async function getTeamSolves(id: number): Promise<TeamSolve[]> {
  const res = await apiClient.get<{ success: boolean; data: TeamSolve[] }>(`/api/v1/teams/${id}/solves`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) return []
  return res.data.data ?? []
}


