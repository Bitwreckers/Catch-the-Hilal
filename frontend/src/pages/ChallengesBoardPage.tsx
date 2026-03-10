import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { getChallenges } from '../api/challenges'
import { JeopardyGrid } from '../components/JeopardyGrid'
import type { JeopardyChallenge } from '../components/JeopardyGrid'
import paImg from '../assets/PA.png'

type Difficulty = 'easy' | 'medium' | 'hard'

interface RichChallenge extends JeopardyChallenge {
  difficulty: Difficulty
}

function inferDifficulty(value: number): Difficulty {
  if (value <= 200) return 'easy'
  if (value <= 400) return 'medium'
  return 'hard'
}

const CHALLENGES_PER_PAGE = 24

export function ChallengesBoardPage() {
  const { user, loading } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<RichChallenge[]>([])
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [challengesPage, setChallengesPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all')
  const [sortBy, setSortBy] = useState<'points-desc' | 'points-asc' | 'name'>('points-desc')

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

  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((c) => {
      if (c.category) set.add(c.category)
    })
    return Array.from(set).sort()
  }, [items])

  const filteredChallenges = useMemo(() => {
    let out = [...items]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      out = out.filter((c) => c.name.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q)))
    }

    if (selectedCategory !== 'all') {
      out = out.filter((c) => c.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      out = out.filter((c) => c.difficulty === selectedDifficulty)
    }

    out.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'points-asc') {
        return a.value - b.value
      }
      return b.value - a.value
    })

    return out
  }, [items, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const total = items.length
  const solvedCount = items.filter((c) => c.solved).length
  const openCount = total - solvedCount

  const paginatedChallenges = useMemo(() => {
    const start = (challengesPage - 1) * CHALLENGES_PER_PAGE
    return filteredChallenges.slice(start, start + CHALLENGES_PER_PAGE)
  }, [filteredChallenges, challengesPage])
  const challengesTotalPages = Math.max(1, Math.ceil(filteredChallenges.length / CHALLENGES_PER_PAGE))

  useEffect(() => {
    setChallengesPage(1)
  }, [searchTerm, selectedCategory, selectedDifficulty])

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
          <div className="challenges-skeleton-stats" />
          <div className="challenges-skeleton-grid" />
        </section>
      )}

      {!challengesLoading && (
        <>
      <section className="challenges-stats-row">
        <div className="challenges-stat-card">
          <span className="challenges-stat-label">Total</span>
          <span className="challenges-stat-value">{total}</span>
        </div>
        <div className="challenges-stat-card">
          <span className="challenges-stat-label">Solved</span>
          <span className="challenges-stat-value">{solvedCount}</span>
        </div>
        <div className="challenges-stat-card">
          <span className="challenges-stat-label">Open</span>
          <span className="challenges-stat-value">{openCount}</span>
        </div>
      </section>

      <section className="challenges-controls">
        <div className="challenges-search">
          <input
            type="search"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search challenges"
          />
        </div>
        <div className="challenges-filters">
          <label>
            Category
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | 'all')}
              aria-label="Filter by difficulty"
            >
              <option value="all">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label>
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Sort challenges">
              <option value="points-desc">Points (high → low)</option>
              <option value="points-asc">Points (low → high)</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </section>

      <section className="challenges-board-section">
        <h2 className="section-heading-sm">Jeopardy board</h2>
        <JeopardyGrid challenges={items} />
      </section>

      <section className="challenges-list-section">
        <h2 className="section-heading-sm">All challenges</h2>
        <div className="challenges-grid">
          {paginatedChallenges.map((c, i) => (
            <Link
              key={`${c.id}-${i}`}
              to={`/challenges/${c.id}`}
              className={`challenge-card ${c.solved ? 'challenge-card-solved' : ''}`}
            >
              <article>
                <header className="challenge-card-header">
                  <span className="challenge-name">{c.name}</span>
                  <span className="challenge-points">{c.value} pts</span>
                </header>
                <div className="challenge-meta">
                  <span className="challenge-pill challenge-pill-category">{c.category}</span>
                  <span className={`challenge-pill challenge-pill-diff diff-${c.difficulty}`}>
                    {c.difficulty}
                  </span>
                  <span
                    className={`challenge-pill challenge-pill-status ${c.solved ? 'status-solved' : 'status-open'}`}
                  >
                    {c.solved ? 'Solved' : 'Open'}
                  </span>
                </div>
              </article>
            </Link>
          ))}
          {filteredChallenges.length === 0 && (
            <p className="challenges-empty">No challenges match your filters yet.</p>
          )}
        </div>
        {filteredChallenges.length > CHALLENGES_PER_PAGE && (
          <nav className="pagination challenges-pagination" aria-label="Challenges pagination">
            <button
              type="button"
              className="btn ghost pagination-btn"
              disabled={challengesPage <= 1}
              onClick={() => setChallengesPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {challengesPage} of {challengesTotalPages} ({filteredChallenges.length} challenges)
            </span>
            <button
              type="button"
              className="btn ghost pagination-btn"
              disabled={challengesPage >= challengesTotalPages}
              onClick={() => setChallengesPage((p) => Math.min(challengesTotalPages, p + 1))}
            >
              Next
            </button>
          </nav>
        )}
      </section>
        </>
      )}
    </div>
  )
}
