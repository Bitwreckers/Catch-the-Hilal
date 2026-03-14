import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserById, getUserSolves, getUserFailsCount, type UserPublic, type UserSolve } from '../api/users'
import { PageSkeleton } from '../components/PageSkeleton'

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserPublic | null | undefined>(undefined)
  const [solves, setSolves] = useState<UserSolve[]>([])
  const [solvesLoading, setSolvesLoading] = useState(true)
  const [failsCount, setFailsCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const rawId = id ? parseInt(id, 10) : NaN
    if (!id || Number.isNaN(rawId)) {
      setProfile(null)
      setError('Invalid user.')
      return
    }
    let cancelled = false
    setError(null)
    getUserById(rawId)
      .then((data) => {
        if (cancelled) return
        setProfile(data ?? null)
        if (data == null) setError('User not found.')
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null)
          setError('Failed to load profile.')
        }
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const rawId = id ? parseInt(id, 10) : NaN
    if (!id || Number.isNaN(rawId) || profile == null) {
      setSolvesLoading(false)
      return
    }
    let cancelled = false
    setSolvesLoading(true)
    getUserSolves(rawId)
      .then((data) => {
        if (!cancelled) setSolves(data ?? [])
      })
      .catch(() => {
        if (!cancelled) setSolves([])
      })
      .finally(() => {
        if (!cancelled) setSolvesLoading(false)
      })
    return () => { cancelled = true }
  }, [id, profile])

  useEffect(() => {
    const rawId = id ? parseInt(id, 10) : NaN
    if (!id || Number.isNaN(rawId) || profile == null) return
    let cancelled = false
    getUserFailsCount(rawId)
      .then((count) => { if (!cancelled) setFailsCount(count) })
      .catch(() => { if (!cancelled) setFailsCount(0) })
    return () => { cancelled = true }
  }, [id, profile])

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

  if (!authLoading && !user) {
    return (
      <div className="page user-profile-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view profiles.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  if (profile === undefined) {
    return (
      <div className="page user-profile-page">
        <PageSkeleton withHeader blocks={2} />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="page user-profile-page">
        <header className="page-header">
          <h1>Profile</h1>
        </header>
        <div className="page-error">
          <p>{error ?? 'User not found.'}</p>
          <button type="button" className="btn ghost" onClick={() => navigate('/users')}>
            Back to users
          </button>
        </div>
      </div>
    )
  }

  const score = profile.score ?? 0
  const place = profile.place != null ? profile.place : null
  const teamName = profile.team_name ?? (profile.team_id != null ? `Team #${profile.team_id}` : null)

  return (
    <div className="page user-profile-page">
      <div className="page-full-width">
      <header className="page-header user-profile-header user-profile-header-centered">
        <nav className="breadcrumb user-profile-breadcrumb">
          <Link to="/users">Users</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{profile.name}</span>
        </nav>
        <h1 className="user-profile-name">{profile.name}</h1>
        {teamName && (
          profile.team_id != null
            ? <Link to={`/teams/${profile.team_id}`} className="user-profile-team-tag" title={profile.team_name ?? undefined}>
                {profile.team_name ?? teamName}
              </Link>
            : <span className="user-profile-team-tag">{teamName}</span>
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
                    aria-label={`Solves ${solvesPct.toFixed(2)}%, Falls ${fallsPct.toFixed(2)}%`}
                  >
                    <span className="solves-stat-bar-segment solves-stat-bar-segment--solves" style={{ width: `${solvesPct}%` }} />
                    <span className="solves-stat-bar-segment solves-stat-bar-segment--falls" style={{ width: `${fallsPct}%` }} />
                  </div>
                  <div className="solves-stat-labels">
                    <span className="solves-stat-label solves-stat-label--solves">
                      <span className="solves-stat-dot solves-stat-dot--solves" /> Solves ({solvesPct.toFixed(2)}%)
                    </span>
                    <span className="solves-stat-label solves-stat-label--falls">
                      <span className="solves-stat-dot solves-stat-dot--falls" /> Falls ({fallsPct.toFixed(2)}%)
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
        <Link to="/users" className="btn ghost">Back to users</Link>
      </div>
      </div>
    </div>
  )
}
