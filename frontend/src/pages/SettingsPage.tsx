import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { MeUser } from '../contexts/AuthContext'
import { getMe, updateMe } from '../api/auth'

export function SettingsPage() {
  const { user: ctxUser, refresh } = useAuth()
  const [user, setUser] = useState<MeUser | null>(ctxUser)
  const [loading, setLoading] = useState(!ctxUser)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (ctxUser && !user) {
      setUser(ctxUser)
    }
  }, [ctxUser, user])

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email ?? '')
      setAffiliation((user as any).affiliation ?? '')
      setWebsite((user as any).website ?? '')
      setCountry((user as any).country ?? '')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = (await getMe()) as MeUser
        if (!cancelled) {
          setUser(data)
          setName(data.name)
          setEmail(data.email ?? '')
          setAffiliation((data as any).affiliation ?? '')
          setWebsite((data as any).website ?? '')
          setCountry((data as any).country ?? '')
          refresh()
        }
      } catch (e) {
        if (!cancelled) {
          setError('Please log in to edit your settings.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, refresh])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: any = {}
      if (name !== user.name) payload.name = name
      if (email !== (user.email ?? '')) payload.email = email
      if (affiliation !== (user as any).affiliation) payload.affiliation = affiliation
      if (website !== (user as any).website) payload.website = website
      if (country !== (user as any).country) payload.country = country

      const emailChanged = email !== (user.email ?? '')
      const passwordChanged = newPassword.trim().length > 0

      if (passwordChanged) {
        payload.password = newPassword
      }
      if (emailChanged || passwordChanged) {
        payload.confirm = currentPassword
      }

      const updated = (await updateMe(payload)) as MeUser
      setUser(updated)
      await refresh()
      setSuccess('Settings updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.errors ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to update settings.'
      setError(typeof msg === 'string' ? msg : 'Failed to update settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page settings-page">
        <div className="settings-card">
          <p>Loading settings…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page settings-page">
        <div className="settings-card">
          <h1>Settings</h1>
          <p className="settings-error">Please log in to manage your settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page settings-page">
      <div className="settings-card">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your player profile, security, and preferences.</p>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-grid">
            <label>
              <span>User name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              <span>Affiliation</span>
              <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
            </label>
            <label>
              <span>Website</span>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </label>
            <label>
              <span>Country</span>
              <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="JO" />
            </label>
          </div>

          <div className="settings-section">
            <h2>Password & security</h2>
            <p className="settings-help">
              To change your email or password, confirm your current password. Leave the new password empty if you only
              want to update profile details.
            </p>
            <label>
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>

          {error && <p className="settings-error">{error}</p>}
          {success && <p className="settings-success">{success}</p>}

          <div className="settings-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

