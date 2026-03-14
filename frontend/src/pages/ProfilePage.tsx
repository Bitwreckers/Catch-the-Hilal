import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMe } from '../api/auth'
import { getMeSolves, getMeFailsCount, type UserSolve } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import type { MeUser } from '../contexts/AuthContext'
import { PageSkeleton } from '../components/PageSkeleton'

export function ProfilePage() {
  const { user: ctxUser, refresh } = useAuth()
  const [user, setUser] = useState<MeUser | null>(ctxUser)
  const [solves, setSolves] = useState<UserSolve[]>([])
  const [solvesLoading, setSolvesLoading] = useState(true)
  const [failsCount, setFailsCount] = useState(0)
  const [loading, setLoading] = useState(!ctxUser)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ctxUser) {
      setUser(ctxUser)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getMe()
        if (!cancelled) {
          setUser(data as MeUser)
          refresh()
        }
      } catch (e) {
        if (!cancelled) {
          setError('Please log in to view your profile.')
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ctxUser, refresh])

  useEffect(() => {
    if (!user?.id) {
      setSolvesLoading(false)
      return
    }
    let cancelled = false
    setSolvesLoading(true)
    Promise.all([getMeSolves(), getMeFailsCount()])
      .then(([s, f]) => {
        if (!cancelled) {
          setSolves(s ?? [])
          setFailsCount(f ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) setSolves([])
      })
      .finally(() => {
        if (!cancelled) setSolvesLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id])

  const { solvesPct, fallsPct } = useMemo(() => {
    const s = solves.length
    const f = failsCount
    const total = s + f
    if (total === 0) return { solvesPct: 0, fallsPct: 0 }
    return {
      solvesPct: (s / total) * 100,
      fallsPct: (f / total) * 100,
    }
  }, [solves.length, failsCount])

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    solves.forEach((s) => {
      const cat = s.challenge?.category?.trim() || 'Other'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    const total = solves.length || 1
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      pct: (count / total) * 100,
    })).sort((a, b) => b.pct - a.pct)
  }, [solves])

  if (loading) {
    return (
      <div className="page profile-page">
        <PageSkeleton withHeader blocks={3} />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="page profile-page">
        <div className="profile-card">
          <h1>Profile</h1>
          <p className="profile-error">{error}</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  const score = user.score ?? 0
  const place = user.place != null ? user.place : null
  const teamName = user.team_name ?? user.team?.name ?? (user.team_id != null ? `Team #${user.team_id}` : null)

  return (
    <div className="page profile-page user-profile-page">
      <div className="page-full-width">
      <header className="page-header user-profile-header user-profile-header-centered">
        <h1 className="user-profile-name">{user.name}</h1>
        {teamName && (
          <Link to="/team" className="user-profile-team-tag">{teamName}</Link>
        )}
        {place != null && (
          <p className="user-profile-stat">{place}th place</p>
        )}
        <p className="user-profile-stat">{score} points</p>
      </header>

      <section className="user-profile-solves">
        <h2 className="solves-section-title">Solves</h2>
        {solvesLoading ? (
          <div className="solves-skeleton">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
        ) : solves.length > 0 ? (
          <>
            <div className="solves-table-wrap">
              <table className="solves-table">
                <thead>
                  <tr>
                    <th>Challenge</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {solves.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link to={s.challenge_id ? `/challenges/${s.challenge_id}` : '#'} className="solves-table-link">
                          {s.challenge?.name ?? `Challenge #${s.challenge_id ?? s.id}`}
                        </Link>
                      </td>
                      <td>{s.challenge?.category ?? '—'}</td>
                      <td>{s.challenge?.value ?? s.value ?? '—'}</td>
                      <td>{s.date ? new Date(s.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="solves-stats">
              <div className="solves-stat-bars">
                <div className="solves-stat-bar-row">
                  <div
                    className="solves-stat-bar solves-stat-bar--solves-falls"
                    role="img"
                    aria-label={`Solves ${solvesPct.toFixed(2)}%, Fails ${fallsPct.toFixed(2)}%`}
                  >
                    <span className="solves-stat-bar-segment solves-stat-bar-segment--solves" style={{ width: `${solvesPct}%` }} />
                    <span className="solves-stat-bar-segment solves-stat-bar-segment--falls" style={{ width: `${fallsPct}%` }} />
                  </div>
                  <div className="solves-stat-labels">
                    <span className="solves-stat-label solves-stat-label--solves">
                      <span className="solves-stat-dot solves-stat-dot--solves" /> Solves ({solvesPct.toFixed(2)}%)
                    </span>
                    <span className="solves-stat-label solves-stat-label--falls">
                      <span className="solves-stat-dot solves-stat-dot--falls" /> Fails ({fallsPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                {categoryBreakdown.length > 0 && (
                  <div className="solves-stat-bar-row">
                    <div
                      className="solves-stat-bar solves-stat-bar--categories"
                      role="img"
                      aria-label={categoryBreakdown.map((c) => `${c.name} ${c.pct.toFixed(2)}%`).join(', ')}
                    >
                      {categoryBreakdown.map((c, i) => (
                        <span
                          key={c.name}
                          className={`solves-stat-bar-segment solves-stat-bar-segment--cat-${i % 5}`}
                          style={{ width: `${c.pct}%` }}
                        />
                      ))}
                    </div>
                    <div className="solves-stat-labels">
                      {categoryBreakdown.map((c, i) => (
                        <span key={c.name} className="solves-stat-label">
                          <span className={`solves-stat-dot solves-stat-dot--cat-${i % 5}`} /> {c.name} ({c.pct.toFixed(2)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="solves-empty">No solves yet.</p>
        )}
      </section>

      <div className="user-profile-actions">
        <Link to="/challenges" className="btn primary">Challenges</Link>
        <Link to="/scoreboard" className="btn ghost">Scoreboard</Link>
      </div>
      </div>
    </div>
  )
}
