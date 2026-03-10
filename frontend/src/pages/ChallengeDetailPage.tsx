import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getChallenge, submitFlag, unlockHint, type ChallengeHint } from '../api/challenges'
import { getBackendBaseUrl } from '../api/client'
import { ChallengeDetailSkeleton } from '../components/ChallengeDetailSkeleton'

const SKELETON_MIN_MS = 400

interface ChallengeDetails {
  id: number
  name: string
  description: string
  category: string
  value: number
  solved_by_me?: boolean
  hints?: ChallengeHint[]
  files?: string[]
  tags?: string[]
  topics?: Array<{ topic_id?: number; value?: string }>
}

type FlagStatus = 'correct' | 'incorrect' | 'already_solved' | 'partial' | 'ratelimited' | null

export function ChallengeDetailPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [flagStatus, setFlagStatus] = useState<FlagStatus>(null)
  const [submitting, setSubmitting] = useState(false)
  const [unlockingHintId, setUnlockingHintId] = useState<number | null>(null)
  const [skeletonVisible, setSkeletonVisible] = useState(true)
  const skeletonMinTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshChallenge = useCallback(async () => {
    if (!id) return
    try {
      const data = await getChallenge(Number(id))
      setChallenge({
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        category: data.category ?? '',
        value: data.value ?? data.points ?? 0,
        solved_by_me: Boolean(data.solved_by_me),
        hints: data.hints ?? [],
        files: Array.isArray(data.files) ? data.files : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        topics: Array.isArray(data.topics) ? data.topics : [],
      })
    } catch {
      setChallenge(null)
      setLoadError(true)
      setSkeletonVisible(false)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadError(false)
    setChallenge(null)
    setLoading(true)
    setSkeletonVisible(true)
    if (skeletonMinTimeRef.current) {
      clearTimeout(skeletonMinTimeRef.current)
      skeletonMinTimeRef.current = null
    }
    skeletonMinTimeRef.current = setTimeout(() => {
      skeletonMinTimeRef.current = null
      setSkeletonVisible(false)
    }, SKELETON_MIN_MS)
    refreshChallenge()
    return () => {
      if (skeletonMinTimeRef.current) {
        clearTimeout(skeletonMinTimeRef.current)
        skeletonMinTimeRef.current = null
      }
    }
  }, [id, refreshChallenge])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setMessage(null)
    setFlagStatus(null)
    try {
      const res = await submitFlag(Number(id), flag)
      const inner = res?.data ?? {}
      const status = (inner?.status as FlagStatus) ?? null
      const msg = inner?.message ?? 'Submission processed'
      setFlagStatus(status)
      setMessage(msg)
      if (status === 'correct' || status === 'already_solved') {
        setFlag('')
        setChallenge((prev) => (prev ? { ...prev, solved_by_me: true } : null))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit flag'
      setMessage(msg)
      setFlagStatus('incorrect')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnlockHint(hint: ChallengeHint) {
    if (hint.content != null) return
    setUnlockingHintId(hint.id)
    try {
      await unlockHint(hint.id)
      await refreshChallenge()
    } catch {
      // Error could be shown in UI; challenge state will refresh
    } finally {
      setUnlockingHintId(null)
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="page challenge-detail-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view this challenge.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  if (!loading && (loadError || !challenge) && id) {
    return (
      <div className="page challenge-detail-page">
        <div className="challenge-detail-error">
          <p>Challenge not found or could not be loaded.</p>
          <Link to="/challenges" className="btn primary">Back to Challenges</Link>
        </div>
      </div>
    )
  }

  if (loading || !challenge || skeletonVisible) {
    return (
      <div className="page challenge-detail-page challenge-detail-page-loading">
        <ChallengeDetailSkeleton />
      </div>
    )
  }

  const isSolved = challenge.solved_by_me
  const hints = challenge.hints ?? []
  const files = challenge.files ?? []
  const tags = challenge.tags ?? []
  const topics = challenge.topics ?? []

  return (
    <div className="page challenge-detail-page challenge-detail-page-ready">
      <header className="challenge-detail-header">
        <div className="challenge-detail-meta">
          <span className="challenge-detail-category">{challenge.category}</span>
          <span className="challenge-detail-points">{challenge.value} pts</span>
          {isSolved && <span className="challenge-detail-solved-badge">Solved</span>}
        </div>
        <h1>{challenge.name}</h1>
      </header>

      <section className="challenge-description-card">
        <h2 className="challenge-description-title">Description</h2>
        <div className="challenge-description-body">
          {challenge.description || <p className="challenge-no-description">No description provided.</p>}
        </div>
      </section>

      {files.length > 0 && (
        <section className="challenge-extras-section challenge-files-section">
          <h2 className="challenge-extras-title">Files</h2>
          <ul className="challenge-files-list">
            {files.map((url, i) => {
              const backendBase = getBackendBaseUrl()
              const fileUrl = backendBase && (url.startsWith('/') || !url.startsWith('http'))
                ? backendBase + (url.startsWith('/') ? url : '/' + url)
                : url
              const label = files.length > 1 ? `File-${i + 1}` : 'File'
              return (
                <li key={i}>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={label}
                    className="challenge-file-link"
                  >
                    File {files.length > 1 ? i + 1 : ''}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {topics.length > 0 && (
        <section className="challenge-extras-section challenge-topics-section">
          <h2 className="challenge-extras-title">Topics</h2>
          <ul className="challenge-topics-list">
            {topics.map((t, i) => (
              <li key={t.topic_id ?? i} className="challenge-topic-pill">
                {t.value ?? ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags.length > 0 && (
        <section className="challenge-extras-section challenge-tags-section">
          <h2 className="challenge-extras-title">Tags</h2>
          <div className="challenge-tags-list">
            {tags.map((tag, i) => (
              <span key={i} className="challenge-tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {hints.length > 0 && (
        <section className="challenge-hints-section">
          <h2 className="challenge-hints-title">Hints</h2>
          <ul className="challenge-hints-list">
            {hints.map((h) => (
              <li key={h.id} className={`challenge-hint-item ${h.content != null ? 'challenge-hint-unlocked' : ''}`}>
                <div className="challenge-hint-header">
                  <span className="challenge-hint-title">{h.title}</span>
                  {h.cost > 0 && <span className="challenge-hint-cost">{h.cost} pts</span>}
                </div>
                {h.content != null ? (
                  <div className="challenge-hint-content">{h.content}</div>
                ) : (
                  <button
                    type="button"
                    className="btn ghost challenge-hint-unlock-btn"
                    disabled={unlockingHintId === h.id}
                    onClick={() => handleUnlockHint(h)}
                  >
                    {unlockingHintId === h.id ? 'Unlocking...' : 'Unlock hint'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="challenge-submit-section">
        <h2 className="challenge-submit-title">Submit flag</h2>
        {isSolved ? (
          <div className="flag-already-solved">
            <p>You have already solved this challenge.</p>
            <Link to="/challenges" className="btn ghost">Back to Challenges</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flag-form">
            <label htmlFor="flag-input">
              Flag
              <input
                id="flag-input"
                type="text"
                placeholder="Enter flag (e.g. CTF{...})"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                required
                autoComplete="off"
              />
            </label>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            {message != null && (
              <p
                className={`flag-message flag-message-${flagStatus === 'correct' || flagStatus === 'already_solved' ? 'success' : flagStatus === 'incorrect' ? 'error' : flagStatus === 'ratelimited' ? 'warning' : 'info'}`}
                role="alert"
              >
                {message}
              </p>
            )}
          </form>
        )}
      </section>

      <p className="challenge-detail-back">
        <Link to="/challenges">← Back to Challenges</Link>
      </p>
    </div>
  )
}
