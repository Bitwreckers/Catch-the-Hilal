import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../api/auth'

const REDIRECT_AFTER_LOGIN = '/challenges'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ name: username, password })
      window.location.replace(REDIRECT_AFTER_LOGIN)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Sign in to access the Eid Jeopardy CTF.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username or Email
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <Link to="/reset-password" className="link-button">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}

