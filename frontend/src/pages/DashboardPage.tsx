import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMe } from '../api/auth'
import { getScoreboardSummary } from '../api/scoreboard'

interface MeResponse {
  name: string
  team: { name: string; id: number } | null
  score: number
}

interface Summary {
  rank: number | null
  totalChallengesSolved: number
}

export function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const user = await getMe()
        setMe(user as MeResponse)
      } catch {
        // ignore in skeleton
      }
      try {
        const s = await getScoreboardSummary()
        setSummary(s)
      } catch {
        // ignore in skeleton
      }
    })()
  }, [])

  return (
    <div className="page dashboard-page">
      <h1>Dashboard</h1>
      <p>Overview of your progress in the Eid Jeopardy CTF.</p>

      <section className="dashboard-grid">
        <div className="dash-card">
          <h2>Current score</h2>
          <p className="dash-score">{me?.score ?? 0}</p>
        </div>
        <div className="dash-card">
          <h2>Rank</h2>
          <p className="dash-score">{summary?.rank ?? '—'}</p>
        </div>
        <div className="dash-card">
          <h2>Solved challenges</h2>
          <p className="dash-score">
            {summary?.totalChallengesSolved ?? 0}
          </p>
        </div>
      </section>

      <section className="dash-links">
        <Link to="/challenges" className="btn primary">
          Go to Jeopardy board
        </Link>
        <Link to="/scoreboard" className="btn ghost">
          View scoreboard
        </Link>
        <Link to="/team" className="btn ghost">
          Team overview
        </Link>
      </section>
    </div>
  )
}

