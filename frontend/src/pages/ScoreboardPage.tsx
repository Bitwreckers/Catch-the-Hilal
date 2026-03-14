import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getScoreboard } from '../api/scoreboard'
import { getCtfTime } from '../api/ctf'
import { TableSkeleton } from '../components/TableSkeleton'
import crescentMoonImg from '../assets/crescent-moon.png'
import lanternImg from '../assets/lantern.png'

interface ScoreRow {
  position: number
  name: string
  score: number
  accountId?: number
  solves?: number
  lastSubmission?: string
}

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
  const [scoreboardPage, setScoreboardPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ctfEnded, setCtfEnded] = useState(false)

  useEffect(() => {
    getCtfTime()
      .then(({ end }) => {
        if (end) {
          const endTime = new Date(end).getTime()
          setCtfEnded(Date.now() >= endTime)
        }
      })
      .catch(() => {})
  }, [])

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

  const visibleRows = useMemo(() => {
    const start = (scoreboardPage - 1) * SCOREBOARD_PER_PAGE
    return rows.slice(start, start + SCOREBOARD_PER_PAGE)
  }, [rows, scoreboardPage])

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
      <div className="page-full-width">
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
          {rows.length >= 1 && (
            <div className="scoreboard-podium">
              {rows[1] && (
                <div className="scoreboard-podium-card scoreboard-podium-card--2nd">
                  <span className="scoreboard-podium-card-specks" aria-hidden />
                  <img src={crescentMoonImg} alt="" className="scoreboard-podium-crescent" aria-hidden />
                  <div className="scoreboard-podium-card-head">
                    <span className="scoreboard-podium-rank">2ND</span>
                    <span className="scoreboard-podium-points">{Number(rows[1].score).toLocaleString('en-US')} <span className="scoreboard-podium-pts-unit">PTS</span></span>
                  </div>
                  <div className="scoreboard-podium-card-body">
                    <div className="scoreboard-podium-lantern-wrap">
                      <img src={lanternImg} alt="" className="scoreboard-podium-lantern" aria-hidden />
                    </div>
                    {rows[1].accountId != null ? (
                      <Link to={`/teams/${rows[1].accountId}`} className="scoreboard-podium-name">
                        {rows[1].name}
                      </Link>
                    ) : (
                      <span className="scoreboard-podium-name">{rows[1].name}</span>
                    )}
                    <span className="scoreboard-podium-solves"><span className="scoreboard-podium-solves-diamond" aria-hidden>◆</span> {rows[1].solves ?? 0} solves</span>
                  </div>
                  <div className="scoreboard-podium-card-divider" aria-hidden />
                  <div className="scoreboard-podium-card-footer">
                    <span className="scoreboard-podium-card-number" aria-hidden>2</span>
                  </div>
                </div>
              )}
              {rows[0] && (
                <div className="scoreboard-podium-card scoreboard-podium-card--1st">
                  <span className="scoreboard-podium-card-specks" aria-hidden />
                  <img src={crescentMoonImg} alt="" className="scoreboard-podium-crescent" aria-hidden />
                  <div className="scoreboard-podium-card-head">
                    <span className="scoreboard-podium-rank">1ST</span>
                    <span className="scoreboard-podium-points">{Number(rows[0].score).toLocaleString('en-US')} <span className="scoreboard-podium-pts-unit">PTS</span></span>
                  </div>
                  <div className="scoreboard-podium-card-body">
                    <div className="scoreboard-podium-lantern-wrap">
                      <img src={lanternImg} alt="" className="scoreboard-podium-lantern" aria-hidden />
                    </div>
                    {rows[0].accountId != null ? (
                      <Link to={`/teams/${rows[0].accountId}`} className="scoreboard-podium-name">
                        {rows[0].name}
                      </Link>
                    ) : (
                      <span className="scoreboard-podium-name">{rows[0].name}</span>
                    )}
                    <span className="scoreboard-podium-solves"><span className="scoreboard-podium-solves-diamond" aria-hidden>◆</span> {rows[0].solves ?? 0} solves</span>
                  </div>
                  <div className="scoreboard-podium-card-divider" aria-hidden />
                  <div className="scoreboard-podium-card-footer">
                    <span className="scoreboard-podium-card-number" aria-hidden>1</span>
                  </div>
                </div>
              )}
              {rows[2] && (
                <div className="scoreboard-podium-card scoreboard-podium-card--3rd">
                  <span className="scoreboard-podium-card-specks" aria-hidden />
                  <img src={crescentMoonImg} alt="" className="scoreboard-podium-crescent" aria-hidden />
                  <div className="scoreboard-podium-card-head">
                    <span className="scoreboard-podium-rank">3RD</span>
                    <span className="scoreboard-podium-points">{Number(rows[2].score).toLocaleString('en-US')} <span className="scoreboard-podium-pts-unit">PTS</span></span>
                  </div>
                  <div className="scoreboard-podium-card-body">
                    <div className="scoreboard-podium-lantern-wrap">
                      <img src={lanternImg} alt="" className="scoreboard-podium-lantern" aria-hidden />
                    </div>
                    {rows[2].accountId != null ? (
                      <Link to={`/teams/${rows[2].accountId}`} className="scoreboard-podium-name">
                        {rows[2].name}
                      </Link>
                    ) : (
                      <span className="scoreboard-podium-name">{rows[2].name}</span>
                    )}
                    <span className="scoreboard-podium-solves"><span className="scoreboard-podium-solves-diamond" aria-hidden>◆</span> {rows[2].solves ?? 0} solves</span>
                  </div>
                  <div className="scoreboard-podium-card-divider" aria-hidden />
                  <div className="scoreboard-podium-card-footer">
                    <span className="scoreboard-podium-card-number" aria-hidden>3</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <section className="scoreboard-full-rankings">
            <header className="scoreboard-full-rankings-header">
              <div className="scoreboard-full-rankings-title-wrap">
                <span className="scoreboard-full-rankings-icon" aria-hidden>
                  <span /><span /><span />
                </span>
                <h2 className="scoreboard-full-rankings-title">FULL RANKINGS</h2>
              </div>
              {ctfEnded && (
                <span className="scoreboard-ended-badge">
                  <span className="scoreboard-ended-dot" aria-hidden />
                  ENDED
                </span>
              )}
            </header>
            <div className="scoreboard-rank-list">
              {visibleRows.length > 0 && (
                <div className="scoreboard-rank-header">
                  <span className="scoreboard-rank-header-col scoreboard-rank-header-num">#</span>
                  <span className="scoreboard-rank-header-col scoreboard-rank-header-team">TEAM</span>
                  <span className="scoreboard-rank-header-col scoreboard-rank-header-score">SCORE</span>
                </div>
              )}
              {visibleRows.map((row, idx) => {
                const maxScore = rows[0]?.score && rows[0].score > 0 ? rows[0].score : 1
                const progressPct = Math.min(100, (row.score / maxScore) * 100)
                return (
                  <div
                    key={`rank-${idx}-${row.position}-${row.name ?? ''}`}
                    className="scoreboard-rank-row"
                  >
                    <div className="scoreboard-rank-circle">{row.position}</div>
                    <div className="scoreboard-rank-info">
                      {row.accountId != null ? (
                        <Link to={`/teams/${row.accountId}`} className="scoreboard-rank-team">
                          {row.name}
                        </Link>
                      ) : (
                        <span className="scoreboard-rank-team">{row.name}</span>
                      )}
                      <span className="scoreboard-rank-solves">{row.solves ?? 0} solves</span>
                      <div className="scoreboard-rank-progress-wrap">
                        <div className="scoreboard-rank-progress-bar">
                          <div className="scoreboard-rank-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="scoreboard-rank-score-wrap">
                      <span className="scoreboard-rank-score">{Number(row.score).toLocaleString('en-US')}</span>
                      <span className="scoreboard-rank-pts-label">PTS</span>
                    </div>
                  </div>
                )
              })}
              {visibleRows.length === 0 && (
                <p className="scoreboard-empty">No teams on the board yet.</p>
              )}
            </div>
            {rows.length > SCOREBOARD_PER_PAGE && (
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
          </section>
        </>
      )}
      </div>
    </div>
  )
}

