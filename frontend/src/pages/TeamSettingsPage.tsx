import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { getMyTeam, patchTeamMe, getInviteCode } from '../api/teams'

function getApiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (axios.isAxiosError(err) && err.response?.data?.errors) {
    const errors = err.response.data.errors as Record<string, string[]>
    const first = Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Something went wrong'
}

interface TeamMember {
  id: number
  name: string
}

interface TeamInfo {
  id: number
  name: string
  score: number
  captain_id?: number
  members: TeamMember[]
  website?: string | null
  affiliation?: string | null
  country?: string | null
}

const INVITE_PATH = import.meta.env.VITE_API_BASE_URL ? '/teams/invite' : '/ctfd-auth/teams/invite'

export function TeamSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<TeamInfo | null | undefined>(undefined)

  const [name, setName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [website, setWebsite] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [country, setCountry] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function loadTeam() {
    try {
      const data = await getMyTeam()
      const t = data as TeamInfo
      setTeam(t)
      setName(t.name ?? '')
      setWebsite(t.website ?? '')
      setAffiliation(t.affiliation ?? '')
      setCountry(t.country ?? '')
    } catch {
      setTeam(null)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const isCaptain = Boolean(user && team && (team as TeamInfo).captain_id === user.id)

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault()
    if (!team || !name.trim()) return
    setNameSaving(true)
    setNameError(null)
    try {
      await patchTeamMe({ name: name.trim() })
      await loadTeam()
    } catch (err: unknown) {
      setNameError(getApiErrorMessage(err))
    } finally {
      setNameSaving(false)
    }
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    if (!team) return
    setProfileSaving(true)
    setProfileError(null)
    try {
      await patchTeamMe({
        website: website.trim(),
        affiliation: affiliation.trim(),
        country: country.trim(),
      })
      await loadTeam()
    } catch (err: unknown) {
      setProfileError(getApiErrorMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (!confirm || !password) return
    setPasswordSaving(true)
    setPasswordError(null)
    try {
      await patchTeamMe({ password, confirm })
      setPassword('')
      setConfirm('')
    } catch (err: unknown) {
      setPasswordError(getApiErrorMessage(err))
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleGenerateInvite() {
    setInviteLoading(true)
    setInviteError(null)
    try {
      const code = await getInviteCode()
      setInviteCode(code)
    } catch (err: unknown) {
      setInviteError(getApiErrorMessage(err))
    } finally {
      setInviteLoading(false)
    }
  }

  function getInviteUrl() {
    if (!inviteCode) return ''
    const base = import.meta.env.VITE_API_BASE_URL
      ? (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')
      : window.location.origin
    return base + INVITE_PATH + '?code=' + encodeURIComponent(inviteCode)
  }

  function copyInviteLink() {
    const url = getInviteUrl()
    if (!url) return
    navigator.clipboard.writeText(getInviteUrl()).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => {},
    )
  }

  if (!authLoading && !user) {
    return (
      <div className="page team-settings-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view team settings.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  if (team === undefined) {
    return (
      <div className="page team-settings-page">
        <div className="team-loading">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="page team-settings-page">
        <div className="page-auth-required">
          <p>You are not in a team. Create or join a team first.</p>
          <Link to="/team" className="btn primary">Go to Team</Link>
        </div>
      </div>
    )
  }

  if (!isCaptain) {
    return (
      <div className="page team-settings-page">
        <header className="page-header">
          <h1>Team settings</h1>
          <p>Only the team captain can change team name, password, or generate invite codes.</p>
        </header>
        <p className="team-settings-readonly">You can view your team on the Team page.</p>
        <Link to="/team" className="btn ghost">Back to Team</Link>
      </div>
    )
  }

  return (
    <div className="page team-settings-page">
      <header className="page-header">
        <h1>Team settings</h1>
        <p>Manage your team name, join password, and invite link.</p>
      </header>

      <section className="team-settings-section">
        <h2>Team name</h2>
        <form onSubmit={handleNameSubmit} className="auth-form team-settings-form">
          <label>
            Team name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={128}
            />
          </label>
          {nameError && <p className="form-error">{nameError}</p>}
          <button className="btn primary" type="submit" disabled={nameSaving}>
            {nameSaving ? 'Saving...' : 'Save name'}
          </button>
        </form>
      </section>

      <section className="team-settings-section">
        <h2>Website, affiliation, country</h2>
        <p className="team-settings-hint">
          Optional. Shown on the public teams list and scoreboard.
        </p>
        <form onSubmit={handleProfileSubmit} className="auth-form team-settings-form">
          <label>
            Website
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              maxLength={128}
            />
          </label>
          <label>
            Affiliation
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="e.g. University or organization"
              maxLength={128}
            />
          </label>
          <label>
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. US, JO"
              maxLength={32}
            />
          </label>
          {profileError && <p className="form-error">{profileError}</p>}
          <button className="btn primary" type="submit" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>

      <section className="team-settings-section">
        <h2>Team join password</h2>
        <p className="team-settings-hint">
          Change the password that new members use to join your team. You must enter your current
          account password to confirm.
        </p>
        <form onSubmit={handlePasswordSubmit} className="auth-form team-settings-form">
          <label>
            Your password (to confirm)
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Current password"
            />
          </label>
          <label>
            New team password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New join password"
            />
          </label>
          {passwordError && <p className="form-error">{passwordError}</p>}
          <button
            className="btn primary"
            type="submit"
            disabled={passwordSaving || !password || !confirm}
          >
            {passwordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="team-settings-section">
        <h2>Invite code / link</h2>
        <p className="team-settings-hint">
          Generate a one-time invite code. Share the link with someone so they can join your team
          (they must be logged in).
        </p>
        {inviteError && <p className="form-error">{inviteError}</p>}
        <div className="team-invite-actions">
          <button
            type="button"
            className="btn primary"
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
          >
            {inviteLoading ? 'Generating...' : 'Generate invite code'}
          </button>
        </div>
        {inviteCode && (
          <div className="team-invite-result">
            <p className="team-invite-code">
              <strong>Code:</strong> <code>{inviteCode}</code>
            </p>
            <p className="team-invite-url">
              <strong>Invite link:</strong> <code>{getInviteUrl()}</code>
            </p>
            <button type="button" className="btn ghost" onClick={copyInviteLink}>
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        )}
      </section>

      <p className="team-settings-back">
        <Link to="/team">← Back to Team</Link>
      </p>
    </div>
  )
}
