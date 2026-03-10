import { apiClient } from './client'

export async function getScoreboard() {
  const res = await apiClient.get('/api/v1/scoreboard')
  return res.data.data
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

