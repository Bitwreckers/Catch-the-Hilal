import './TableSkeleton.css'

interface TableSkeletonProps {
  /** Number of columns */
  columns?: number
  /** Number of rows */
  rows?: number
  className?: string
}

export function TableSkeleton({ columns = 4, rows = 10, className = '' }: TableSkeletonProps) {
  return (
    <div className={`table-skeleton-wrap ${className}`.trim()}>
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="table-skeleton-cell table-skeleton-head" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx}>
                  <div
                    className="table-skeleton-cell table-skeleton-body"
                    style={{ width: colIdx === 0 ? '70%' : undefined }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
