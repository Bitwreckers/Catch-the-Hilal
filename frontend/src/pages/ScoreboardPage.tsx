import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getScoreboard } from '../api/scoreboard'
import { TableSkeleton } from '../components/TableSkeleton'

interface ScoreRow {
  position: number
  name: string
  score: number
  accountId?: number
  solves?: number
  lastSubmission?: string
}

type ScoreView = 'top10' | 'all'
const SCOREBOARD_PER_PAGE = 50

function formatLastSubmission(isoOrNull: unknown): string | undefined {
  if (isoOrNull == null || typeof isoOrNull !== 'string') return undefined
  try {
    const d = new Date(isoOrNull)
    return Number.isNaN(d.getTime()) ? undefined : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return undefined
  }
}

function parseScoreboardData(data: unknown): ScoreRow[] {
  if (!Array.isArray(data)) return []
  const sorted = [...data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(b.score) ?? 0) - (Number(a.score) ?? 0))
  return sorted.map((row: Record<string, unknown>, idx: number) => ({
    position: Number(row.pos) ?? idx + 1,
    name: String(row.name ?? ''),
    score: Number(row.score) ?? 0,
    accountId: row.account_id != null ? Number(row.account_id) : undefined,
    solves: row.solves != null ? Number(row.solves) : undefined,
    lastSubmission: formatLastSubmission(row.last_submit_time),
  }))
}

export function ScoreboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [view, setView] = useState<ScoreView>('top10')
  const [scoreboardPage, setScoreboardPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScoreboard = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await getScoreboard()
      setRows(parseScoreboardData(data))
    } catch {
      setRows([])
      setError('Could not load scoreboard. Try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScoreboard()
  }, [fetchScoreboard])

  useEffect(() => {
    const onFocus = () => { fetchScoreboard() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchScoreboard])

  const visibleRows = useMemo(() => {
    if (view === 'top10') return rows.slice(0, 10)
    const start = (scoreboardPage - 1) * SCOREBOARD_PER_PAGE
    return rows.slice(start, start + SCOREBOARD_PER_PAGE)
  }, [rows, view, scoreboardPage])

  const scoreboardTotalPages = Math.max(1, Math.ceil(rows.length / SCOREBOARD_PER_PAGE))

  if (!authLoading && !user) {
    return (
      <div className="page scoreboard-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view the scoreboard.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page scoreboard-page">
      <header className="page-header scoreboard-header scoreboard-header-with-refresh">
        <div>
          <h1>Scoreboard</h1>
          <p>Track how teams climb under the crescent in real time.</p>
        </div>
        <div className="scoreboard-header-actions">
          <button
            type="button"
            className="btn ghost scoreboard-refresh-btn"
            onClick={fetchScoreboard}
            disabled={loading}
            aria-label="Refresh scoreboard"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <div className="scoreboard-legend">
            <span className="score-pill gold">1st</span>
            <span className="score-pill silver">2nd</span>
            <span className="score-pill bronze">3rd</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="scoreboard-error">
          <p>{error}</p>
          <button type="button" className="btn primary" onClick={fetchScoreboard}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <TableSkeleton columns={5} rows={10} className="scoreboard-table-skeleton" />
      )}

      {!loading && !error && (
        <>
          <div className="scoreboard-controls">
            <button
              type="button"
              className={`score-toggle ${view === 'top10' ? 'active' : ''}`}
              onClick={() => { setView('top10'); setScoreboardPage(1) }}
            >
              Top 10
            </button>
            <button
              type="button"
              className={`score-toggle ${view === 'all' ? 'active' : ''}`}
              onClick={() => { setView('all'); setScoreboardPage(1) }}
            >
              All teams ({rows.length})
            </button>
          </div>

          <div className="scoreboard-shell">
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Score</th>
                  <th>Solves</th>
                  <th>Last submission</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, idx) => {
                  let rankClass = ''
                  if (row.position === 1) rankClass = 'score-top-1'
                  else if (row.position === 2) rankClass = 'score-top-2'
                  else if (row.position === 3) rankClass = 'score-top-3'

                  return (
                    <tr key={`score-${idx}-${row.position}-${row.name ?? ''}`} className={rankClass}>
                      <td>{row.position}</td>
                      <td>
                        {row.accountId != null ? (
                          <Link to={`/teams/${row.accountId}`} className="scoreboard-team-link">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td>{row.score}</td>
                      <td>{row.solves ?? '—'}</td>
                      <td>{row.lastSubmission ?? '—'}</td>
                    </tr>
                  )
                })}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="scoreboard-empty">
                      No teams on the board yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {view === 'all' && rows.length > SCOREBOARD_PER_PAGE && (
            <nav className="pagination scoreboard-pagination" aria-label="Scoreboard pagination">
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={scoreboardPage <= 1}
                onClick={() => setScoreboardPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {scoreboardPage} of {scoreboardTotalPages} ({rows.length} teams)
              </span>
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={scoreboardPage >= scoreboardTotalPages}
                onClick={() => setScoreboardPage((p) => Math.min(scoreboardTotalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

