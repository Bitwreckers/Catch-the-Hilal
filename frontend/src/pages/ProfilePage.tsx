import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMe } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import type { MeUser } from '../contexts/AuthContext'

export function ProfilePage() {
  const { user: ctxUser, refresh } = useAuth()
  const [user, setUser] = useState<MeUser | null>(ctxUser)
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

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="profile-card">
          <p>Loading profile…</p>
        </div>
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

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <h1>Profile</h1>
        <dl className="profile-dl">
          <dt>Name</dt>
          <dd>{user.name}</dd>
          {user.email != null && user.email !== '' && (
            <>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </>
          )}
          <dt>Score</dt>
          <dd>{score} pts</dd>
          {place != null && (
            <>
              <dt>Place</dt>
              <dd>#{place}</dd>
            </>
          )}
          {(user.team_name ?? user.team?.name ?? user.team_id) != null && (
            <>
              <dt>Team</dt>
              <dd>
                <Link to="/team">{user.team_name ?? user.team?.name ?? `Team #${user.team_id}`}</Link>
              </dd>
            </>
          )}
        </dl>
        <div className="profile-actions">
          <Link to="/challenges" className="btn primary">Challenges</Link>
          <Link to="/scoreboard" className="btn secondary">Scoreboard</Link>
        </div>
      </div>
    </div>
  )
}
