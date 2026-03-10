import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTeamById, type TeamPublic } from '../api/teams'
import { getUsers, type UserPublic } from '../api/users'
import { PageSkeleton } from '../components/PageSkeleton'

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<TeamPublic | null | undefined>(undefined)
  const [members, setMembers] = useState<UserPublic[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const rawId = id ? parseInt(id, 10) : NaN
    if (!id || Number.isNaN(rawId)) {
      setTeam(null)
      setError('Invalid team.')
      return
    }
    let cancelled = false
    setError(null)
    getTeamById(rawId)
      .then((data) => {
        if (cancelled) return
        setTeam(data ?? null)
        if (data == null) setError('Team not found.')
      })
      .catch(() => {
        if (!cancelled) {
          setTeam(null)
          setError('Failed to load team.')
        }
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const rawId = id ? parseInt(id, 10) : NaN
    if (!id || Number.isNaN(rawId)) return
    let cancelled = false
    getUsers(1, 100, { team_id: rawId })
      .then((res) => {
        if (!cancelled) setMembers(res.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
    return () => { cancelled = true }
  }, [id])

  if (!authLoading && !user) {
    return (
      <div className="page team-detail-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view team details.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  if (team === undefined) {
    return (
      <div className="page team-detail-page">
        <PageSkeleton withHeader blocks={2} />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="page team-detail-page">
        <header className="page-header">
          <h1>Team</h1>
        </header>
        <div className="page-error">
          <p>{error ?? 'Team not found.'}</p>
          <button type="button" className="btn ghost" onClick={() => navigate('/teams')}>
            Back to teams
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page team-detail-page">
      <header className="page-header team-detail-header">
        <div>
          <nav className="breadcrumb">
            <Link to="/teams">Teams</Link>
            <span className="breadcrumb-sep">/</span>
            <span>{team.name}</span>
          </nav>
          <h1>{team.name}</h1>
          <p className="team-detail-subtitle">Team overview and members</p>
        </div>
        <Link to="/teams" className="btn ghost">All teams</Link>
      </header>

      <section className="team-detail-stats">
        <div className="team-stat-card">
          <span className="team-stat-label">Score</span>
          <span className="team-stat-value">{team.score ?? 0}</span>
        </div>
        {team.place != null && (
          <div className="team-stat-card">
            <span className="team-stat-label">Rank</span>
            <span className="team-stat-value">#{team.place}</span>
          </div>
        )}
      </section>

      <section className="team-detail-members team-members-card">
        <h2>Members</h2>
        {members.length > 0 ? (
          <ul className="team-members-list">
            {members.map((m) => (
              <li key={m.id} className="team-member-item">
                <Link to={`/users/${m.id}`} className="data-table-link">
                  {m.name}
                </Link>
                {team.captain_id === m.id && (
                  <span className="team-member-badge">Captain</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="team-members-empty">No members listed.</p>
        )}
      </section>

      <div className="team-detail-actions">
        <Link to="/teams" className="btn ghost">Back to teams</Link>
      </div>
    </div>
  )
}
