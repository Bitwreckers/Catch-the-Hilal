import { apiClient } from './client'

export async function getChallenges() {
  const res = await apiClient.get('/api/v1/challenges')
  return res.data.data
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
  category?: string
  value?: number
  points?: number
  solved_by_me?: boolean
  hints?: ChallengeHint[]
  files?: string[]
  tags?: string[]
  topics?: Array<{ topic_id?: number; value?: string }>
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

