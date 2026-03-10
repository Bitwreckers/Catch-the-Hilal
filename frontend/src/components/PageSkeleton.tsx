import './PageSkeleton.css'

interface PageSkeletonProps {
  /** Show a header block (title + subtitle) */
  withHeader?: boolean
  /** Number of content blocks (e.g. cards or sections) */
  blocks?: number
  className?: string
}

export function PageSkeleton({ withHeader = true, blocks = 2, className = '' }: PageSkeletonProps) {
  return (
    <div className={`page-skeleton ${className}`.trim()}>
      {withHeader && (
        <header className="page-skeleton-header">
          <div className="page-skeleton-line page-skeleton-title" />
          <div className="page-skeleton-line page-skeleton-subtitle" />
        </header>
      )}
      <div className="page-skeleton-content">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className="page-skeleton-block" />
        ))}
      </div>
    </div>
  )
}
