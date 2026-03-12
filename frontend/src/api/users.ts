import { apiClient } from './client'

export interface PaginationMeta {
  page: number
  next: number | null
  prev: number | null
  pages: number
  per_page: number
  total: number
}

export interface UserPublic {
  id: number
  name: string
  website?: string | null
  affiliation?: string | null
  country?: string | null
  place?: number | null
  score?: number
  team_id?: number | null
  team_name?: string | null
}

export interface UserListResponse {
  data: UserPublic[]
  meta: { pagination: PaginationMeta }
}

export interface UserSolve {
  id: number
  challenge_id?: number
  challenge?: { id: number; name: string; category?: string }
  user_id: number
  team_id?: number | null
  date?: string
  value?: number
}

export interface UserSolvesResponse {
  data: UserSolve[]
  meta?: { count: number }
}

export interface GetUsersFilters {
  page?: number
  per_page?: number
  q?: string
  field?: string
  country?: string
  affiliation?: string
  team_id?: number
}

/** GET /api/v1/users — paginated list. */
export async function getUsers(
  page = 1,
  perPage = 50,
  filters?: GetUsersFilters
): Promise<UserListResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('per_page', String(Math.min(perPage, 100)))
  if (filters?.q) params.set('q', filters.q)
  if (filters?.field) params.set('field', filters.field)
  if (filters?.country) params.set('country', filters.country)
  if (filters?.affiliation) params.set('affiliation', filters.affiliation)
  if (filters?.team_id != null) params.set('team_id', String(filters.team_id))

  const res = await apiClient.get<{ success: boolean; data: UserPublic[]; meta: { pagination: PaginationMeta } }>(
    `/api/v1/users?${params.toString()}`
  )
  return {
    data: res.data.data ?? [],
    meta: res.data.meta ?? { pagination: { page: 1, next: null, prev: null, pages: 1, per_page: perPage, total: 0 } },
  }
}

/** GET /api/v1/users/:id — single user (public profile). */
export async function getUserById(id: number): Promise<UserPublic | null> {
  const res = await apiClient.get<{ success: boolean; data: UserPublic }>(`/api/v1/users/${id}`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) return null
  return res.data.data ?? null
}

/** GET /api/v1/users/:id/solves — user's solves. */
export async function getUserSolves(id: number): Promise<UserSolve[]> {
  const res = await apiClient.get<{ success: boolean; data: UserSolve[] }>(`/api/v1/users/${id}/solves`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) return []
  return res.data.data ?? []
}

/** GET /api/v1/users/:id/fails — returns meta.count for wrong submission count. */
export async function getUserFailsCount(id: number): Promise<number> {
  const res = await apiClient.get<{ success: boolean; meta?: { count?: number } }>(`/api/v1/users/${id}/fails`, {
    validateStatus: (s) => s === 200 || s === 404,
  })
  if (res.status === 404) return 0
  return res.data.meta?.count ?? 0
}
