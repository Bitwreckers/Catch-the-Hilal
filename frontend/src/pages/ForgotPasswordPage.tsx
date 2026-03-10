import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="page auth-page">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="auth-message auth-message-success">
            If an account exists for <strong>{email}</strong>, you will receive a password reset link. Please check your inbox and spam folder.
          </p>
          <Link to="/login" className="btn primary">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Forgot password</h1>
        <p>Enter the email address for your account and we&apos;ll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <Link to="/login" className="link-button">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
