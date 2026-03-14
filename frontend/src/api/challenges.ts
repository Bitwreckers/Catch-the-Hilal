import { apiClient } from './client'

export async function getChallenges() {
  const res = await apiClient.get<{ success?: boolean; data?: unknown }>(
    '/api/v1/challenges?view=admin',
    { validateStatus: (s) => s === 200 || s === 404 }
  )
  if (res.status === 404) return []
  const raw = res.data?.data
  return Array.isArray(raw) ? raw : []
}

export interface ChallengeHint {
  id: number
  cost: number
  title: string
  content?: string
}

export interface ChallengeDetailResponse {
  id: number
  name: string
  description?: string
  description_html?: string
  category?: string
  value?: number
  points?: number
  solved_by_me?: boolean
  hints?: ChallengeHint[]
  files?: string[]
  tags?: string[]
  topics?: Array<{ topic_id?: number; value?: string }>
  attribution?: string
  attribution_html?: string
  connection_info?: string
  position?: number
  max_attempts?: number
  attempts?: number
  [key: string]: unknown
}

export async function getChallenge(id: number): Promise<ChallengeDetailResponse> {
  const res = await apiClient.get<{ success: boolean; data: ChallengeDetailResponse }>(`/api/v1/challenges/${id}`)
  return res.data.data
}

/** POST /api/v1/challenges/attempt — body: { challenge_id: number, submission: string }. Returns { success, data: { status, message } }. */
export async function submitFlag(challengeId: number, submission: string) {
  const res = await apiClient.post<{ success: boolean; data: { status: string; message?: string } }>(
    '/api/v1/challenges/attempt',
    { challenge_id: challengeId, submission: submission.trim() }
  )
  return res.data
}

/** POST /api/v1/unlocks — body: { type: 'hints', target: hintId }. Unlocks a hint (costs points). */
export async function unlockHint(hintId: number) {
  const res = await apiClient.post<{ success: boolean; data?: unknown }>('/api/v1/unlocks', {
    type: 'hints',
    target: hintId,
  })
  return res.data
}

export interface ChallengeSolve {
  account_id: number
  name: string
  date: string
  account_url?: string
}

/** GET /api/v1/challenges/:id/solves — قائمة من حلّوا التحدي */
export async function getChallengeSolves(challengeId: number): Promise<ChallengeSolve[]> {
  const res = await apiClient.get<{ success: boolean; data: ChallengeSolve[] }>(
    `/api/v1/challenges/${challengeId}/solves`
  )
  return res.data?.data ?? []
}

