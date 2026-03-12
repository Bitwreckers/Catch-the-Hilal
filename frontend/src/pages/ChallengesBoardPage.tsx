import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { getChallenges } from '../api/challenges'
import { ErrorBoundary } from '../components/ErrorBoundary'
import paImg from '../assets/PA.png'

const ChallengeModal = lazy(() => import('../components/ChallengeModal').then((m) => ({ default: m.ChallengeModal })))

type Difficulty = 'easy' | 'medium' | 'hard'

interface RichChallenge {
  id: number
  name: string
  category: string
  value: number
  solved: boolean
  difficulty: Difficulty
}

function inferDifficulty(value: number): Difficulty {
  if (value <= 200) return 'easy'
  if (value <= 400) return 'medium'
  return 'hard'
}

export function ChallengesBoardPage() {
  const { user, loading } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<RichChallenge[]>([])
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [modalChallengeId, setModalChallengeId] = useState<number | null>(null)

  const refreshChallenges = useCallback(() => {
    getChallenges()
      .then((data: any[]) => {
        const mapped: RichChallenge[] = (data ?? []).map((c: any) => {
          const value = c.value ?? c.points ?? 0
          return {
            id: c.id,
            name: c.name,
            category: c.category,
            value,
            solved: Boolean(c.solved ?? c.solved_by_me),
            difficulty: inferDifficulty(value),
          }
        })
        setItems(mapped)
      })
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setChallengesLoading(true)
    getChallenges()
      .then((data: any[]) => {
        if (cancelled) return
        const mapped: RichChallenge[] = (data ?? []).map((c: any) => {
          const value = c.value ?? c.points ?? 0
          return {
            id: c.id,
            name: c.name,
            category: c.category,
            value,
            solved: Boolean(c.solved ?? c.solved_by_me),
            difficulty: inferDifficulty(value),
          }
        })
        setItems(mapped)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setChallengesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!heroRef.current || prefersReducedMotion) return
    const ctx = gsap.context(() => {
      gsap.from('.challenges-hero-content h1', {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      })
      gsap.from('.challenges-hero-content p', {
        y: 16,
        opacity: 0,
        duration: 0.5,
        delay: 0.15,
        ease: 'power2.out',
      })
    }, heroRef)
    return () => ctx.revert()
  }, [prefersReducedMotion])

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, RichChallenge[]>()
    for (const c of items) {
      const cat = c.category || 'Uncategorized'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(c)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => b.value - a.value)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  if (!loading && !user) {
    return (
      <div className="page challenges-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view the challenges.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  const hasTeam = user != null && (user.team_id != null || (user as { team?: { id: number } }).team != null)
  if (!loading && user && !hasTeam) {
    return (
      <div className="page challenges-page">
        <div className="page-auth-required page-require-team">
          <p>You need to join a team to view and attempt challenges.</p>
          <Link to="/team" className="btn primary">Go to Team</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page challenges-page">
      <div className="page-full-width">
        <header ref={heroRef} className="challenges-hero">
          <div className="challenges-hero-image-wrap">
            <img src={paImg} alt="" className="challenges-hero-image" />
          </div>
          <div className="challenges-hero-overlay" aria-hidden="true" />
          <div className="challenges-hero-content">
            <h1>Challenges</h1>
            <p>Browse the board, filter by category or difficulty, and capture the flags.</p>
          </div>
        </header>

        {challengesLoading && (
        <section className="challenges-loading" aria-busy="true">
          <div className="challenges-skeleton-grid" />
        </section>
      )}

      {!challengesLoading && (
        <>
      <section className="challenges-list-section">
        <h2 className="section-heading-sm">All challenges</h2>
        {items.length === 0 ? (
          <p className="challenges-empty">No challenges yet.</p>
        ) : (
          groupedByCategory.map(([categoryName, challenges]) => (
            <div key={categoryName} className="challenges-category-block">
              <h3 className="challenges-category-title">{categoryName}</h3>
              <div className="challenges-grid">
                {challenges.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setModalChallengeId(c.id)
                    }}
                    className={`challenge-card ${c.solved ? 'challenge-card-solved' : ''}`}
                  >
                    {c.solved && (
                      <span className="challenge-card-check" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    <article>
                      <span className="challenge-name">{c.name}</span>
                      <span className="challenge-points">{c.value}</span>
                    </article>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
        </>
      )}
      </div>
      {modalChallengeId != null && (
        <ErrorBoundary
          fallback={
            <div className="challenge-modal-overlay" onClick={() => setModalChallengeId(null)} role="alert">
              <div className="challenge-modal challenge-modal--yellow" onClick={(e) => e.stopPropagation()}>
                <p className="challenge-modal-loading">Something went wrong.</p>
                <button type="button" className="challenge-modal-submit-btn" onClick={() => setModalChallengeId(null)}>
                  Close
                </button>
              </div>
            </div>
          }
        >
          <Suspense fallback={
            <div className="challenge-modal-overlay" onClick={() => setModalChallengeId(null)}>
              <div className="challenge-modal challenge-modal--yellow" onClick={(e) => e.stopPropagation()}>
                <div className="challenge-modal-loading">Loading...</div>
              </div>
            </div>
          }>
            <ChallengeModal
              key={modalChallengeId}
              challengeId={modalChallengeId}
              onClose={() => setModalChallengeId(null)}
              onSolved={refreshChallenges}
              initialData={items.find((i) => i.id === modalChallengeId) ?? undefined}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}
