import { apiClient } from './client'

export async function getScoreboard() {
  const res = await apiClient.get<{ success?: boolean; data?: unknown }>(
    '/api/v1/scoreboard?view=admin',
    {
      validateStatus: (s) => s === 200 || s === 404,
    }
  )
  if (res.status === 404) return []
  const raw = res.data?.data
  return Array.isArray(raw) ? raw : []
}

export async function getScoreboardSummary() {
  const rows = await getScoreboard()
  const totalChallengesSolved = rows.reduce(
    (acc: number, row: any) => acc + (row.solves ?? 0),
    0,
  )
  return {
    rank: null,
    totalChallengesSolved,
  }
}

