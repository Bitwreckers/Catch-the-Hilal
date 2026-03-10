import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserById, getUserSolves, type UserPublic, type UserSolve } from '../api/users'
import { PageSkeleton } from '../components/PageSkeleton'

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserPublic | null | undefined>(undefined)
  const [solves, setSolves] = useState<UserSolve[]>([])
  const [solvesLoading, setSolvesLoading] = useState(true)
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

  return (
    <div className="page user-profile-page">
      <header className="page-header user-profile-header">
        <nav className="breadcrumb">
          <Link to="/users">Users</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{profile.name}</span>
        </nav>
        <h1>{profile.name}</h1>
        <p className="user-profile-subtitle">Public profile</p>
      </header>

      <section className="user-profile-card profile-card">
        <dl className="profile-dl">
          <dt>Score</dt>
          <dd>{score} pts</dd>
          {place != null && (
            <>
              <dt>Place</dt>
              <dd>#{place}</dd>
            </>
          )}
          {profile.website && (
            <>
              <dt>Website</dt>
              <dd>
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="data-table-link data-table-link-external">
                  {profile.website}
                </a>
              </dd>
            </>
          )}
          {profile.affiliation && (
            <>
              <dt>Affiliation</dt>
              <dd>{profile.affiliation}</dd>
            </>
          )}
          {profile.country && (
            <>
              <dt>Country</dt>
              <dd>{profile.country}</dd>
            </>
          )}
          {profile.team_id != null && (
            <>
              <dt>Team</dt>
              <dd>
                <Link to={`/teams/${profile.team_id}`} className="data-table-link" title={profile.team_name ?? undefined}>
                  Team #{profile.team_id}
                </Link>
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className="user-profile-solves">
        <h2>Solved challenges</h2>
        {solvesLoading ? (
          <div className="solves-skeleton">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
        ) : solves.length > 0 ? (
          <ul className="solves-list">
            {solves.map((s) => (
              <li key={s.id} className="solves-list-item">
                <Link to={s.challenge_id ? `/challenges/${s.challenge_id}` : '#'} className="data-table-link">
                  {s.challenge?.name ?? `Challenge #${s.challenge_id ?? s.id}`}
                </Link>
                {s.date && (
                  <span className="solves-list-date">{new Date(s.date).toLocaleString()}</span>
                )}
                {s.value != null && (
                  <span className="solves-list-value">{s.value} pts</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="solves-empty">No solves yet.</p>
        )}
      </section>

      <div className="user-profile-actions">
        <Link to="/users" className="btn ghost">Back to users</Link>
      </div>
    </div>
  )
}
