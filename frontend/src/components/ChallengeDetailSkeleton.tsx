import './ChallengeDetailSkeleton.css'

export function ChallengeDetailSkeleton() {
  return (
    <div className="challenge-detail-skeleton" aria-hidden="true">
      <header className="challenge-detail-skeleton-header">
        <div className="challenge-detail-skeleton-meta">
          <span className="challenge-detail-skeleton-pill" />
          <span className="challenge-detail-skeleton-pill challenge-detail-skeleton-pill-sm" />
        </div>
        <div className="challenge-detail-skeleton-title" />
      </header>

      <section className="challenge-detail-skeleton-card">
        <div className="challenge-detail-skeleton-card-title" />
        <div className="challenge-detail-skeleton-lines">
          <div className="challenge-detail-skeleton-line" />
          <div className="challenge-detail-skeleton-line" />
          <div className="challenge-detail-skeleton-line challenge-detail-skeleton-line-short" />
        </div>
      </section>

      <section className="challenge-detail-skeleton-card">
        <div className="challenge-detail-skeleton-card-title" />
        <div className="challenge-detail-skeleton-form">
          <div className="challenge-detail-skeleton-input" />
          <div className="challenge-detail-skeleton-btn" />
        </div>
      </section>
    </div>
  )
}
