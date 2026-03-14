import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  getChallenge,
  getChallengeSolves,
  submitFlag,
  type ChallengeDetailResponse,
  type ChallengeSolve,
} from '../api/challenges'
import { getBackendBaseUrl } from '../api/client'
import { WhaleInstanceControls } from './WhaleInstanceControls'

export interface ChallengeModalInitialData {
  id: number
  name: string
  category: string
  value: number
  solved: boolean
}

interface ChallengeModalProps {
  challengeId: number
  onClose: () => void
  onSolved?: () => void
  initialData?: ChallengeModalInitialData
}

function buildPartialChallenge(initial: ChallengeModalInitialData): ChallengeDetailResponse {
  return {
    id: initial.id,
    name: initial.name,
    category: initial.category,
    value: initial.value,
    points: initial.value,
    solved_by_me: initial.solved,
    description: undefined,
    description_html: undefined,
    files: [],
    connection_info: undefined,
    attribution: undefined,
    attribution_html: undefined,
    position: undefined,
    max_attempts: undefined,
    attempts: 0,
    solves: 0,
  }
}

export function ChallengeModal({ challengeId, onClose, onSolved, initialData }: ChallengeModalProps) {
  const [challenge, setChallenge] = useState<ChallengeDetailResponse | null>(() =>
    initialData ? buildPartialChallenge(initialData) : null
  )
  const [loading, setLoading] = useState(!initialData)
  const [detailsLoading, setDetailsLoading] = useState(!!initialData)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [flagStatus, setFlagStatus] = useState<'correct' | 'incorrect' | 'already_solved' | 'partial' | 'ratelimited' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [solves, setSolves] = useState<ChallengeSolve[]>([])
  const [solvesLoading, setSolvesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'challenge' | 'solves'>('challenge')
  const [loadError, setLoadError] = useState(false)

  const loadChallenge = useCallback(async () => {
    if (!initialData) setLoading(true)
    setLoadError(false)
    try {
      const res = await getChallenge(challengeId)
      const data = res && typeof res === 'object' ? res : null
      setChallenge(data)
    } catch {
      if (!initialData) setChallenge(null)
      setLoadError(true)
    } finally {
      setLoading(false)
      setDetailsLoading(false)
    }
  }, [challengeId, initialData])

  useEffect(() => {
    loadChallenge()
  }, [loadChallenge])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!challengeId) return
    setSubmitting(true)
    setMessage(null)
    setFlagStatus(null)
    try {
      const res = await submitFlag(challengeId, flag)
      const inner = res?.data ?? {}
      const status = (inner?.status as typeof flagStatus) ?? null
      const msg = inner?.message ?? 'Submission processed'
      setFlagStatus(status)
      setMessage(msg)
      if (status === 'correct' || status === 'already_solved') {
        setFlag('')
        setChallenge((prev) => (prev ? { ...prev, solved_by_me: true } : null))
        onSolved?.()
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit flag')
      setFlagStatus('incorrect')
    } finally {
      setSubmitting(false)
    }
  }

  async function openSolvesTab() {
    setActiveTab('solves')
    if (solves.length > 0) return
    setSolvesLoading(true)
    try {
      const data = await getChallengeSolves(challengeId)
      setSolves(data)
    } catch {
      setSolves([])
    } finally {
      setSolvesLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const modalContent = loading ? (
    <div className="challenge-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-busy="true">
      <div className="challenge-modal challenge-modal--yellow" onClick={(e) => e.stopPropagation()}>
        <div className="challenge-modal-loading">
          <span className="challenge-modal-loading-spinner" aria-hidden />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  ) : loadError || !challenge ? (
    <div className="challenge-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="challenge-modal challenge-modal--yellow challenge-modal--error" onClick={(e) => e.stopPropagation()}>
        <div className="challenge-modal-loading">
          <span>Failed to load challenge.</span>
          <button type="button" className="challenge-modal-submit-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  ) : (() => {
    const solvesCount = challenge.solves != null ? Number(challenge.solves) : 0
    const files = Array.isArray(challenge.files) ? challenge.files : []
    const connectionInfo = challenge.connection_info as string | undefined
    const isSolved = Boolean(challenge.solved_by_me)
    return (
    <div className="challenge-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="challenge-modal-title">
      <div className="challenge-modal challenge-modal--yellow" onClick={(e) => e.stopPropagation()}>
        <header className="challenge-modal-header">
          <div className="challenge-modal-tabs">
            <button
              type="button"
              className={`challenge-modal-tab ${activeTab === 'challenge' ? 'challenge-modal-tab--active' : ''}`}
              onClick={() => setActiveTab('challenge')}
            >
              Challenge
            </button>
            <button
              type="button"
              className={`challenge-modal-tab challenge-modal-tab-solves ${activeTab === 'solves' ? 'challenge-modal-tab--active' : ''}`}
              onClick={openSolvesTab}
            >
              {solvesCount} Solves
            </button>
          </div>
          <button type="button" className="challenge-modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="challenge-modal-body">
          {activeTab === 'challenge' ? (
            <>
              <h2 id="challenge-modal-title" className="challenge-modal-title">{challenge.name}</h2>
              <p className="challenge-modal-points">{challenge.value ?? challenge.points ?? 0} points</p>

              {challenge.attribution_html && (
                <div
                  className="challenge-modal-attribution"
                  dangerouslySetInnerHTML={{ __html: challenge.attribution_html }}
                />
              )}

              <div className="challenge-modal-description">
                {detailsLoading ? (
                  <p className="challenge-modal-description-text challenge-modal-description-text--muted">
                    <span className="challenge-modal-loading-spinner challenge-modal-loading-spinner--inline" aria-hidden />
                    Loading...
                  </p>
                ) : (challenge.description_html ?? challenge.description) ? (
                  <div
                    className="challenge-modal-description-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof (challenge.description_html ?? challenge.description) === 'string'
                          ? (challenge.description_html ?? challenge.description)!
                          : '',
                    }}
                  />
                ) : (
                  <p className="challenge-modal-description-text challenge-modal-description-text--muted">No description.</p>
                )}
              </div>

              {!detailsLoading && challenge.type === 'dynamic_docker' && (
                <WhaleInstanceControls
                  challengeId={challengeId}
                  challengeType={challenge.type}
                  variant="modal"
                />
              )}

              {!detailsLoading && connectionInfo && challenge.type !== 'dynamic_docker' && (
                <section className="challenge-modal-section">
                  <h3 className="challenge-modal-section-title">Connection Info</h3>
                  <div className="challenge-modal-connection-wrap">
                    {connectionInfo.startsWith('http') ? (
                      <a
                        href={connectionInfo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="challenge-modal-connection-link"
                      >
                        Open connection
                      </a>
                    ) : (
                      <>
                        <code className="challenge-modal-connection-code">{connectionInfo}</code>
                        <button
                          type="button"
                          className="btn ghost challenge-modal-connection-copy"
                          onClick={() => navigator.clipboard?.writeText(connectionInfo)}
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </section>
              )}

              {!detailsLoading &&
                typeof challenge.max_attempts === 'number' &&
                challenge.max_attempts > 0 &&
                !isSolved && (
                  <p className="challenge-modal-attempts">
                    Attempts: {challenge.attempts ?? 0}/{challenge.max_attempts}
                  </p>
                )}

              {!detailsLoading && files.length > 0 && (
                <section className="challenge-modal-section">
                  <p className="challenge-modal-files-label">{challenge.category || 'Files'}</p>
                  <div className="challenge-modal-files">
                    {files.map((url, i) => {
                      const base = getBackendBaseUrl()
                      const pathOnly = typeof url === 'string' ? url.split('?')[0] : ''
                      const needsBase = base && pathOnly.startsWith('/') && !url.startsWith('http')
                      const fileUrl = needsBase ? base + url : (typeof url === 'string' ? url : '')
                      const fileName = pathOnly.split('/').filter(Boolean).pop() || `File ${i + 1}`
                      const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(pathOnly)
                      return (
                        <div key={i} className="challenge-modal-file-wrap">
                          {isImage && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="challenge-modal-file-preview-link">
                              <img src={fileUrl} alt={fileName} className="challenge-modal-file-preview" loading="lazy" />
                            </a>
                          )}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={fileName}
                          className="challenge-modal-download-btn"
                        >
                          <span className="challenge-modal-download-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </span>
                          <span className="challenge-modal-download-filename">{fileName}</span>
                          <span className="challenge-modal-download-label">Download</span>
                        </a>
                      </div>
                      )
                    })}
                  </div>
                </section>
              )}

              <section className="challenge-modal-section challenge-modal-submit-section">
            {isSolved ? (
              <p className="challenge-modal-already-solved">You have already solved this challenge.</p>
            ) : (
              <form onSubmit={handleSubmit} className="challenge-modal-flag-form">
                <input
                  type="text"
                  placeholder="Flag"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="challenge-modal-flag-input"
                  required
                  autoComplete="off"
                />
                <button type="submit" className="challenge-modal-submit-btn" disabled={submitting}>
                  Submit
                </button>
                {message != null && (
                  <p
                    className={`challenge-modal-message challenge-modal-message--${flagStatus === 'correct' || flagStatus === 'already_solved' ? 'success' : flagStatus === 'incorrect' ? 'error' : 'info'}`}
                    role="alert"
                  >
                    {message}
                  </p>
                )}
              </form>
            )}
              </section>
            </>
          ) : (
            <div className="challenge-modal-solves-tab">
              <h3 className="challenge-modal-section-title">Users who solved this challenge</h3>
              {solvesLoading ? (
                <p className="challenge-modal-solves-loading">
                  <span className="challenge-modal-loading-spinner challenge-modal-loading-spinner--inline" aria-hidden />
                  Loading...
                </p>
              ) : solves.length > 0 ? (
                <ul className="challenge-modal-solves-list">
                  {solves.map((s, i) => (
                    <li key={s.account_id ?? i} className="challenge-modal-solve-item">
                      {s.account_url ? (
                        <a href={s.account_url} target="_blank" rel="noopener noreferrer" className="challenge-modal-solve-link">
                          {s.name}
                        </a>
                      ) : (
                        <span>{s.name}</span>
                      )}
                      <span className="challenge-modal-solve-date">
                        {s.date
                          ? new Date(s.date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="challenge-modal-solves-empty">No solves yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    )
  })()

  return modalContent
}
