import { useCallback, useEffect, useState } from 'react'
import {
  getWhaleContainer,
  startWhaleContainer,
  renewWhaleContainer,
  destroyWhaleContainer,
  type WhaleContainerData,
} from '../api/whale'

interface WhaleInstanceControlsProps {
  challengeId: number
  challengeType?: string
  variant?: 'page' | 'modal'
}

export function WhaleInstanceControls({
  challengeId,
  challengeType,
  variant = 'page',
}: WhaleInstanceControlsProps) {
  if (challengeType !== 'dynamic_docker') return null

  const [container, setContainer] = useState<WhaleContainerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchContainer = useCallback(async () => {
    try {
      setError(null)
      const res = await getWhaleContainer(challengeId)
      if (res.success && res.data && Object.keys(res.data).length > 0) {
        setContainer(res.data)
      } else {
        setContainer(null)
      }
    } catch {
      setContainer(null)
      setError('Could not load instance status')
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    fetchContainer()
  }, [fetchContainer])

  async function handleStart() {
    setActionLoading('start')
    setError(null)
    try {
      const res = await startWhaleContainer(challengeId)
      if (res.success) {
        await fetchContainer()
      } else {
        setError(res.message ?? 'Failed to start instance')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to start instance')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRenew() {
    setActionLoading('renew')
    setError(null)
    try {
      const res = await renewWhaleContainer(challengeId)
      if (res.success) {
        await fetchContainer()
      } else {
        setError(res.message ?? 'Failed to renew instance')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to renew instance')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDestroy() {
    setActionLoading('destroy')
    setError(null)
    try {
      const res = await destroyWhaleContainer()
      if (res.success) {
        setContainer(null)
      } else {
        setError(res.message ?? 'Failed to stop instance')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to stop instance')
    } finally {
      setActionLoading(null)
    }
  }

  const sectionClass = variant === 'modal' ? 'challenge-modal-section' : 'challenge-connection-section'

  if (loading) {
    return (
      <section className={`${sectionClass} whale-instance-section`}>
        <h3 className={variant === 'modal' ? 'challenge-modal-section-title' : 'challenge-section-label'}>
          Instance
        </h3>
        <p className="whale-instance-loading">Loading instance status...</p>
      </section>
    )
  }

  return (
    <section className={`${sectionClass} whale-instance-section`}>
      <h3 className={variant === 'modal' ? 'challenge-modal-section-title' : 'challenge-section-label'}>
        Instance
      </h3>
      {container ? (
        <div className="whale-instance-active">
          {container.user_access && (
            <div className="whale-instance-access">
              {(() => {
                const access = container.user_access
                const urlMatch = access.match(/href=["']([^"']+)["']/) || (access.startsWith('http') ? [null, access] : null)
                const instanceUrl = urlMatch?.[1] ?? (access.startsWith('http') ? access : null)
                if (instanceUrl) {
                  return (
                    <a
                      href={instanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whale-instance-link"
                      onClick={(e) => {
                        e.preventDefault()
                        window.open(instanceUrl, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      Open connection
                    </a>
                  )
                }
                return (
                  <>
                    <code className="whale-instance-code">{access}</code>
                    <button
                      type="button"
                      className="btn ghost whale-instance-copy"
                      onClick={() => navigator.clipboard?.writeText(access ?? '')}
                    >
                      Copy
                    </button>
                  </>
                )
              })()}
            </div>
          )}
          {typeof container.remaining_time === 'number' && container.remaining_time >= 0 && (
            <p className="whale-instance-time">Time remaining: {Math.floor(container.remaining_time / 60)}m {container.remaining_time % 60}s</p>
          )}
          <div className="whale-instance-actions">
            <button
              type="button"
              className="btn primary whale-instance-btn"
              onClick={handleRenew}
              disabled={!!actionLoading}
            >
              {actionLoading === 'renew' ? 'Renewing...' : 'Renew'}
            </button>
            <button
              type="button"
              className="btn ghost whale-instance-btn"
              onClick={handleDestroy}
              disabled={!!actionLoading}
            >
              {actionLoading === 'destroy' ? 'Stopping...' : 'Stop instance'}
            </button>
          </div>
        </div>
      ) : (
        <div className="whale-instance-idle">
          <p className="whale-instance-hint">Start an isolated container for this challenge.</p>
          <button
            type="button"
            className="btn primary whale-instance-btn whale-instance-start-btn"
            onClick={handleStart}
            disabled={!!actionLoading}
          >
            {actionLoading === 'start' ? 'Starting...' : 'Start instance'}
          </button>
        </div>
      )}
      {error && <p className="whale-instance-error" role="alert">{error}</p>}
    </section>
  )
}
