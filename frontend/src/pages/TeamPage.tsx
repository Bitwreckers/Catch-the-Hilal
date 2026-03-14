import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyTeam, createTeam, joinTeam, getTeamSolves, type TeamSolve } from '../api/teams'
import { getUsers, type UserPublic } from '../api/users'

interface TeamMember {
  id: number
  name: string
}

interface TeamInfo {
  id: number
  name: string
  score: number
  place?: number | null
  captain_id?: number
  members?: TeamMember[]
}

type TabMode = 'create' | 'join'

export function TeamPage() {
  const { user, loading } = useAuth()
  const [team, setTeam] = useState<TeamInfo | null | undefined>(undefined)
  const [members, setMembers] = useState<UserPublic[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [solves, setSolves] = useState<TeamSolve[]>([])
  const [solvesLoading, setSolvesLoading] = useState(false)
  const [tab, setTab] = useState<TabMode>('create')

  const [createName, setCreateName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [joinName, setJoinName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  async function loadTeam() {
    try {
      const data = await getMyTeam()
      setTeam(data as TeamInfo | null)
    } catch {
      setTeam(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    loadTeam().then(() => {
      if (!cancelled) setTeam((prev) => (prev === undefined ? null : prev))
    })
    const timeout = window.setTimeout(() => {
      if (!cancelled) setTeam((prev) => (prev === undefined ? null : prev))
    }, 12000)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!team?.id) {
      setMembers([])
      setMembersLoading(false)
      return
    }
    let cancelled = false
    setMembersLoading(true)
    getUsers(1, 100, { team_id: team.id, viewAdmin: true })
      .then((res) => {
        if (!cancelled) setMembers(res.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false)
      })
    return () => { cancelled = true }
  }, [team?.id])

  useEffect(() => {
    if (!team?.id) {
      setSolves([])
      setSolvesLoading(false)
      return
    }
    let cancelled = false
    setSolvesLoading(true)
    getTeamSolves(team.id)
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
  }, [team?.id])

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await createTeam(createName.trim(), createPassword)
      window.location.replace('/team')
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleJoinSubmit(e: FormEvent) {
    e.preventDefault()
    setJoinLoading(true)
    setJoinError(null)
    try {
      await joinTeam(joinName.trim(), joinPassword)
      window.location.replace('/team')
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setJoinLoading(false)
    }
  }

  if (!loading && !user) {
    return (
      <div className="page team-page">
        <div className="page-auth-required">
          <p>You need to be logged in to manage your team.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  if (team === undefined) {
    return (
      <div className="page team-page">
        <div className="team-loading">
          <p>Loading team...</p>
        </div>
      </div>
    )
  }

  if (team) {
    const isCaptain = user && team.captain_id === user.id

    return (
      <div className="page team-page">
        <div className="page-full-width teams-list-full-width">
          <header className="page-header team-detail-header team-page-header">
            <div>
              <h1>{team.name}</h1>
              <p className="team-page-subtitle">Team #{team.id} · Your team overview</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/teams" className="btn ghost">View all teams</Link>
              {isCaptain && (
                <Link to="/team/settings" className="btn primary">Team settings</Link>
              )}
              <Link to="/challenges" className="btn ghost">Go to challenges</Link>
            </div>
          </header>

          <section className="team-detail-stats">
            <div className="team-stat-card">
              <span className="team-stat-label">Score</span>
              <span className="team-stat-value">{team.score}</span>
            </div>
            {team.place != null && (
              <div className="team-stat-card">
                <span className="team-stat-label">Rank</span>
                <span className="team-stat-value">#{team.place}</span>
              </div>
            )}
          </section>

          <section className="team-detail-section team-detail-members" aria-label="Team members">
            <h2 className="team-detail-section-title">Members</h2>
            {membersLoading ? (
              <div className="team-detail-skeleton">
                <div className="skeleton-block" />
                <div className="skeleton-block" />
              </div>
            ) : members.length > 0 ? (
              <div className="team-detail-table-wrap">
                <table className="team-detail-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th className="team-detail-table-th-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span className="team-detail-member-name">
                            <Link to={`/users/${m.id}`} className="team-detail-table-link">
                              {m.name}
                            </Link>
                            {team.captain_id === m.id && (
                              <span className="team-detail-captain-badge">Captain</span>
                            )}
                          </span>
                        </td>
                        <td className="team-detail-table-td-right">{m.score ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="team-detail-empty">No members listed.</p>
            )}
          </section>

          <section className="team-detail-section team-detail-solves">
            <h2 className="team-detail-section-title">Solves</h2>
            {solvesLoading ? (
              <div className="team-detail-skeleton">
                <div className="skeleton-block" />
                <div className="skeleton-block" />
              </div>
            ) : solves.length > 0 ? (
              <div className="team-detail-table-wrap">
                <table className="team-detail-table">
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
                          <Link to={s.challenge_id ? `/challenges/${s.challenge_id}` : '#'} className="team-detail-table-link">
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
            ) : (
              <p className="team-detail-empty">No solves yet.</p>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page team-page team-page-no-team">
      <header className="page-header">
        <h1>Team</h1>
        <p>Create a new team or join an existing one with name and password.</p>
        <Link to="/teams" className="btn ghost team-view-all-btn">View all teams</Link>
      </header>

      <div className="team-tabs">
        <button
          type="button"
          className={`team-tab ${tab === 'create' ? 'active' : ''}`}
          onClick={() => {
            setTab('create')
            setCreateError(null)
            setJoinError(null)
          }}
        >
          Create team
        </button>
        <button
          type="button"
          className={`team-tab ${tab === 'join' ? 'active' : ''}`}
          onClick={() => {
            setTab('join')
            setCreateError(null)
            setJoinError(null)
          }}
        >
          Join team
        </button>
      </div>

      <div className="auth-card team-form-card">
        {tab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="auth-form">
            <label>
              Team name
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </label>
            <label>
              Team password
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Set a password for others to join"
                required
              />
            </label>
            {createError && <p className="form-error">{createError}</p>}
            <button className="btn primary" type="submit" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create team'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="auth-form">
            <label>
              Team name
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </label>
            <label>
              Team password
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter team password"
                required
              />
            </label>
            {joinError && <p className="form-error">{joinError}</p>}
            <button className="btn primary" type="submit" disabled={joinLoading}>
              {joinLoading ? 'Joining...' : 'Join team'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
